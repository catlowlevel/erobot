import { BaseCommand, Command, Message } from "../core";

@Command("antiviewonce", {
    description: "",
    usage: "",
    aliases: ["antivo", "avo", "viewonce", "vo"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message): Promise<unknown> => {
        if (!M.quoted) return M.reply("Reply a *view once* message!");
        if (M.quoted.type !== "viewOnceMessage") return M.reply("Reply a *view once* message!");
        if (!M.quoted.message.viewOnceMessage) return M.reply("Reply a *view once* message!");
        const { message } = M.quoted.message.viewOnceMessage;
        if (!message) return M.reply("Invalid message!");
        const keys = Object.keys(message);
        const msgKey = keys[0] as keyof typeof message;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
        // const { viewOnce, ...msgData } = message[msgKey] as proto.Message
        // return M.reply(msgKey);
        return this.client.relayMessage(
            M.from,
            { [msgKey]: { ...(message[msgKey] as Record<string, never>), viewOnce: undefined } },
            {}
        );
    };
}
