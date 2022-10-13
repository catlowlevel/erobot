import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("delete", {
    description: "",
    usage: "",
    aliases: ["del"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (!M.quoted) return M.reply("Quote a message!");
        await this.client.sendMessage(M.from, { delete: M.message.key });
        return this.client.sendMessage(M.from, { delete: M.quoted.key });
    };
}
