import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("set", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const config = this.client.config;
        const cmd = args.context;
        const command = this.handler.commands.get(cmd) || this.handler.aliases.get(cmd);
        if (!command) return M.reply("Invalid command");
        if (!config.data.allow[cmd]) config.data.allow[cmd] = [];
        if (config.data.allow[command.name].includes(M.from)) return M.reply("Already allowed!");
        config.data.allow[command.name].push(M.from);
        await config.write();
        return M.reply(`command ${command.name} allowed on ${M.from}`);
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
