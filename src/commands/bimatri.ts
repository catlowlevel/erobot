import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { Bimatri } from "../lib/bimatri";
import { LoginData } from "../lib/bimatri/types";

type Options = ReturnType<Cmd["getOptions"]>;

@Command("bimatri", {
    description: "",
    usage: "",
    aliases: ["bima", "3", "tri"],
})
export default class Cmd extends BaseCommand {
    async handleReset(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        const data = bima.db.data[M.sender.jid];
        if (!data)
            return this.client.sendMessage(
                M.from,
                {
                    text: "Kamu tidak punya nomor yang tersimpan!",
                    buttons: [
                        {
                            buttonText: { displayText: "Tambahkan nomor 3" },
                            buttonId: `.bimatri --type=add-number --id=${M.sender.jid}`,
                            type: 0,
                        },
                    ],
                },
                { quoted: M.message }
            );

        await M.reply("Balas YES untuk konfirmasi!");
        const messages = await this.handler.getNewMessages(M, 1, 1000 * 30, true);
        if (messages.length <= 0) return M.reply("Gagal melakukan konfirmasi!");
        const confirmMsg = messages[0];
        if (confirmMsg.content.toLocaleLowerCase() !== "yes") return confirmMsg.reply("Gagal melakukan konfirmasi!");

        const numbers = data.map((d) => d.msisdn);
        delete bima.db.data[M.sender.jid];
        await bima.db.write();
        return confirmMsg.reply(`${numbers.join(", ")} berhasil dihapus dari database!`);
    }
    async handleGetAccount(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        if (!opts.nohp) return M.reply("No HP diperlukan!");

        const data = bima.db.data[M.sender.jid];
        const loginData = data.find((d) => d.msisdn === opts.nohp);
        if (!loginData) return M.reply("Tidak dapat menemukan data!");
        return this.handleAccount(M, bima, loginData);
    }
    async handleAccount(M: Message, bima: Bimatri, loginData: LoginData) {
        try {
            const account = await bima.accountData(loginData);
            const pulsa = account.balanceTotal;
            let text = `Sisa pulsa : ${pulsa}\n`;
            text += `Aktif sampai : ${account.validity}\n=======================\n`;
            account.packageList.forEach((paket) => {
                text += `${paket.name}\n`;
                paket.detail.forEach((d) => {
                    text += `${d.value} | ${d.validity}\n`;
                });
                text += `=======================\n`;
            });
            return this.client.sendMessage(
                M.from,
                {
                    text,
                    buttons: [
                        {
                            buttonText: { displayText: "Cek lagi" },
                            buttonId: `.bimatri --type=get-account --id=${M.sender.jid} --nohp=${loginData.msisdn}`,
                        },
                    ],
                },
                { quoted: M.message }
            );
        } catch (error) {
            console.error("error", error);
            return this.client.sendMessage(
                M.from,
                {
                    text: "Terjadi kesalahan saat mencoba mendapatkan data akun",
                    buttons: [
                        {
                            buttonText: { displayText: "Coba lagi" },
                            buttonId: `.bimatri --type=get-account --id=${M.sender.jid} --nohp=${loginData.msisdn}`,
                        },
                        //{
                        //buttonText: { displayText: "Relog" },
                        //buttonId: `.bimatri --type=get-account --id=${M.sender.jid} --nohp=${loginData.msisdn}`,
                        //},
                    ],
                },
                { quoted: M.message }
            );
        }
    }
    async handleAddNumber(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action!");
        const data = bima.db.data[M.sender.jid];
        let numbers: string[] = [];
        if (data) {
            numbers = data.map((d) => d.msisdn);
        }
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
            return nohpMsg.reply("Gagal meminta OTP!");
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
            return this.handleAccount(otpMsg, bima, loginData);
        } catch (error) {
            console.log("error", error);
            return otpMsg.reply("Gagal Login!");
        }
    }
    getOptions(flags: string[]) {
        const type = this.getFlag(flags, "--type", ["add-number", "get-account", "reset"]);
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

        const opts = this.getOptions(flags);
        console.log("opts.id,M.sender.jid", opts.id, M.sender.jid);
        switch (opts.type) {
            case "add-number": {
                return this.handleAddNumber(M, bima, opts);
            }
            case "get-account": {
                return this.handleGetAccount(M, bima, opts);
            }
            case "reset": {
                return this.handleReset(M, bima, opts);
            }

            default: {
            }
        }

        let text = data?.length > 0 ? `Pilih nomor yang tersimpan` : "Kamu tidak punya nomor yang tersimpan!";

        const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "Nomor tersimpan" }];
        data?.forEach((d) => {
            sections[0].rows!.push({
                title: d.msisdn,
                rowId: `.bimatri --type=get-account --id=${M.sender.jid} --nohp=${d.msisdn}`,
            });
        });

        sections[0].rows!.push({
            title: "Tambahkan nomor 3",
            rowId: `.bimatri --type=add-number --id=${M.sender.jid}`,
        });
        sections[0].rows!.push({
            title: "Reset",
            rowId: `.bimatri --type=reset --id=${M.sender.jid}`,
        });

        return this.client.sendMessage(
            M.from,
            {
                text,
                buttons: data
                    ? undefined
                    : [
                          {
                              buttonText: { displayText: "Tambahkan nomor 3" },
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
