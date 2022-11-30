import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("a", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (M.chat === "dm") return M.reply("Group only");
        const groupMetadata = (await M.simplify()).groupMetadata;
        if (!groupMetadata) return M.reply("Gagal mendapatkan informasi group!");
        const participants = groupMetadata.participants.map((p) => p.id);
        const msg = M.message.message;
        if (!msg) return M.reply("Invalid message!");
        const msgKeys = Object.keys(msg);
        const msgKey = msgKeys[0] as keyof typeof msg;
        console.log("msg", msg[msgKey]);

        console.log(JSON.stringify(M.message, null, 2));
        return this.client
            .relayMessage(
                M.from,
                {
                    [M.type !== "conversation" ? M.type : "extendedTextMessage"]:
                        M.type === "conversation"
                            ? {
                                  text: args.context,
                                  contextInfo: { mentionedJid: participants },
                              }
                            : {
                                  ...(msg[msgKey] as Record<string, unknown>),
                                  text: args.context,
                                  contextInfo: { mentionedJid: participants },
                              },
                },
                {}
            )
            .then((msgId) => {
                console.log("msgId", msgId);
            });
    };
}
