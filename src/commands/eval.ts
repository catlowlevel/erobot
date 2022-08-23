import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
    name = "eval";
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
