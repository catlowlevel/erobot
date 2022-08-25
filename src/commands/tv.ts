import { getChartImg, validIndicator, validTf } from "../api/chartimg/api";
import { getPrices, searchSymbol } from "../api/tradingview/api";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("tv", {
    description: "Gambar chart dari tradingview",
    usage: "tv [symbol] [timeframe] [indicator:value]",
    aliases: ["chart"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args.length <= 0) return M.reply("Invalid arguments!");
        M.reply("_Wait..._");
        let data: { symbol: string; description: string }[] = [];
        let tf = "1h";
        let indicators: string[] = [];
        for (let arg of args.args) {
            arg = arg.toLowerCase();
            console.log("arg :>> ", arg);
            if (data.length < 3) {
                const results = await searchSymbol(arg, "BINANCE");
                if (results.length > 0) {
                    const symbol = results[0].symbol;
                    const description = results[0].description;
                    console.log("result :>> ", description);
                    data.push({ symbol, description });
                    continue;
                }
            }
            if (validTf(arg)) {
                tf = arg;
                continue;
            }
            if (validIndicator(arg)) {
                indicators.push(arg);
                continue;
            }
        }

        if (!data.length) return M.reply("Invalid symbol!");
        const proms: {
            charts: Promise<Buffer>[];
            prices: Promise<
                {
                    price: number;
                    price10m: number;
                    priceHour: number;
                    price4Hour: number;
                    price24Hour: number;
                    symbol: string;
                }[]
            >;
        } = {
            charts: data.map(({ symbol }) => getChartImg(symbol, tf, indicators)),
            prices: getPrices(data.map((d) => d.symbol)),
        };
        const bufferProms = Promise.all(proms.charts);
        const pricesProms = proms.prices;
        const [buffers, prices] = await Promise.all([bufferProms, pricesProms]);
        let index = 0;
        for (const buffer of buffers) {
            const currentPrice = prices[index].price;
            await M.reply(
                buffer,
                "image",
                undefined,
                undefined,
                `*${data[index].symbol}* | *${data[index].description}* | *$${currentPrice}*`
            );
            index++;
        }
        return;
    };
}
