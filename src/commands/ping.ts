import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
	name = "ping";
	public override execute = async (M: Message, args: IArgs): Promise<void> => {
		M.reply("Pong!");
	};
}
