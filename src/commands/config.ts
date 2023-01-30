import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("config", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<unknown> => {
        const state = context === "on";
        const config = this.client.config;
        if (!config.data.me) return console.log("there is no 'me' config");
        config.data.me[M.from] = state;
        config.write();
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
