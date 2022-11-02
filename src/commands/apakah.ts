import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("apakah", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (args.args.length <= 0) return M.reply("apaan?");
        const answers = ["iya", "tidak", "mungkin iya", "mungkin tidak", "tentu iya", "tentu tidak"];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        return M.reply(answer);
    };
}
