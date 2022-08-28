import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("hedge", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        const symbols = await this.client.binance.getFuturesSymbols();
        const tickers = this.client.binance.tickers;
        const candles = tickers.get(symbols[0]);

        const green = (close: number, open: number) => close > open;
        const red = (close: number, open: number) => close < open;

        const candlesBtc = tickers.get("BTCUSDT") || [];
        const redBtc = candlesBtc.filter((c) => red(c.close, c.open));
        const greenBtc = candlesBtc.filter((c) => green(c.close, c.open));

        const hedges: { symbol: string; price: number }[] = [];
        for (const symbol of symbols) {
            if (symbol === "BTCUSDT") continue;
            const candles = tickers.get(symbol) || [];

            const greens = candles.filter((c) => green(c.close, c.open));
            const reds = candles.filter((c) => red(c.close, c.open));

            if (greens.length > greenBtc.length) {
                const currentPrice = candles[candles.length - 1].close;
                hedges.push({ symbol, price: currentPrice });
            }
        }
        // console.log(JSON.stringify(hedges));

        let messages = hedges.reduce((acc, curr) => {
            return `${curr.symbol} => $${curr.price}\n${acc}`;
        }, "");

        return M.reply(messages);
    };
}
