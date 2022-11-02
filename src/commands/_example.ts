import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("sample", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        return M.reply(`Pong!\n${args.context}`);
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
