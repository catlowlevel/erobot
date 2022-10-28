import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("antiviewonce", {
    description: "",
    usage: "",
    aliases: ["antivo", "avo", "viewonce", "vo"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (!M.quoted) return M.reply("Reply a *view once* message!");
        if (M.quoted.type !== "viewOnceMessage") return M.reply("Reply a *view once* message!");
        const { message } = M.quoted.message.viewOnceMessage!;
        if (!message) return M.reply("Invalid message!");
        const keys = Object.keys(message);
        const msgKey = keys[0] as keyof typeof message;
        const { viewOnce, ...msgData } = message[msgKey]! as any;
        // return M.reply(msgKey);
        return this.client.relayMessage(M.from, { [msgKey]: { ...msgData } }, {});
    };
}
