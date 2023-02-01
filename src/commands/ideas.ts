import { format as timeago } from "timeago.js";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { shortenUrl } from "../lib/bitly/api";
import { getIdeas, getPrices, searchSymbol } from "../lib/tradingview/api";

@Command("ideas", {
    description: "Ideas dari tradingview;",
    usage: "ideas [symbol]",
    aliases: ["idea", "ide"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const result = await searchSymbol(args.args[0]);
        if (!result) throw new Error("Gagal mencari symbol!");
        if (result.length <= 0) return M.reply("Invalid symbol!");
        const symbol = result[0].symbol;
        const proms = [getIdeas(symbol), getPrices([symbol])] as const;
        const [ideas, prices] = await Promise.all(proms);
        const price = prices[0].price;
        const idea = ideas[0];
        const [imageArrayBuffer, sourceLink] = await Promise.all([
            fetch(idea.data.image_url).then((res) => res.arrayBuffer()),
            shortenUrl(idea.data.published_url),
        ]);
        const imageBuffer = Buffer.from(imageArrayBuffer);
        const message = `
		*${idea.data.short_name}* | $${price}\n
		*Title* : ${idea.data.name}\n
		*Date* : ${timeago(idea.timestamp * 1000)}\n
		*Source* : ${sourceLink}`
            .split("\n")
            .map((s) => s.trim())
            .join("\n");

        return M.reply(imageBuffer, "image", false, undefined, message);
    };
}
