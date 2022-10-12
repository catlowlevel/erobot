import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { formatDate } from "../helper/utils";
import { Coin } from "../service/coindar/coindar";

@Command("events", {
    description: "Event dari coindar",
    usage: "events [coin]",
    aliases: ["event"],
})
export default class extends BaseCommand {
    get coindar() {
        return this.client.coindar;
    }
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (!this.client.coindar) return console.log("coindar is undefined");
        const coins: Coin[] = [];
        for (const arg of args.args) {
            const coin = this.coindar.findCoins(arg);
            if (coin) coin.forEach((c) => coins.push(c));
        }
        //log coins
        coins.forEach((c) => console.log(c.symbol, c.name));

        const today = formatDate(new Date());
        const tomorrow = formatDate(new Date(new Date().setHours(24)));
        const events = await this.coindar.fetchEvents({
            startDate: today,
            endDate: tomorrow,
            coinIds: coins.map((c) => c.id),
        });
        let message = "Event ";
        if (coins.length) {
            message += "mendatang untuk coin :";
            coins.forEach((c) => {
                message += `\n${c.symbol} *(${c.name})*`;
            });
        } else {
            message += "untuk 2 hari mendatang";
        }
        if (events.length) {
            message += "\n============================";
            message += events.reduce((acc, curr) => {
                return `${acc}\n*${curr.date_start.replace(/-/g, "/")}* - ${
                    this.coindar.coins.find((c) => c.id === curr.coin_id)?.name ?? ""
                } *(${this.coindar.coins.find((c) => c.id === curr.coin_id)?.symbol ?? ""})* | ${curr.caption}`;
            }, "");
        }

        message += "\n============================\n_API_ disediakan oleh https://coindar.org/";
        return M.reply(message);
    };
}
