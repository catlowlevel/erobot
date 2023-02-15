import chalk from "chalk";
import { readdirSync } from "fs";
import { join } from "path";
import { INDEX_DIR } from "../..";
import { BaseCommand } from "../BaseCommand";
import { Client } from "../Client";
import { Message } from "../Message";
import { AutoReply } from "./AutoReply";
import { StickerForwarder } from "./ForwardSticker";
export interface IArgs {
    context: string;
    args: string[];
    flags: string[];
    command: string;
}

interface ICommandConfig {
    description: string;
    usage: string;
    aliases?: string[];
    /** return false to not load this command */
    load?: (client: Client) => boolean;
    allow?: RegExp[] | ((M: Message, client: Client) => RegExp[]);
}

export interface ICommand {
    /**Name of the command */
    name: string;
    /**The client of WhatsApp */
    client: Client;
    config: ICommandConfig;
    /**Handler of message */
    handler: MessageHandler;
    /**Method for executing the command */
    execute(M: Message, args: IArgs): Promise<void | never | unknown>;
    /**Method for catching error that execute throws */
    handleError(M: Message, err: Error): Promise<void | never | unknown>;
}

export class MessageHandler {
    commands = new Map<string, ICommand>();
    aliases = new Map<string, ICommand>();

    autoReply: AutoReply;
    stickerForwarder: StickerForwarder;

    private path = [INDEX_DIR, "commands"];

    constructor(private client: Client) {
        client.waitConnected().then(() => {
            this.autoReply = new AutoReply(client, this);
            this.stickerForwarder = new StickerForwarder(client, this);
        });
    }

    private loadCommand = (path: string) =>
        // eslint-disable-next-line no-async-promise-executor
        new Promise<void>(async (res) => {
            try {
                // const module = await import(path);
                // console.log(module);

                const command: BaseCommand = new (await import(path)).default();
                command.client = this.client;
                command.handler = this;

                //explicitly check false because load function is optional
                if (command.config.load?.(this.client) === false) {
                    throw new Error("command not loaded");
                }
                this.commands.set(command.name, command);
                if (command.config.aliases) command.config.aliases.forEach((a) => this.aliases.set(a, command));

                // const color = this.client.utils.getRandomColor();
                // Generate a random color
                const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

                console.log(`Command ${chalk.hex(randomColor)(command.name)} loaded!`);
                res();
            } catch (error) {
                console.log(`Command ${chalk.red(path)} fail to load. Reason : ${error.message}`);
                res();
            }
        });

    public loadCommands = async () => {
        const commandsPath = join(INDEX_DIR, "commands");
        console.log(`Watching ${commandsPath}`);
        // chokidar.watch(commandsPath, { ignoreInitial: true }).on("all", (ev, p) => {
        // if (!["add", "change"].includes(ev)) return;
        // const filename = basename(p);
        // if (filename.startsWith("_")) return;
        // this..loadCommand(p);
        // });

        this.client.log("=====Loading commands========", "blue");
        const files = readdirSync(join(...this.path));
        files
            .filter((file) => file.startsWith("_") === false)
            .map(async (file) => {
                const commandPath = join(...[...this.path, file]);
                await this.loadCommand(commandPath);
            });
        this.client.log("==============================", "blue");
    };

    public handleMessage = (M: Message) => {
        const prefix = Message.PREFIX;
        const isCommand = M.isCommand; // calling this here is necessary
        const args = M.content.split(" ");
        const title = M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
        if (!isCommand) {
            return M.simplify().then((M) => {
                const title = M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
                return console.log(`${M.sender.username}@${title} => ${M.content}`);
            });
        }
        const cmd = args[0].toLowerCase().slice(prefix.length);
        const command = this.commands?.get(cmd) || this.aliases?.get(cmd);
        if (!command) return; //M.reply("Perintah tidak dikenal!");

        M.command = command;
        let allow = false;
        console.log(command.config.allow);
        if (command.config.allow) {
            //TODO: check this
            const allows =
                typeof command.config.allow !== "function"
                    ? command.config.allow
                    : command.config.allow(M, this.client);
            const result = allows.some((a) => a.test(M.sender?.jid ?? "") || a.test(M.from));
            allow = result;
        } else {
            const allowedCommands = this.client.config.data.allow[M.from];
            // const cb = (a: string) => {
            //     const user = a.test(M.sender?.jid ?? "");
            //     const group = a.test(M.from);
            //     const result = user || group;
            //     return result;
            // };
            const result = allowedCommands?.includes(command.name);
            allow = result ? true : M.message.key.fromMe ? true : false;
        }
        // console.log(allow);
        if (!allow) return;

        if (this.client.config.data.me?.[M.from] === true && !M.message.key.fromMe) return;

        // const color = this.client.utils.getRandomColor();
        // const color2 = this.client.utils.getRandomColor();
        // Generate a random color
        const color = "#" + Math.floor(Math.random() * 16777215).toString(16);
        const color2 = "#" + Math.floor(Math.random() * 16777215).toString(16);
        this.client.log(
            `Executing command ${chalk.hex(color2)(cmd)} from ${title} by ${M.sender.username}`,
            color as any
        );

        const lastTime = Date.now();
        return M.typing().then(async () => {
            try {
                if (M.from !== this.client.user?.id) {
                    M.markAsRead();
                }
                await command.execute(M, this.formatArgs(args, cmd));
                const timeTaken = Date.now() - lastTime;
                this.client.log(
                    `Command ${chalk.hex(color2)(cmd)} executed after ${chalk.hex(color2)(
                        `${(timeTaken / 1000).toFixed(3)}s`
                    )}!`,
                    color as any
                );
            } catch (err) {
                const timeTaken = Date.now() - lastTime;
                this.client.log(
                    `Command ${chalk.hex(color2)(cmd)} fail to execute after ${chalk.hex(color2)(
                        `${(timeTaken / 1000).toFixed(3)}s`
                    )}!\nReason : ${err}`,
                    "red"
                );
                console.trace(err);
                // if (command.handleError)
                await command
                    .handleError(M, err)
                    .catch((error) => {
                        console.log(`handle error throws an error : ${error}`);
                        return M.reply("Terhadi kesalahan");
                    })
                    .catch(console.error);
                // else await M.reply("Terjadi kesalahan.").catch(console.error);
            } finally {
                await M.typingDone();
            }
        });
    };
    private formatArgs = (args: string[], command: string): IArgs => {
        args.splice(0, 1);
        return {
            args,
            context: args.join(" ").trim(),
            flags: args.filter((arg) => arg.startsWith("--")),
            command,
        };
    };
}
