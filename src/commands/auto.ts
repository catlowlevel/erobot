import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { quoted } from "../helper/utils";

@Command("auto", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { args }: IArgs): Promise<any> => {
        if (args.length <= 0)
            return M.reply(
                `Pattern and Repply message required!, "<pattern>" "<reply message>" (put inside double quotes)\nEx : .auto "*bird" "bluebird"`
            );

        const [pattern, replyMsg] = quoted(M.content);
        if (!pattern) return M.reply("Pattern required");
        if (!replyMsg) return M.reply("Reply message required");

        const db = this.handler.autoReply.db;
        if (!db.data[M.from]) db.data[M.from] = [];
        db.data[M.from].push({ pattern, replyMsg });
        return db.write().then(() => M.reply(`*Pattern* : ${pattern.replace(/\*/gm, "•")}\n*Reply* : ${replyMsg}`));
    };
}
