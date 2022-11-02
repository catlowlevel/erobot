import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import { ROOT_DIR } from "..";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("tebakgambar", {
    description: "",
    usage: "",
    aliases: ["tg"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const paths = resolve(...[ROOT_DIR, "assets", "tebakgambar"]);
        const files = await readdir(paths);
        const images = files.map((file) => ({ path: join(...[paths, file]), name: file.split("@").join(" ") }));
        const image = images[Math.floor(Math.random() * images.length)];
        console.log("image :>> ", image);

        const img = await readFile(image.path);
        await M.reply(img, "image", undefined, undefined, "Waktu menjawab : 30 detik");
        const { isTimeout } = await M.collectMessages({ timeout: 1000 * 30 }, async (M, stopCollect) => {
            if (M.content.startsWith("nyerah")) stopCollect();
            if (M.content.toUpperCase() === image.name) {
                await M.reply("Benar!");
                stopCollect();
            }
        });
        if (isTimeout) return M.reply(`Waktu habis, jawaban yang benar\n${image.name}`);
        //else
        //return this.client.relayMessage(
        //    M.from,
        //    {
        //        extendedTextMessage: {
        //            text: `Selamat ${messages[0].sender.username}!`,
        //            contextInfo: { mentionedJid: [messages[0].sender.jid!] },
        //        },
        //    },
        //    {}
        //);
    };
}
