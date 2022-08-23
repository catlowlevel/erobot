import { downloadMediaMessage } from "@adiwajshing/baileys";
import Sticker, { StickerTypes } from "wa-sticker-formatter/dist";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
    name = "sticker";
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (M.type !== "imageMessage") return M.reply("This command only works on images");

        const buffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;

        const author = args.args[0] || "";
        const packName = args.args[1] || "";

        const sticker = new Sticker(buffer)
            .setPack(packName)
            .setAuthor(author)
            .setType(StickerTypes.FULL)
            .setQuality(70);

        const stickerBUffer = await sticker.toBuffer();
        return M.reply(stickerBUffer, "sticker");
    };
}
