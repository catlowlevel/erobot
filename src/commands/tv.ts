import { getChartImg, validIndicator, validTf } from "../api/chartimg/api";
import { searchSymbol } from "../api/tradingview/api";
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

        let data: { symbol: string; description: string }[] = [];
        let tf = "1h";
        let indicators: string[] = [];
        for (const arg of args.args) {
            console.log("arg :>> ", arg);
            if (data.length <= 2) {
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
        const chartsProms = data.map(({ symbol }) => getChartImg(symbol, tf, indicators));
        const buffers = await Promise.all(chartsProms);
        let index = 0;
        for (const buffer of buffers) {
            await M.reply(
                buffer,
                "image",
                undefined,
                undefined,
                `*${data[index].symbol}* | *${data[index].description}*`
            );
            index++;
        }
        return;
    };
}
