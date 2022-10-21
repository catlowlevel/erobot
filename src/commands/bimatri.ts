import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { Databse } from "../core/Database";
import { IArgs } from "../core/MessageHandler";
import { timeSince } from "../helper/utils";
import { Bimatri } from "../lib/bimatri";
import { LoginData } from "../lib/bimatri/types";

type Options = ReturnType<Cmd["getOptions"]>;

@Command("bimatri", {
    description: "",
    usage: "",
    aliases: ["bima", "3", "tri"],
})
export default class Cmd extends BaseCommand {
    async handleBeli(M: Message, bima: Bimatri, opts: Options) {
        throw new Error("Method not implemented.");
    }
    async handleRelog(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        const data = await this.database.bimaUser.find({ jid: M.sender.jid });
        const current = data.find((d) => d.jidPlusId === `${M.sender.jid}+${opts.nohp}`);
        if (!current) return M.reply(`Tidak dapat menemukan nomor ini : ${opts.nohp}`);
        return this.handleAddNumber(M, bima, opts);
    }
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
        const { messages } = await M.collectMessages({ timeout: 2000 * 60, max: 1, senderOnly: true });
        if (messages.length <= 0) return M.reply("Gagal melakukan konfirmasi!");
        const confirmMsg = messages[0];
        if (confirmMsg.content.toLocaleLowerCase() !== "yes") return confirmMsg.reply("Gagal melakukan konfirmasi!");

        const logoutResult: LoginData[] = [];
        for (const loginData of data) {
            try {
                const result = await bima.logout(loginData);
                logoutResult.push(result);
            } catch (error) {
                console.log(`${loginData.msisdn} fail to logout, ${error}`);
            }
        }
        console.log("logoutResult", logoutResult);
        const numbers = logoutResult.map((d) => d.msisdn);
        const result = await this.database.bimaUser.deleteMany({ jid: M.sender.jid! });
        console.log("result :>> ", result);
        // delete bima.db.data[M.sender.jid];
        // await bima.db.write();
        return confirmMsg.reply(`${numbers.join(", ")} berhasil dihapus dari database!`);
    }
    async handleGetAccount(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        if (!opts.nohp) return M.reply("No HP diperlukan!");

        // const data = bima.db.data[M.sender.jid];
        // const loginData = data.find((d) => d.msisdn === opts.nohp);
        // if (!loginData) return M.reply("Tidak dapat menemukan data!");
        const data = await this.database.bimaUser.findOne({ jidPlusId: `${M.sender.jid!}+${opts.nohp}` });
        if (!data) return M.reply("Tidak dapat menemukan data!");
        const loginData: LoginData = {
            accessToken: data.accessToken,
            appsflyerMsisdn: data.appsflyerMsisdn,
            balance: data.balance,
            callPlan: data.callPlan,
            creditLimit: data.creditLimit,
            language: data.language,
            msisdn: data.msisdn,
            profileColor: data.profileColor,
            profileTime: data.profileTime,
            secretKey: data.secretKey,
            status: data.status,
            subscriberType: data.subscriberType,
        };

        return this.handleAccount(M, bima, loginData);
    }
    async handleAccount(M: Message, bima: Bimatri, loginData: LoginData) {
        try {
            const account = await bima.accountData(loginData);
            const pulsa = account.balanceTotal;
            let text = `Nomor tri : ${account.msisdn}\n`;
            text += `Sisa pulsa : ${pulsa}\n`;
            const validity = timeSince(new Date(account.validity), 2, {
                day: "hari",
                hour: "jam",
                minute: "menit",
                month: "bulan",
                second: "detik",
                year: "tahun",
            });
            text += `Masa aktif : ${validity}\n=======================`;
            account.packageList
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach((paket) => {
                    if (paket.detail.length > 0) {
                        text += `\n${paket.name}`;
                        paket.detail.forEach((d) => {
                            text += `\n${d.value} | ${d.validity}\n`;
                        });
                        text += `=======================`;
                    }
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
                        {
                            buttonText: { displayText: "Relog" },
                            buttonId: `.bimatri --type=relog --id=${M.sender.jid} --nohp=${loginData.msisdn}`,
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
        const data = await this.database.bimaUser.find({ jid: M.sender.jid! });
        let numbers: string[] = [];
        if (data) {
            numbers = data.map((d) => d.msisdn);
        }
        await M.reply("Kirim nomor tri kamu\nEx : 6289**********");
        const { messages } = await M.collectMessages({ timeout: 2000 * 60, max: 1, senderOnly: true });
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
        const { messages: otpMessages } = await M.collectMessages({ timeout: 2000 * 60, max: 1, senderOnly: true });
        if (messages.length <= 0) return M.reply("Kamu tidak mengirim kode OTP\nMembatalkan...");
        const otpMsg = otpMessages[0];
        const otp = otpMsg.content;
        try {
            const loginData = await bima.loginOtp(nohp, otp);
            const bimaUser = new this.database.bimaUser({
                ...loginData,
                jidPlusId: `${M.sender.jid!}+${loginData.msisdn}`,
                jid: M.sender.jid!,
            });
            console.log("Saving to database...");
            await bimaUser.save();
            console.log("Data saved to database!");

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
        const type = this.getFlag(flags, "--type", ["add-number", "get-account", "relog", "beli", "reset"]);
        const id = this.getFlag(flags, "--id");
        const nohp = this.getFlag(flags, "--nohp");
        return { type, id, nohp };
    }

    public override execute = async (M: Message, { args, flags }: IArgs): Promise<any> => {
        flags = flags.filter((f) => f.startsWith("--type") || f.startsWith("--id") || f.startsWith("--nohp"));
        if (!M.sender.jid) throw new Error("sender jid is not defined");
        this.database = new Databse();
        const bima = new Bimatri();
        await bima.db.waitInit();
        // const data = bima.db.data[M.sender.jid];

        const data = await this.database.bimaUser.find({ jid: M.sender.jid! });

        const opts = this.getOptions(flags);
        console.log("opts.id,M.sender.jid", opts.id, M.sender.jid);
        switch (opts.type) {
            case "add-number": {
                return this.handleAddNumber(M, bima, opts);
            }
            case "get-account": {
                return this.handleGetAccount(M, bima, opts);
            }
            case "relog": {
                return this.handleRelog(M, bima, opts);
            }
            case "beli": {
                return this.handleBeli(M, bima, opts);
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

        const dataAvailable = data.length > 0;

        return this.client.sendMessage(
            M.from,
            {
                text,
                buttons: dataAvailable
                    ? undefined
                    : [
                          {
                              buttonText: { displayText: "Tambahkan nomor 3" },
                              buttonId: `.bimatri --type=add-number --id=${M.sender.jid}`,
                              type: 0,
                          },
                      ],
                sections: dataAvailable ? sections : undefined,
                buttonText: "List Number",
            },
            { quoted: M.message }
        );
    };
    database: Databse;
    products = [
        {
            name: "(NEW) 10GB 30 Hari",
            id: "25245",
            price: "15000",
        },
        {
            name: "(NEW) 15GB 30 Hari",
            id: "25459",
            price: "20000",
        },
        {
            name: "25GB 25rb (Diskon)",
            id: "22648",
            price: "25000",
        },
        {
            name: "25GB 24 Jam 20 Hari",
            id: "23160",
            price: "25000",
        },
        {
            name: "(NEW) 25GB 20 Hari",
            id: "25254",
            price: "25000",
        },
        {
            name: "(NEW) 25GB 20 Hari",
            id: "25264",
            price: "25000",
        },
        {
            name: "25GB 24 Jam 30 Hari",
            id: "23164",
            price: "29000",
        },
        {
            name: "(NEW) 25GB 30 Hari",
            id: "25267",
            price: "29000",
        },
        {
            name: "(NEW) 55GB 30 Hari",
            id: "25469",
            price: "50000",
        },
        {
            name: "(NEW) 65GB 30 Hari",
            id: "25690",
            price: "60000",
        },
        {
            name: "(NEW) 75GB 30 Hari",
            id: "25247",
            price: "75000",
        },
        {
            name: "(NEW) 90GB 30 Hari",
            id: "25476",
            price: "90000",
        },
        {
            name: "(NEW) 100GB 30 Hari",
            id: "25693",
            price: "90000",
        },
        {
            name: "AON 20GB 55ribu",
            id: "25340",
            price: "55000",
        },
        {
            name: "AON 50GB 99ribu",
            id: "25341",
            price: "99000",
        },
        {
            name: "3GB 3hr 9rb (Lebih Murah)",
            id: "22709",
            price: "9000",
        },
        {
            name: "52GB 65rb (Lebih Murah)",
            id: "22707",
            price: "65000",
        },
        {
            name: "117GB 105rb (Lebih Murah)",
            id: "22705",
            price: "105000",
        },
        {
            name: "150GB 135rb (Lebih Murah)",
            id: "22704",
            price: "135000",
        },
    ];
}
