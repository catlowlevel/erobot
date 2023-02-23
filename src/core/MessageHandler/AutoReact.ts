import { Client, MessageHandler } from "..";

export class AutoReact {
    constructor(private client: Client, private handler: MessageHandler) {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        client.on("message_receipt", (data) => {
            if (!data.key.id) return;
            const msgData = handler.msgIds[data.key.id];
            if (msgData) {
                if (data.receipt.readTimestamp) {
                    msgData.count++;
                    const emoji = emojis[msgData.count - 1];
                    client.sendMessageQueue(data.key.remoteJid, {
                        react: {
                            text: emoji,
                            key: data.key,
                        },
                    });
                    if (msgData.count >= 10) delete handler.msgIds[data.key.id];
                }
            }
        });
    }
}
