import { exec } from "child_process";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("exec", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        return new Promise<void>((res, rej) => {
            exec(args.context, { timeout: 1000 * 60 }, async (err, out) => {
                if (err) rej(err);
                await M.reply(out);
                res();
            });
        });
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
