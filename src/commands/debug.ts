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
        if (args.args.length > 0 && args.args?.[0].startsWith("process")) {
            const messages = await this.handler.getNewMessages(M, 5, 1000 * 15, true);
            messages.forEach((m) => m.replyQueue(m.content));
            return;
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
}
