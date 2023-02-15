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
        const lines = context.split("\n");
        lines[lines.length - 1] = "return " + lines[lines.length - 1];
        const parsed = lines.join("\n");
        const evaluate = await eval(`;(async () => { ${parsed} })()`).catch((e: Error) => {
            return e.message;
        });
        console.log(evaluate);
        return M.reply(
            `${JSON.stringify(
                evaluate,
                (key, value) => {
                    if (typeof value === "function") {
                        return (value as string).toString().split("\n")[0];
                    }
                    return value;
                },
                "\t"
            )}`
        );
        let out!: string;
        try {
            const obj = {
                getPercent: (initial: number, final: number) => {
                    return ((initial - final) / initial) * 100;
                },
                M,
                ...this,
            };
            const result = this.evalInContext(context, obj);
            console.log(result);
            out = JSON.stringify(result, null, "\t") || "Evaluated JavaScript";
        } catch (error) {
            out = (error as Error).message;
        }
        return M.reply(out);
    };

    public override handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
