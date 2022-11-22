import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("trade", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (!this.client.binance) return console.log("binance is undefined");
        //buttonId: `.trade --symbol=${data.symbol} --direction=${direction} --entry=${entries[0]} --sl=${sl}`,
        const symbol = this.getFlag(args.args, "--symbol");
        const direction = this.getFlag(args.args, "--direction", ["LONG", "SHORT"]);
        const size_f = this.getFlag(args.args, "--size");
        const entry_f = this.getFlag(args.args, "--entry");
        const sl_f = this.getFlag(args.args, "--sl");
        const timestamp_f = this.getFlag(args.args, "--timestamp");
        if (!symbol) return M.reply("Invalid symbol!");
        if (!direction) return M.reply("Invalid direction!");
        if (!size_f) return M.reply("Invalid size!");
        if (!entry_f) return M.reply("Invalid entry!");
        if (!sl_f) return M.reply("Invalid sl!");
        if (!timestamp_f) return M.reply("Invalid timestamp!");

        const size = Number(size_f);
        const entry = Number(entry_f);
        const sl = Number(sl_f);
        // const timestamp = Number(timestamp_f);
        const symbolData = this.client.binance.symbolData[symbol];
        let quoteOrderQty = size / entry;
        quoteOrderQty = Number(quoteOrderQty.toFixed(symbolData.quantityPrecision));
        const cost = (entry * quoteOrderQty) / symbolData.leverage;
        console.log(
            JSON.stringify(
                {
                    size,
                    entry,
                    sl,
                    quoteOrderQty,
                    cost,
                    symbolData,
                },
                null,
                2
            )
        );
        const result = await this.client.binance.createLimitOrder(symbol, "BUY", entry, quoteOrderQty, sl);

        if (result.limit) await M.reply("Limit order placed!");
        if (result.tp) await M.reply("Tp order placed!");
        if (result.sl) await M.reply("Sl order placed!");

        return M.reply(`Cost : $${cost.toFixed(2)}`);
    };
}
