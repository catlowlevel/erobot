import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("debug", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args[0].startsWith("process")) {
            const messages = await this.handler.getNewMessages(M.from, 3, 1000 * 15);
            return M.reply(messages[0].content);
        }
        if (M.quoted) {
            console.log(JSON.stringify(M.quoted, null, 2));
            return;
        }
        console.log(JSON.stringify(M.message, null, 2));
    };
}
