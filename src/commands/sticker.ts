import { downloadMediaMessage, proto } from "@adiwajshing/baileys";
import Sticker, { StickerTypes } from "wa-sticker-formatter/dist";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { toRoundedImage } from "../lib/canvas";

@Command("sticker", {
    description: "Mengubah gambar menjadi sticker",
    usage: "sticker <author> <pack>",
    aliases: ["s", "stiker"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        // console.log(JSON.stringify(M.quoted, null, 2));
        let buffer: Buffer | undefined;
        // if (M.quoted) {
        //     const messageKeys = Object.keys(M.quoted.message);
        //     console.log("messageKeys", messageKeys);
        //     //@ts-ignore
        //     if (M.quoted.message[messageKeys[0]]?.mimetype?.startsWith("image/")) {
        //         const buffer = await M.downloadMediaMessage(M.quoted.message);

        //         const author = args.args[0] || "";
        //         const packName = args.args[1] || "";

        //         const sticker = new Sticker(buffer)
        //             .setPack(packName)
        //             .setAuthor(author)
        //             .setType(StickerTypes.FULL)
        //             .setQuality(70);

        //         const stickerBUffer = await sticker.toBuffer();
        //         return M.reply(stickerBUffer, "sticker");
        //     } else {
        //         return M.reply("This command only works on images");
        //     }
        // }
        if (M.type === "imageMessage") {
            buffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
        } else if (M.quoted) {
            const messageKeys = Object.keys(M.quoted.message);
            console.log("messageKeys", messageKeys);
            //@ts-ignore
            if (M.quoted.message[messageKeys[0]]?.mimetype?.startsWith("image/")) {
                buffer = await M.downloadMediaMessage(M.quoted.message);
            } else return M.reply("This command only works on images");
        } else return M.reply("This command only works on images");

        if (!buffer) return M.reply("Gagal mengunduh gambar!");

        let index = -1;
        const radiusArg = args.args.find((arg, i) => {
            if (arg.startsWith("r:")) {
                index = i;
                return true;
            }
        });
        if (radiusArg) {
            args.args.splice(index, 1);
            try {
                const value = radiusArg.split(":")[1] ?? "20";
                const radius = Number(value);
                buffer = await toRoundedImage(buffer, radius);
            } catch (error) {
                console.error(error);
            }
        }

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
