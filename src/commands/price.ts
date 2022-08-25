import { getPrices, searchSymbol } from "../api/tradingview/api";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { getPercentageChange } from "../helper/utils";

@Command("price", {
    description: "Harga coin",
    usage: "price [coin]",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        const searchProms = args.args.map(async (arg) => {
            const data = await searchSymbol(arg, "BINANCE");
            if (data.length <= 0) return "";
            console.log(arg, " => ", data[0].description);
            return data[0].symbol;
        });

        const symbols = (await Promise.all(searchProms)).filter((s) => !!s);
        if (symbols.length <= 0) return M.reply("Invalid symbol!");
        const data = await getPrices(symbols);
        for (const { price, price10m, priceHour, price4Hour, price24Hour, symbol } of data) {
            let messages = `Harga *${symbol}* saat ini *$${price}*`;
            messages += "\nPerubahan :\n";

            const last5MinChange = getPercentageChange(price, price10m).toFixed(2);
            const lastHourChange = getPercentageChange(price, priceHour).toFixed(2);
            const last4HourChange = getPercentageChange(price, price4Hour).toFixed(2);
            const last24HourChange = getPercentageChange(price, price24Hour).toFixed(2);

            messages += "10m : ";
            messages += price <= price10m ? `-${last5MinChange}%` : `${last5MinChange}%`;
            messages += "\n";

            messages += "1h : ";
            messages += price <= priceHour ? `-${lastHourChange}%` : `${lastHourChange}%`;
            messages += "\n";

            messages += "4h : ";
            messages += price <= price4Hour ? `-${last4HourChange}%` : `${last4HourChange}%`;
            messages += "\n";

            messages += "24h : ";
            messages += price <= price24Hour ? `-${last24HourChange}%` : `${last24HourChange}%`;

            await this.client.sendMessage(M.from, { text: messages }, { quoted: M.message });
        }

        // const binance = this.client.binance;
        // const symbols = await binance.getFuturesSymbols();
        // const input = args.args[0] || "";
        // if (!!!input) {
        // 	return M.reply(`Symbol name required!`);
        // }
        // const symbol = symbols.find(
        // 	(s) =>
        // 		s.toLocaleLowerCase().startsWith(input.toLocaleLowerCase()) ||
        // 		s.toLocaleLowerCase().includes(input.toLocaleLowerCase())
        // );
        // if (!symbol) return M.reply("Invalid symbol");
        // const symbolData = await binance.getSymbolData(symbol);
        // const msg = `${symbol} - $${symbolData.currentPrice}`;
        // M.reply(msg);
    };
}
