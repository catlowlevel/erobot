import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("alert", {
    description: "Alert harga coin",
    usage: "alert [coin]",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const binance = this.client.binance;
        if (!binance) return console.log("binance is undefined");
        const symbols = (await binance.getFuturesSymbols()).map((s) => s.symbol);

        let symbol;
        let price: number | undefined;

        for (const arg of args.args) {
            if (!symbol) {
                symbol = symbols
                    .filter((s) => s.toLocaleLowerCase().includes(arg.toLocaleLowerCase()))
                    .find((s) => s.toLocaleLowerCase().startsWith(arg.toLocaleLowerCase()));
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
        return binance.addAlert(symbol, price, M.message);
    };
}
