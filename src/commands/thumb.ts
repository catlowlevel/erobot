import { downloadMediaMessage } from "@adiwajshing/baileys";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("thumb", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, _args: IArgs): Promise<unknown> => {
        let buffer = await M.downloadQuotedMedia();
        if (!buffer && M.type !== "imageMessage") return M.reply("Not an image!");
        if (!buffer) buffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
        const result = await this.client.utils.yandexThumbnail(buffer);
        const imageBuffer = await this.client.utils.getBuffer(result.url);

        return M.reply(imageBuffer, "image", undefined, undefined, JSON.stringify(result));
    };

    public handleError = async (_M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
