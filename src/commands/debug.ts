import { exec } from "child_process";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("debug", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args.length > 0 && args.args?.[0].startsWith("err")) {
            throw new Error("debug error");
        }
        if (args.args.length > 0 && args.args?.[0].startsWith("edit")) {
            const { imageMessage } = M.message.message!;
            const { caption, ...rest } = imageMessage!;
            return this.client.relayMessage(M.from, { imageMessage: { ...rest, caption: args.args[1] } }, {});
        }
        if (args.args.length > 0 && args.args?.[0].startsWith("trace")) {
            if (!M.quoted) return M.reply("Quote a message!");
            if (!M.quoted.key.id) return M.reply("There's a problem with this message!");
            let depth = 1;
            for (const arg of args.args) {
                depth = Number(arg);
                console.log("depth", depth);
                if (depth === NaN) depth = 1;
            }

            let msg = this.client.getMessageFromStore(M.from, M.quoted.key.id);

            if (!msg) return M.reply("Can't find this message!");
            M = new Message(msg, this.client);

            depth--;

            while (depth--) {
                if (!M.quoted) {
                    console.log(`depth : ${depth + 1} | No quoted message`);
                    continue;
                }
                if (!M.quoted.key.id) continue;
                msg = this.client.getMessageFromStore(M.from, M.quoted.key.id);
                if (!msg) {
                    console.log(`depth : ${depth + 1} | msg is undefined`);
                    continue;
                }
                M = new Message(msg, this.client);
                console.log(`depth : ${depth + 1} | new message`);
            }
            return M.reply("Here");
            // const msgId = M.quoted.key.id!;
            // const msg = this.client.getMessageFromStore(M.from, msgId);
            // if (!msg) return M.reply("Can't trace this message!");
            // console.log("msg", msg);
            // const message = new Message(msg, this.client);
            // const msg2 = this.client.getMessageFromStore(message.from, message.quoted?.key.id!);

            //return this.client.relayMessage(M.from, msg2!.message!, {});
        }
        if (args.args.length > 0 && args.args?.[0].startsWith("collect")) {
            //return FM.collectMessages({ timeout: 1000 * 60, max: 1 }, async (SM) => {
            //await FM.reply(SM.sender.username + " said " + SM.content);
            //return SM.collectMessages({ timeout: 1000 * 60, max: 1 }, async (TM) => {
            //return TM.reply("Done");
            //});
            //});

            const { messages } = await M.collectMessages({ timeout: 1000 * 30, max: 5, senderOnly: true }, (M) => {
                M.reply(M.content);
                return;
            });
            return M.reply(`Total collected : ${messages.length}`);
        }
        if (args.args.length > 0 && args.args[0].startsWith("log")) {
            return new Promise<void>((res, rej) => {
                exec("pm2 logs erobot --raw --nostream", async (err, out) => {
                    if (err) rej(err);
                    await M.reply(out);
                    res();
                });
            });
        }
        if (M.quoted) {
            console.log(JSON.stringify(M.quoted, null, 2));
            return;
        }
        console.log(JSON.stringify(M.message, null, 2));
    };

    public handleError = async (M: Message, err: Error): Promise<any> => {
        return M.reply(err.message);
    };
}
