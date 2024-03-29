import { proto } from "@adiwajshing/baileys";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (args.args.length > 0) {
            if (args.args[0].startsWith("all")) {
                const groupMetadata = (await M.simplify()).groupMetadata;
                if (!groupMetadata) return M.reply("Gagal mendapatkan informasi group!");
                const participants = groupMetadata.participants.map((p) => p.id);
                return this.client
                    .relayMessage(
                        M.from,
                        {
                            extendedTextMessage: { text: "TEST", contextInfo: { mentionedJid: participants } },
                        },
                        {}
                    )
                    .then((msgId) => {
                        console.log("msgId", msgId);
                    });
            }
            if (args.args[0].startsWith("v")) {
                return this.client.relayMessage(
                    M.from,
                    {
                        pollCreationMessage: {
                            name: "@adiwajshing/baileys",
                            options: [
                                { optionName: "1" },
                                { optionName: "2" },
                                { optionName: "3" },
                                { optionName: "4" },
                                { optionName: "5" },
                            ],
                            selectableOptionsCount: 5,
                        },
                    },
                    {}
                );
            }
            if (args.args[0].startsWith("b")) {
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

            if (args.args[0].startsWith("p")) {
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

            if (args.args[0].startsWith("l")) {
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
            if (args.args[0].startsWith("q")) {
                const count = Number(args.args[1]) || 2;
                const proms = [];
                for (let i = 0; i < count; i++) {
                    proms.push(
                        // this.client.sendMessageQueue(
                        //     M.from,
                        //     { text: "Pong! " + (i + 1) },
                        //     { quoted: M.message },
                        //     (msg) => {
                        //         console.log(i, msg?.message?.extendedTextMessage?.text);
                        //     }
                        // )
                        M.replyQueue(`Pong! ${i + 1}`)
                    );
                }
                return Promise.all(proms);
            }
        }
        const msgTime = new Date(Number(M.message.messageTimestamp) * 1000).getTime();
        const time = Date.now() - msgTime;
        return M.reply(`${time} ms`);
    };
}
