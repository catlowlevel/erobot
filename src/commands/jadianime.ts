import { downloadMediaMessage } from "@adiwajshing/baileys";
import sharp from "sharp";
import { BaseCommand, Command, IArgs, Message } from "../core";
import { qqCropImage, qqDownload, qqRequest } from "../lib/qq-neural-anime";

@Command("jadianime", {
    description: "",
    usage: "",
    aliases: ["anime"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        let imageBuffer = await M.downloadQuotedMedia();
        if (M.type !== "imageMessage" && !imageBuffer) return M.reply("Image only"); //TODO: Handle quoted message
        if (!imageBuffer) {
            console.log("not a quoted message");
            imageBuffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
        }
        M.reply("_Wait_");
        let buffer = await sharp(imageBuffer).toFormat("jpeg").toBuffer();
        const result = await qqRequest(buffer.toString("base64"));
        buffer = await qqDownload(result.comparedImgUrl);
        buffer = await qqCropImage(buffer, "COMPARED");
        return M.reply(buffer, "image");
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
