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
            const enabled = keys.filter((key) => config.data.allow[key]?.includes(M.from));
            return M.reply(`${enabled}`);
        }
        const [cmd, state] = args.context.split(":") as [string, "d" | "e"];

        // enable/disable
        if (!state || !["e", "d"].includes(state)) return M.reply("bad format");
        const command = this.handler.commands.get(cmd) || this.handler.aliases.get(cmd);
        const all = cmd === "*";
        console.log("all", all);
        if (!(command || all)) return M.reply("Invalid command");
        if (state === "e") {
            if (!config.data.allow[M.from]) config.data.allow[M.from] = [];
            if (command) {
                if (config.data.allow[M.from]?.includes(command.name)) return M.reply("Already enabled!");
                config.data.allow[M.from]?.push(command.name);
            } else if (all) config.data.allow[M.from] = Array.from(this.handler.commands.keys());
            await config.write();
        } else if (state === "d") {
            if (!config.data.allow[M.from]) config.data.allow[M.from] = [];
            if (command) {
                if (!config.data.allow[M.from]?.includes(command.name)) return M.reply("Already disabled!");
                config.data.allow[M.from] = config.data.allow[M.from]?.filter((a) => a !== command.name);
            } else if (all) config.data.allow[M.from] = [];
            await config.write();
        } else return await M.reply("bad format");
        console.log(config.data);
        return M.reply(
            `${command ? "command *" + command.name + "* " : "all command "} ${
                state === "e" ? "enabled" : "disabled"
            } on ${(await M.simplify()).groupMetadata?.subject}`
        );
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
