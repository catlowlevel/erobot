import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("sample", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        M.reply("Pong!");
    };

    public handleError = async (M: Message, err: Error): Promise<any> => {
        throw new Error(err.message);
    };
}
