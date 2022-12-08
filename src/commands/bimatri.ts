import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { BimaUser } from "../core/Database";
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
    handleListPaket(M: Message, bima: Bimatri, opts: Options) {
        const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "List Paket" }];
        this.products.forEach((p) => {
            if (sections[0].rows) {
                sections[0].rows.push({
                    title: `${p.name}`,
                    rowId: `.bimatri --type=beli --id=${M.sender.jid} --nohp=${opts.nohp} --productId=${p.id}`,
                    description: `Rp ${this.client.utils.formatNumber(Number(p.price), 0)}`,
                });
            }
        });
        return this.client.sendMessage(M.from, { text: "Daftar paket", buttonText: "List Paket Murah", sections });
    }
    async handleBeli(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        if (!opts.productId) return M.reply("Produk tidak tersedia!");
        const product = await bima.checkProduct(opts.productId);
        await M.reply(
            `${product.product.productDescription}\n\nHarga => *Rp ${product.product.productPrice}*\n\nBalas Y untuk konfirmasi`
        );
        const { messages, isTimeout } = await M.collectMessages({ timeout: 1000 * 30, senderOnly: true, max: 1 });
        if (isTimeout || messages.length <= 0) return M.reply("Tidak dapat menkonfirmasi\nMembatalkan...");
        const msg = messages[0];
        if (!msg.content.toLowerCase().startsWith("y")) return M.reply("Membatalkan...");

        // const data = await this.database.bimaUser.find({ jid: M.sender.jid });
        const data = await BimaUser.find({ where: { jid: M.sender.jid } });
        const current = data.find((d) => d.msisdn === opts.nohp);
        if (!current) return M.reply(`Tidak dapat menemukan nomor ini : ${opts.nohp}`);
        const loginData = current;
        const result = await bima.beliPaket(loginData, product);
        return M.reply(JSON.stringify(result, null, 2));
    }
    async handleRelog(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        const data = await BimaUser.find({ where: { jid: M.sender.jid } });
        const current = data.find((d) => d.msisdn === opts.nohp);
        if (!current) return M.reply(`Tidak dapat menemukan nomor ini : ${opts.nohp}`);
        const loginData = current;
        try {
            console.log("Trying to logout...");
            const result = await bima.logout(loginData);
            console.log("result :>> ", result);
        } catch (error) {
            console.log("Logout failed!");
        }
        const result = await BimaUser.delete({ jid: M.sender.jid, msisdn: opts.nohp });
        console.log("result", result);
        return this.handleAddNumber(M, bima, opts);
    }
    async handleReset(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        // const data = bima.db.data[M.sender.jid];
        const data = await BimaUser.find({ where: { jid: M.sender.jid } });
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
        const result = await BimaUser.delete({ jid: M.sender.jid });
        console.log("result :>> ", result);
        // delete bima.db.data[M.sender.jid];
        // await bima.db.write();
        return confirmMsg.reply(`${numbers.join(", ")} berhasil dihapus dari database!`);
    }
    async handleGetAccount(M: Message, bima: Bimatri, opts: Options) {
        if (!M.sender.jid) throw new Error("sender jid is not defined!");
        if (opts.id !== M.sender.jid) return M.reply("You are not authorized perform this action");
        if (!opts.nohp) return M.reply("No HP diperlukan!");

        //TODO: Parse previous message to be compared with current data
        const quoted =
            M.message.message?.buttonsResponseMessage?.contextInfo?.quotedMessage?.buttonsMessage?.contentText;
        if (quoted) {
            console.log(quoted);
            const sections = quoted.split("\n=======================");
            console.log("sections :>> ", sections);
            // const data: Record<string, any> = {};
            // lines.forEach((line) => {
            //     const [key, value] = line.split(":").map((s) => s.trim());
            //     if (key) {
            //         switch (key) {
            //             case "Nomor tri":
            //                 data["nohp"] = value;
            //                 break;
            //             case "Sisa pulsa":
            //                 data["pulsa"] = value;
            //                 break;
            //             case "Masa aktif":
            //                 data["masaAktif"] = value;
            //                 break;
            //             default:
            //                 break;
            //         }
            //     }
            // });
            // console.log(data);
        }

        // const data = bima.db.data[M.sender.jid];
        // const loginData = data.find((d) => d.msisdn === opts.nohp);
        // if (!loginData) return M.reply("Tidak dapat menemukan data!");
        const data = await BimaUser.findOne({ where: { jid: M.sender.jid, msisdn: opts.nohp } });
        if (!data) return M.reply("Tidak dapat menemukan data!");
        const loginData: LoginData = data;

        return this.handleAccount(M, bima, loginData);
    }
    async handleAccount(M: Message, bima: Bimatri, loginData: LoginData) {
        try {
            const account = await bima.accountData(loginData);
            const pulsa = account.balanceTotal;
            let text = `Nomor tri : ${account.msisdn}\n`;
            text += `Sisa pulsa : ${pulsa}\n`;
            const validity = this.client.utils.timeSince(new Date(account.validity), 2, {
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
                        {
                            buttonText: { displayText: "List paket" },
                            buttonId: `.bimatri --type=list-paket --id=${M.sender.jid} --nohp=${loginData.msisdn}`,
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
        const data = await BimaUser.find({ where: { jid: M.sender.jid } });
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
        if (otpMessages.length <= 0) return M.reply("Kamu tidak mengirim kode OTP\nMembatalkan...");
        const otpMsg = otpMessages[0];
        const otp = otpMsg.content;
        try {
            const loginData = await bima.loginOtp(nohp, otp);
            const bimaUser = BimaUser.create({
                ...loginData,
                jid: M.sender.jid,
            });
            console.log("Saving to database...");
            await bimaUser.save();
            console.log("Data saved to database!");

            // if (!data) bima.db.data[M.sender.jid] = [];
            // bima.db.data[M.sender.jid].push(loginData);
            // await bima.db.write();
            return this.handleAccount(otpMsg, bima, loginData);
        } catch (error) {
            console.log("error", error);
            return otpMsg.reply("Gagal Login!");
        }
    }
    getOptions(flags: string[]) {
        const type = this.getFlag(flags, "--type", [
            "add-number",
            "get-account",
            "relog",
            "list-paket",
            "beli",
            "reset",
        ]);
        const id = this.getFlag(flags, "--id");
        const nohp = this.getFlag(flags, "--nohp");
        const productId = this.getFlag(flags, "--productId");
        return { type, id, nohp, productId };
    }

    public override execute = async (M: Message, { args, flags }: IArgs): Promise<unknown> => {
        flags = flags.filter(
            (f) =>
                f.startsWith("--type") || f.startsWith("--id") || f.startsWith("--nohp") || f.startsWith("--productId")
        );
        if (!M.sender.jid) throw new Error("sender jid is not defined");
        const bima = new Bimatri();
        // await bima.db.waitInit();
        // const data = bima.db.data[M.sender.jid];

        const data = await BimaUser.find({ where: { jid: M.sender.jid } });

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
            case "list-paket": {
                return this.handleListPaket(M, bima, opts);
            }
            case "beli": {
                return this.handleBeli(M, bima, opts);
            }
            case "reset": {
                return this.handleReset(M, bima, opts);
            }
        }

        const text = data?.length > 0 ? `Pilih nomor yang tersimpan` : "Kamu tidak punya nomor yang tersimpan!";

        const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "Nomor tersimpan" }];
        data?.forEach((d) => {
            if (sections[0].rows) {
                sections[0].rows.push({
                    title: d.msisdn,
                    rowId: `.bimatri --type=get-account --id=${M.sender.jid} --nohp=${d.msisdn}`,
                });
            }
        });

        if (sections[0].rows) {
            sections[0].rows.push({
                title: "Tambahkan nomor 3",
                rowId: `.bimatri --type=add-number --id=${M.sender.jid}`,
            });
            sections[0].rows.push({
                title: "Reset",
                rowId: `.bimatri --type=reset --id=${M.sender.jid}`,
            });
        }

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
    // toLoginData = (data: TBimaModel): LoginData => ({
    //     accessToken: data.accessToken,
    //     appsflyerMsisdn: data.appsflyerMsisdn,
    //     balance: data.balance,
    //     callPlan: data.callPlan,
    //     creditLimit: data.creditLimit,
    //     language: data.language,
    //     msisdn: data.msisdn,
    //     profileColor: data.profileColor,
    //     profileTime: data.profileTime,
    //     secretKey: data.secretKey,
    //     status: data.status,
    //     subscriberType: data.subscriberType,
    // });
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
