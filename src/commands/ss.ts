import getUrls from "get-urls";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { ssQueue } from "../lib/puppeteer";

@Command("ss", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        const urls = getUrls(args.context);
        if (urls.size <= 0) return M.reply("Url required!");
        let width = 1200;
        let height = 800;
        for (const arg of args.args) {
            if (arg.startsWith("w:")) {
                try {
                    const value = arg.split(":")[1];
                    width = Number(value);
                } catch {}
            }

            if (arg.startsWith("h:")) {
                try {
                    const value = arg.split(":")[1];
                    height = Number(value);
                } catch {}
            }
        }
        const url = urls.values().next().value;
        console.log("url", url);
        const buffer = await ssQueue(url, width, height, (n) => {
            console.log(n);
            if (n > 0) M.reply(`Queue : ${n}`);
        });
        return M.reply(buffer, "image");
    };
}
