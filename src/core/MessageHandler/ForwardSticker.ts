import { downloadMediaMessage } from "@adiwajshing/baileys";
import Queue from "queue";
import Sticker, { StickerTypes } from "wa-sticker-formatter/dist";
import { MessageHandler } from ".";
import { Client } from "../Client";

export class StickerForwarder {
    queue: Queue;
    constructor(private client: Client, private handler: MessageHandler) {
        this.queue = new Queue({ autostart: true, concurrency: 1 });
        this.client.on("new_message", (M) => {
            if (M.type === "stickerMessage") {
                //TODO: change this!
                const sendTo = "120363049404065538@g.us";
                this.queue.push(async (cb) => {
                    const buffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
                    const sticker = new Sticker(buffer)
                        .setType(StickerTypes.FULL)
                        .setPlaystoreLink("https://play.google.com/store/apps/details?id=com.kiloo.subwaysurf")
                        .toMessage();
                    console.log("Forwarding sticker");
                    const msg = await client.sendMessage(sendTo, await sticker);
                    if (!msg) console.log("Fail to forward sticker!");
                    await new Promise<void>((res) => setTimeout(() => res(), 2500));
                });
            }
        });
    }
}
