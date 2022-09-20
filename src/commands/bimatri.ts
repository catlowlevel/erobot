import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { Bimatri } from "../lib/bimatri";

@Command("bimatri", {
    description: "",
    usage: "",
    aliases: ["bima", "3", "tri"],
})
export default class extends BaseCommand {
    getOptions(flags: string[]) {
        const type = this.getFlag(flags, "--type", ["add-number", "get-account"]);
        const id = this.getFlag(flags, "--id");
        const nohp = this.getFlag(flags, "--nohp");
        return { type, id, nohp };
    }

    public override execute = async (M: Message, { args, flags }: IArgs): Promise<any> => {
        flags = flags.filter((f) => f.startsWith("--type") || f.startsWith("--id") || f.startsWith("--nohp"));
        if (!M.sender.jid) throw new Error("sender jid is not defined");
        const bima = new Bimatri();
        await bima.db.waitInit();
        const data = bima.db.data[M.sender.jid];
        let numbers: string[] = [];
        if (data) {
            numbers = data.map((d) => d.msisdn);
        }

        const opts = this.getOptions(flags);
        console.log("opts.id,M.sender.jid", opts.id, M.sender.jid);
        switch (opts.type) {
            case "add-number": {
                if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
                await M.reply("Kirim nomor tri kamu\nEx : 6289**********");
                const messages = await this.handler.getNewMessages(M, 1, 2000 * 60, true);
                if (messages.length <= 0) return M.reply("Kamu tidak mengirim nomor tri kamu\nMembatalkan...");
                const nohpMsg = messages[0];
                const nohp = nohpMsg.content;
                if (numbers.includes(nohp)) return M.reply("Nomor ini sudah tersimpan!");
                try {
                    await bima.requestOtp(nohp);
                } catch (error) {
                    console.log("error", error);
                    return M.reply("Gagal meminta OTP!");
                }
                await nohpMsg.reply("Kirim kode OTP yang kamu terima");
                const otpMessages = await this.handler.getNewMessages(M, 1, 2000 * 60, true);
                if (messages.length <= 0) return M.reply("Kamu tidak mengirim kode OTP\nMembatalkan...");
                const otpMsg = otpMessages[0];
                const otp = otpMsg.content;
                try {
                    const loginData = await bima.loginOtp(nohp, otp);
                    if (!data) bima.db.data[M.sender.jid] = [];
                    bima.db.data[M.sender.jid].push(loginData);
                    await bima.db.write();
                    const account = await bima.accountData(nohp, loginData);
                    return M.reply(JSON.stringify(account.packageList, null, 2));
                } catch (error) {
                    console.log("error", error);
                    return M.reply("Gagal Login!");
                }
            }
            case "get-account": {
                if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
                if (!opts.nohp) return M.reply("No HP diperlukan!");
                const loginData = data.find((d) => d.msisdn === opts.nohp);
                if (!loginData) return M.reply("Tidak dapat menemukan data!");
                const account = await bima.accountData(opts.nohp, loginData);
                return M.reply(JSON.stringify(account.packageList, null, 2));
            }

            default: {
            }
        }

        let text = data ? `Select Number` : "You have no saved number!";

        const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "Saved number" }];
        data?.forEach((d) => {
            sections[0].rows!.push({
                title: d.msisdn,
                rowId: `.bimatri --type=get-account --id=${M.sender.jid} --nohp=${d.msisdn}`,
            });
        });

        sections[0].rows!.push({
            title: "Add Number",
            rowId: `.bimatri --type=add-number --id=${M.sender.jid}`,
        });

        return this.client.sendMessage(
            M.from,
            {
                text,
                buttons: data
                    ? undefined
                    : [
                          {
                              buttonText: { displayText: "Add Number" },
                              buttonId: `.bimatri --type=add-number --id=${M.sender.jid}`,
                              type: 0,
                          },
                      ],
                sections: data ? sections : undefined,
                buttonText: "List Number",
            },
            { quoted: M.message }
        );
    };
}
