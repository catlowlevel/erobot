import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { getMiniChartImg } from "../lib/chartimg/api";
import { searchSymbol } from "../lib/tradingview/api";

@Command("tvm", {
    description: "Gambar mini chart dari tradingview",
    usage: "tvm",
    aliases: ["chartmini"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (args.args.length <= 0) return M.reply("Invalid arguments!");

        let symbol: string | undefined;
        for (const arg of args.args) {
            console.log("arg :>> ", arg);
            if (!symbol) {
                const data = await searchSymbol(arg, "BINANCE");
                if (data.length > 0) {
                    console.log("data[0] :>> ", data[0].description);
                    symbol = data[0].symbol;
                    continue;
                }
            }
        }

        if (!symbol) return M.reply("Invalid symbol!");
        const buffer = await getMiniChartImg(symbol);
        return M.reply(buffer, "image");
    };
}
