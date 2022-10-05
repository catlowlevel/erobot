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
        if (args.args.length > 0 && args.args?.[0].startsWith("collect")) {
            //return FM.collectMessages({ timeout: 1000 * 60, max: 1 }, async (SM) => {
            //await FM.reply(SM.sender.username + " said " + SM.content);
            //return SM.collectMessages({ timeout: 1000 * 60, max: 1 }, async (TM) => {
            //return TM.reply("Done");
            //});
            //});

            const messages = await M.collectMessages({ timeout: 1000 * 30, max: 5, senderOnly: true }, (M) => {
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
}
