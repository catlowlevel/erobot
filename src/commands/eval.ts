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
    //https://stackoverflow.com/a/40109254
    evalInContext(scr: string, context: unknown) {
        // execute script in private context
        //return new Function("with(this) { return " + scr + "}").call(context);
        return new Function("with(this) { return eval('" + scr + "'); }").call(context);
    }
    public override execute = async (M: Message, { context }: IArgs): Promise<unknown> => {
        let out!: string;
        try {
            const obj = {
                getPercent: (initial: number, final: number) => {
                    return ((initial - final) / initial) * 100;
                },
            };
            const result = this.evalInContext(context, obj);
            out = JSON.stringify(result, null, "\t") || "Evaluated JavaScript";
        } catch (error) {
            out = (error as Error).message;
        }
        return M.reply(out);
    };
}
