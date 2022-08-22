import chalk, { ChalkFunction } from "chalk";
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
export interface ICommand {
	/**Name of the command */
	name: string;
	/**The client of WhatsApp */
	client: Client;
	/**Handler of message */
	handler: MessageHandler;
	/**Method for executing the command */
	execute(M: Message, args: IArgs): Promise<void | never>;
}

export class MessageHandler {
	commands = new Map<string, ICommand>();
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

			const color = getRandomColor();
			console.log(`Command ${chalk.keyword(color)(command.name)} loaded!`);
			this.path.splice(this.path.indexOf(file), 1);
		}
		client.log("==============================", "blue");
	}

	public handleMessage = (M: Message) => {
		const prefix = ".";
		let max = 3;
		while (
			M.content.startsWith(prefix) &&
			M.content.at(1) === " " &&
			max-- > 0
		) {
			console.log("max", max, M.content);
			if (!max) break;
			M.content = M.content.replace(" ", "");
		}
		const args = M.content.split(" ");
		const title =
			M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
		if (!args[0] || !args[0].startsWith(prefix)) {
			return M.simplify().then((M) => {
				const title =
					M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
				return console.log(`${M.sender.username}@${title} => ${M.content}`);
			});
		}
		const cmd =
			M.content.slice(1).trim().split(/ +/).shift()?.toLowerCase() || "";
		const command = this.commands?.get(cmd);
		if (!command) return M.reply("Perintah tidak dikenal!");
		const color = getRandomColor();
		const color2 = getRandomColor();
		this.client.log(
			`Executing command ${chalk.keyword(color2)(cmd)} from ${title} by ${
				M.sender.username
			}`,
			color
		);

		return M.typing().then(async () => {
			try {
				if (M.from !== this.client.user?.id) {
					this.client.readMessages([M.message.key]);
				}
				await command.execute(M, this.formatArgs(args));
				this.client.log(
					`Command ${chalk.keyword(color2)(cmd)} executed!`,
					color
				);
			} catch (err) {
				this.client.log(
					`Command ${cmd} fail to execute!\nReason : ${err}`,
					"red"
				);
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
