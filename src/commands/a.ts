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
        return this.client
            .relayMessage(
                M.from,
                {
                    extendedTextMessage: { text: args.context, contextInfo: { mentionedJid: participants } },
                },
                {}
            )
            .then((msgId) => {
                console.log("msgId", msgId);
            });
    };
}
