import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
	name = "alert";
	public override execute = async (M: Message, args: IArgs): Promise<any> => {
		const binance = this.client.binance;
		const symbols = await binance.getFuturesSymbols();

		let symbol;
		let price: number | undefined;

		for (const arg of args.args) {
			if (!symbol) {
				symbol = symbols.find(
					(s) =>
						s.toLocaleLowerCase().startsWith(arg.toLocaleLowerCase()) ||
						s.toLocaleLowerCase().includes(arg.toLocaleLowerCase())
				);
			}
			try {
				if (!price) price = Number(arg);
			} catch (err) {
				console.log(arg, "Is not a numner");
			}
		}
		if (!args.args.length) {
			return M.reply(`Symbol name required!`);
		}
		if (!symbol) return M.reply("Invalid symbol");
		if (!price) return M.reply("Invalid price");
		try {
			return binance.addAlert(symbol, price, M.message);
		} catch (error) {
			throw error;
		}
	};
}
