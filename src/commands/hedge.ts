import { validTf } from "../api/chartimg/api";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { getPercentageChange } from "../helper/utils";
import { Interval } from "../service/binance/binance";

@Command("hedge", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        let tf: Interval = "5m";
        let limit = 8;

        for (const arg of args.args) {
            if (validTf(arg)) {
                tf = arg as Interval;
                continue;
            }
            try {
                limit = Number(arg);
                continue;
            } catch (error) {}
        }
        if (limit > this.client.binance.MAX_CANDLE_LIMIT) return M.reply("Maximal candle 500!");

        const symbols = await this.client.binance.getFuturesSymbols();
        const tickers = await this.client.binance.getCandles(symbols, tf, limit, true);
        const green = (close: number, open: number) => close > open;
        const red = (close: number, open: number) => close < open;

        const candlesBtc = tickers.find((t) => t.symbol === "BTCUSDT")?.candles ?? [];
        //const redBtc = candlesBtc.filter((c) => red(c.close, c.open));
        //const greenBtc = candlesBtc.filter((c) => green(c.close, c.open));

        const hedges: { symbol: string; price: number; percentGap: number }[] = [];
        //for (const symbol of symbols) {
        //if (symbol === "BTCUSDT") continue;
        //const candles = tickers.get(symbol) || [];

        //const greens = candles.filter((c) => green(c.close, c.open));
        //const reds = candles.filter((c) => red(c.close, c.open));

        //if (greens.length > greenBtc.length) {
        //const currentPrice = candles[candles.length - 1].close;
        //hedges.push({ symbol, price: currentPrice });
        //}
        //}
        // console.log(JSON.stringify(hedges));
        const btcCurrentPrice = candlesBtc[candlesBtc.length - 1].close;
        const btcLastPrice = candlesBtc[0].close;
        console.log("BTCUSDT Current : " + btcCurrentPrice);

        for (const symbol of symbols) {
            if (symbol === "BTCUSDT") continue;
            const candles = tickers.find((t) => t.symbol === symbol)?.candles || [];
            if (candles.length <= 0) {
                console.log(`No candles for ${symbol}`);
                continue;
            }
            const currentPrice = candles[candles.length - 1].close;
            const lastPrice = candles[0].close;
            const percentGap = getPercentageChange(currentPrice, lastPrice);
            if (green(currentPrice, lastPrice) && red(btcCurrentPrice, btcLastPrice)) {
                hedges.push({ symbol, price: currentPrice, percentGap });
            }
        }

        let messages = `=======| ${tf} - ${limit} Candles |=======\n`;
        messages += hedges
            .sort((a, b) => (a.percentGap > b.percentGap ? 1 : -1))
            .reduce((acc, curr) => {
                return `${curr.symbol} => $${curr.price} | ${curr.percentGap.toFixed(2)}%\n${acc}`;
            }, "");
        if (hedges.length <= 0) {
            return M.reply("There's no hedge!");
        }
        return M.reply(messages);
    };
}
