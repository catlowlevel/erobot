import { readdirSync } from "fs";
import { join } from "path";
import { ROOT_DIR } from "..";
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
		console.log("=====Loading commands========");
		const files = readdirSync(join(...this.path));
		for (const file of files.filter((file) => file.startsWith("_") === false)) {
			this.path.push(file);
			const command: BaseCommand = new (require(join(...this.path)).default)();
			if (!command) {
				console.log(`Command ${file} fail to load`);
				continue;
			}
			command.client = this.client;
			command.handler = this;
			this.commands.set(command.name, command);
			console.log(`Command ${command.name} loaded!`);
			this.path.splice(this.path.indexOf(file), 1);
		}
		console.log("==============================");
	}

	public handleMessage = (M: Message) => {
		const prefix = ".";
		const args = M.content.split(" ");
		const title =
			M.chat === "group" ? M.groupMetadata?.subject || "Group" : "DM";
		if (!args[0] || !args[0].startsWith(prefix)) {
			return void console.log(`${M.sender.username}@${title} => ${M.content}`);
		}
		const cmd =
			args[0].slice(1).trim().split(/ +/).shift()?.toLowerCase() || "";
		const command = this.commands?.get(cmd);
		if (!command) return M.reply("Perintah tidak dikenal!");
		console.log(
			`Executing command ${cmd} from ${title} by ${M.sender.username}`
		);

		return M.typing().then(async () => {
			try {
				if (M.from !== this.client.user?.id) {
					this.client.readMessages([M.message.key]);
				}
				await command.execute(M, this.formatArgs(args));
				console.log(`Command ${cmd} executed!`);
			} catch (err) {
				console.log(`Command ${cmd} fail to execute!\nReason : ${err}`);
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
