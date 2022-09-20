import chalk from "chalk";
import { readdirSync } from "fs";
import { join } from "path";
import { ROOT_DIR } from "..";
import { getRandomColor } from "../helper/utils";
import { BaseCommand } from "./BaseCommand";
import { Client } from "./Client";
import { Message } from "./Message";
export interface IArgs {
    context: string;
    args: string[];
    flags: string[];
}

interface ICommandConfig {
    description: string;
    usage: string;
    aliases?: string[];
}

export interface ICommand {
    /**Name of the command */
    name: string;
    /**The client of WhatsApp */
    client: Client;
    /**Handler of message */
    config: ICommandConfig;
    handler: MessageHandler;
    /**Method for executing the command */
    execute(M: Message, args: IArgs): Promise<void | never>;
}

export class MessageHandler {
    commands = new Map<string, ICommand>();
    aliases = new Map<string, ICommand>();

    private processMsg = new Map<
        string,
        { msg: Message; max: number; timeoutMs: number; messages: Message[]; matchSender: boolean }
    >();
    private path = [ROOT_DIR, "src", "commands"];
    constructor(private client: Client) {
        //prettier-ignore

        client.log("=====Loading commands========", "blue");
        const files = readdirSync(join(...this.path));
        for (const file of files.filter((file) => file.startsWith("_") === false)) {
            this.path.push(file);
            const command: BaseCommand = new (require(join(...this.path)).default)();
            if (!command) {
                console.log(`Command ${chalk.red(file)} fail to load`);
                continue;
            }
            command.client = this.client;
            command.handler = this;
            this.commands.set(command.name, command);
            if (command.config.aliases) command.config.aliases.forEach((a) => this.aliases.set(a, command));

            const color = getRandomColor();
            console.log(`Command ${chalk.keyword(color)(command.name)} loaded!`);
            this.path.splice(this.path.indexOf(file), 1);
        }
        client.log("==============================", "blue");
    }

    public getNewMessages(M: Message, max: number, timeoutMs: number, matchSender: boolean = false) {
        console.log("Fetching new messages...");
        if (this.processMsg.get(M.from)) throw new Error("Already fetching new messages!");
        this.processMsg.set(M.from, { msg: M, max, timeoutMs, messages: [], matchSender });
        return new Promise<Message[]>((res, rej) => {
            try {
                const timeout = setTimeout(() => {
                    const process = this.processMsg.get(M.from);
                    if (process) {
                        const msg = process.messages;
                        console.log("New messages(timeout), " + msg.length);
                        this.processMsg.delete(M.from);
                        res(msg);
                    }
                }, timeoutMs);
                const interval = setInterval(() => {
                    const process = this.processMsg.get(M.from);
                    if (process && process.messages.length > process.max - 1) {
                        const msg = process.messages;
                        console.log("New messages, " + msg.length);
                        this.processMsg.delete(M.from);
                        clearInterval(interval);
                        clearTimeout(timeout);
                        res(msg);
                    }
                }, 50);
            } catch (error) {
                rej(error);
            }
        });
    }

    public handleMessage = (M: Message) => {
        const prefix = ".";
        let max = 3;
        while (M.content.startsWith(prefix) && M.content.at(1) === " " && max-- > 0) {
            console.log("max", max, M.content);
            if (!max) break;
            M.content = M.content.replace(" ", "");
        }
        const args = M.content.split(/[ ,\n]/gm);
        const title = M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
        if (!args[0] || !args[0].startsWith(prefix) || M.content.length <= 1) {
            const process = this.processMsg.get(M.from);
            if (process) {
                if (process.matchSender && process.msg.sender.jid === M.sender.jid) {
                    process.messages.push(M);
                    this.client.readMessages([M.message.key]);
                } else if (!process.matchSender) {
                    process.messages.push(M);
                    this.client.readMessages([M.message.key]);
                }
                console.log("Processing", process.messages.length + " of " + process.max);
            }

            return M.simplify().then((M) => {
                const title = M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
                return console.log(`${M.sender.username}@${title} => ${M.content}`);
            });
        }
        const cmd = args[0].toLowerCase().slice(prefix.length);
        const command = this.commands?.get(cmd) || this.aliases?.get(cmd);
        if (!command) return M.reply("Perintah tidak dikenal!");
        const color = getRandomColor();
        const color2 = getRandomColor();
        this.client.log(`Executing command ${chalk.keyword(color2)(cmd)} from ${title} by ${M.sender.username}`, color);

        const lastTime = Date.now();
        return M.typing().then(async () => {
            try {
                if (M.from !== this.client.user?.id) {
                    this.client.readMessages([M.message.key]);
                }
                await command.execute(M, this.formatArgs(args));
                const timeTaken = Date.now() - lastTime;
                this.client.log(
                    `Command ${chalk.keyword(color2)(cmd)} executed after ${chalk.keyword(color2)(
                        `${(timeTaken / 1000).toFixed(3)}s`
                    )}!`,
                    color
                );
            } catch (err) {
                const timeTaken = Date.now() - lastTime;
                this.client.log(
                    `Command ${chalk.keyword(color2)(cmd)} fail to execute after ${chalk.keyword(color2)(
                        `${(timeTaken / 1000).toFixed(3)}s`
                    )}!\nReason : ${err}`,
                    "red"
                );
                console.trace(err);
                await M.reply("Terjadi kesalahan.").catch(console.error);
            } finally {
                return M.typingDone();
            }
        });
    };
    private formatArgs = (args: string[]): IArgs => {
        args.splice(0, 1);
        return {
            args,
            context: args.join(" ").trim(),
            flags: args.filter((arg) => arg.startsWith("--")),
        };
    };
}
