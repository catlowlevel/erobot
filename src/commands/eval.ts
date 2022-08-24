import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("eval", {
    description: "Jalankan kode javascript",
    usage: "eval [kode]",
    aliases: ["js"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<any> => {
        let out!: string;
        try {
            const result = eval(context);
            out = JSON.stringify(result, null, "\t") || "Evaluated JavaScript";
        } catch (error) {
            out = (error as any).message;
        }
        return M.reply(out);
    };
}
