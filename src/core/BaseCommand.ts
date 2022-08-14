import { Client } from "./Client";
import { Message } from "./Message";
import { IArgs, MessageHandler } from "./MessageHandler";

export class BaseCommand {
	constructor(public name: string) {}

	public execute = async (M: Message, args: IArgs): Promise<void | never> => {
		throw new Error("Command method not implemented");
	};

	public client!: Client;

	public handler!: MessageHandler;
}
