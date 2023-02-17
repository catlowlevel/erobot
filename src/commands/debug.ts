import { downloadMediaMessage } from "@adiwajshing/baileys";
import { exec } from "child_process";
import sharp from "sharp";
import { extractMetadata } from "wa-sticker-formatter";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("debug", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (args.args.length > 0) {
            if (args.args?.[0].startsWith("react")) {
                await new Promise<void>((res) => {
                    let max = 5;
                    const emojis = ["🗿", "😊", "🙏", "🤔", "🤣"];
                    const loop = setInterval(async () => {
                        const emoji = emojis[max];
                        await M.react(emoji);

                        if (!max--) {
                            clearInterval(loop);
                            res();
                        }
                    }, 1000);
                });
            }
            if (args.args?.[0].startsWith("temp")) {
                //send a template message!
                return this.client.sendMessage(M.from, {
                    text: "Hi it's a template message",
                    footer: "Hello World",
                    templateButtons: [
                        {
                            index: 1,
                            urlButton: {
                                displayText: "⭐ Star Baileys on GitHub!",
                                url: "https://github.com/adiwajshing/Baileys",
                            },
                        },
                        { index: 3, callButton: { displayText: "Call me!", phoneNumber: "+1 (234) 5678-901" } },
                        {
                            index: 2,
                            quickReplyButton: {
                                displayText: "This is a reply, just like normal buttons!",
                                id: "id-like-buttons-message",
                            },
                        },
                    ],
                });
            }
            if (args.args?.[0].startsWith("blur")) {
                let imageBuffer = await M.downloadQuotedMedia();
                if (M.type !== "imageMessage" && !imageBuffer) return M.reply("Image only"); //TODO: Handle quoted message
                if (!imageBuffer) {
                    console.log("not a quoted message");
                    imageBuffer = (await downloadMediaMessage(M.message, "buffer", {})) as Buffer;
                }
                const sigma = isNaN(Number(args.args?.[1])) ? 25 : Number(args.args?.[1]);
                console.log("sigma :>> ", sigma);
                const result = await sharp(imageBuffer).blur(sigma).toBuffer();
                return M.reply(result, "image");
            }

            if (args.args?.[0].startsWith("err")) {
                throw new Error("debug error");
            }
            if (args.args?.[0].startsWith("edit")) {
                if (!M.message.message) throw new Error("message is undefined!");
                const { imageMessage } = M.message.message;
                return this.client.relayMessage(
                    M.from,
                    { imageMessage: { ...imageMessage, caption: args.args[1] } },
                    {}
                );
            }
            if (args.args?.[0].startsWith("trace")) {
                if (!M.quoted) return M.reply("Quote a message!");
                if (!M.quoted.key.id) return M.reply("There's a problem with this message!");
                let depth = 1;
                for (const arg of args.args) {
                    depth = Number(arg);
                    console.log("depth", depth);
                    if (isNaN(depth)) depth = 1;
                }

                let msg = this.client.getMessageFromStore(M.from, M.quoted.key.id);

                if (!msg) return M.reply("Can't find this message!");
                M = new Message(msg, this.client);

                depth--;

                while (depth--) {
                    if (!M.quoted) {
                        console.log(`depth : ${depth + 1} | No quoted message`);
                        continue;
                    }
                    if (!M.quoted.key.id) continue;
                    msg = this.client.getMessageFromStore(M.from, M.quoted.key.id);
                    if (!msg) {
                        console.log(`depth : ${depth + 1} | msg is undefined`);
                        continue;
                    }
                    M = new Message(msg, this.client);
                    console.log(`depth : ${depth + 1} | new message`);
                }
                return M.reply("Here");
                // const msgId = M.quoted.key.id!;
                // const msg = this.client.getMessageFromStore(M.from, msgId);
                // if (!msg) return M.reply("Can't trace this message!");
                // console.log("msg", msg);
                // const message = new Message(msg, this.client);
                // const msg2 = this.client.getMessageFromStore(message.from, message.quoted?.key.id!);

                //return this.client.relayMessage(M.from, msg2!.message!, {});
            }
            if (args.args?.[0].startsWith("collect")) {
                //return FM.collectMessages({ timeout: 1000 * 60, max: 1 }, async (SM) => {
                //await FM.reply(SM.sender.username + " said " + SM.content);
                //return SM.collectMessages({ timeout: 1000 * 60, max: 1 }, async (TM) => {
                //return TM.reply("Done");
                //});
                //});

                const { messages } = await M.collectMessages({ timeout: 1000 * 30, max: 5, senderOnly: true }, (M) => {
                    M.reply(M.content);
                    return;
                });
                return M.reply(`Total collected : ${messages.length}`);
            }
            if (args.args[0].startsWith("log")) {
                return new Promise<void>((res, rej) => {
                    exec("pm2 logs erobot --raw --nostream", async (err, out) => {
                        if (err) rej(err);
                        await M.reply(out);
                        res();
                    });
                });
            }
        }
        if (M.quoted) {
            if (M.quoted?.message?.stickerMessage) {
                const buffer = await M.downloadQuotedMedia();
                if (buffer) {
                    const metadata = await extractMetadata(buffer);
                    return M.reply(JSON.stringify(metadata));
                }
            }
            console.log(JSON.stringify(M.quoted, null, 2));
            return;
        }
        console.log(JSON.stringify(M.message, null, 2));
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
