import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("set", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const config = this.client.config;
        if (!args.context) {
            const keys = Object.keys(config.data.allow) as (keyof typeof config.data.allow)[];
            const enabled = keys.filter((key) => config.data.allow[key].includes(M.from));
            return M.reply(`${enabled}`);
        }
        const [cmd, state] = args.context.split(":") as [string, "d" | "e"];

        // enable/disable
        if (!state || !["e", "d"].includes(state)) return M.reply("bad format");
        const command = this.handler.commands.get(cmd) || this.handler.aliases.get(cmd);
        if (!command) return M.reply("Invalid command");
        if (state === "e") {
            if (!config.data.allow[command.name]) config.data.allow[command.name] = [];
            if (config.data.allow[command.name].includes(M.from)) return M.reply("Already enabled!");
            config.data.allow[command.name].push(M.from);
            await config.write();
        } else if (state === "d") {
            if (!config.data.allow[command.name]) config.data.allow[command.name] = [];
            if (!config.data.allow[command.name].includes(M.from)) return M.reply("Already disabled!");
            config.data.allow[command.name] = config.data.allow[command.name].filter((a) => a !== M.from);
            await config.write();
        } else return await M.reply("bad format");
        console.log(config.data);
        return M.reply(
            `command *${command.name}* ${state === "e" ? "enabled" : "disabled"} on ${
                (await M.simplify()).groupMetadata?.subject
            }`
        );
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
