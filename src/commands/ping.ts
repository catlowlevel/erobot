import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
	name = "ping";
	public override execute = async (M: Message, args: IArgs): Promise<any> => {
		if (args.args[0].startsWith("b")) {
			return this.client.sendMessage(
				M.from,
				{
					text: "Pong!",
					buttons: [
						{
							buttonId: ".ping b",
							buttonText: { displayText: "ping" },
							type: 0,
						},
					],
				},
				{ quoted: M.message }
			);
		}

		if (args.args[0].startsWith("l")) {
			const sections: proto.Message.ListMessage.ISection[] = [
				{
					title: "Ping",
					rows: [
						{
							title: "Ping button",
							rowId: ".ping b",
						},
						{
							title: "Ping list",
							rowId: ".ping l",
						},
					],
				},
			];
			const count = Number(args.args[1]);
			for (let i = 0; i < count; i++) {
				sections[0].rows?.push({ title: `Ping ${i}`, rowId: ".ping -b" });
			}
			return this.client.sendMessage(
				M.from,
				{
					text: "Pong!",
					buttonText: "Required, text on the button to view the list",
					sections,
				},
				{ quoted: M.message }
			);
		}
		M.reply("Pong!");
	};
}
