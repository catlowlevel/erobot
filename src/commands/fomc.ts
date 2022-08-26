import { format } from "timeago.js";
import { getCalendar } from "../api/investing/api";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
@Command("fomc", {
    description: "Economic calendar",
    usage: "fomc",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        const results = await getCalendar();
        const upcoming = results.filter((r) => new Date(r.date).getDate() === new Date().getDate());
        const usd = upcoming.filter((u) => u.economy === "USD");

        let messages = "=-=-=Economic Calendar=-=-=\n";
        usd.forEach((data) => {
            const date = new Date(data.date);
            messages += `*${data.name}* ${format(date)} | ${data.impact > 0 ? "🟥".repeat(data.impact) : ""}\n\n`;
        });
        return M.reply(messages);
    };
}
