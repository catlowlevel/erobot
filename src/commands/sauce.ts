import { downloadMediaMessage } from "@adiwajshing/baileys";
import { BaseCommand, Command, IArgs, Message } from "../core";
import { shortenUrl } from "../lib/bitly/api";
import { searchImages } from "../lib/puppeteer";

@Command("sauce", {
    description: "",
    usage: "",
    aliases: ["wimg", "findimg", "whatimage"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        let buffer = await M.downloadQuotedMedia();
        if (!buffer && M.type !== "imageMessage") return M.reply("Not an image!");
        if (!buffer) buffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
        let limit = 10;
        args.args.forEach((a) => {
            const num = Number(a);
            if (!isNaN(num) && num > 0) {
                limit = num;
            } else {
                console.log(`${a} is ${num}`);
            }
        });
        M.reply("_Searching..._");
        const yandexResult = await this.client.utils.yandexThumbnail(buffer);
        const result = await searchImages(yandexResult);
        console.log("limit", limit);
        console.log("result.length", result.length);

        for (const r of result.slice(0, limit)) {
            console.log(`sending : ${r.title}`);
            const image = await this.client.utils.getBuffer(r.thumb);
            const link = await shortenUrl(r.link);
            await this.client.sendMessageQueue(M.from, {
                image,
                caption: `*${r.title}*\n\n${link}`,
            });
        }
        return;
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
