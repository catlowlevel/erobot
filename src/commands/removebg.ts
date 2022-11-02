import { downloadMediaMessage, proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { removeBg } from "../lib/removebg";

@Command("removebg", {
    description: "",
    usage: "",
    aliases: ["rebg", "remove", "nobg"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        try {
            if (!M.quoted) {
                if (M.type !== "imageMessage") return M.reply("Image only!");
                const imageBuffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
                const removedBg = await removeBg(imageBuffer);
                return M.reply(
                    removedBg,
                    "document",
                    undefined,
                    "image/png",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    `nobg.${M.message.key.id}.png`
                );
            } else {
                const type = Object.keys(M.quoted.message)[0] as keyof proto.IMessage;
                // console.log("messageKeys", messageKeys);
                if (
                    (type === "imageMessage" || type === "documentMessage") &&
                    M.quoted.message[type]?.mimetype?.startsWith("image/")
                ) {
                    const imageBuffer = await M.downloadMediaMessage(M.quoted.message);
                    const removedBg = await removeBg(imageBuffer);
                    return M.reply(
                        removedBg,
                        "document",
                        undefined,
                        "image/png",
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        `nobg.${M.message.key.id?.substring(0, 5).toLowerCase()}.png`
                    );
                } else return M.reply("Image only!");
            }
        } catch (error) {
            return M.reply("Gagal memproses gambar!");
        }
    };
}
