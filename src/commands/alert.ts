import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
	name = "alert";
	public override execute = async (M: Message, args: IArgs): Promise<any> => {
		const binance = this.client.binance;
		const symbols = await binance.getFuturesSymbols();
		const input = args.args[0] || "";
		if (!!!input) {
			return M.reply(`Symbol name required!`);
		}
		const symbol = symbols.find(
			(s) =>
				s.toLocaleLowerCase().startsWith(input.toLocaleLowerCase()) ||
				s.toLocaleLowerCase().includes(input.toLocaleLowerCase())
		);
		if (!symbol) return M.reply("Invalid symbol");
		const price = args.args[1] || "";
		try {
			return binance.addAlert(symbol, Number(price), M.message);
		} catch (error) {
			throw error;
		}
	};
}
