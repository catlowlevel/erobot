import { proto } from "@adiwajshing/baileys";
import Queue from "queue";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("ping", {
    description: "Cek status bot",
    usage: "ping",
    aliases: ["p"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args[0]?.startsWith("b")) {
            return this.client.sendMessage(
                M.from,
                {
                    text: "Pong!",
                    buttons: [
                        {
                            buttonId: ".ping b",
                            buttonText: { displayText: "ping" },
                            type: 0,
                        },
                    ],
                },
                { quoted: M.message }
            );
        }

        if (args.args[0]?.startsWith("p")) {
            return this.client.sendMessage(
                M.from,
                { text: "P" },
                {
                    quoted: {
                        key: {
                            remoteJid: M.from,
                            fromMe: false,
                            id: "0",
                            participant: M.mentioned?.[0],
                        },
                        messageTimestamp: Date.now() / 1000,
                        message: {
                            conversation: "Halo",
                        },
                    },
                }
            );
        }

        if (args.args[0]?.startsWith("l")) {
            const sections: proto.Message.ListMessage.ISection[] = [
                {
                    title: "Ping",
                    rows: [
                        {
                            title: "Ping button",
                            rowId: ".ping b",
                        },
                        {
                            title: "Ping list",
                            rowId: ".ping l",
                        },
                    ],
                },
            ];
            const count = Number(args.args[1]);
            for (let i = 0; i < count; i++) {
                sections[0].rows?.push({ title: `Ping ${i}`, rowId: ".ping -b" });
            }
            return this.client.sendMessage(
                M.from,
                {
                    text: "Pong!",
                    buttonText: "Required, text on the button to view the list",
                    sections,
                },
                { quoted: M.message }
            );
        }
        if (args.args[0]?.startsWith("q")) {
            const count = Number(args.args[1]) ?? 2;
            for (let i = 0; i < count; i++) {
                this.client.sendMessageQueue(M.from, { text: "Pong! " + (i + 1) }, { quoted: M.message }, (msg) => {
                    console.log(i, msg?.message?.extendedTextMessage?.text);
                });
            }
            return;
        }

        M.reply("Pong!");
    };
}
