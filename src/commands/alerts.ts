import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";

@Command("alerts", {
    description: "List alert yang aktif",
    usage: "alerts",
})
export default class extends BaseCommand {
    public override execute = async (M: Message): Promise<unknown> => {
        if (!this.client.binance) return console.log("binance is undefined");
        const alerts = this.client.binance.db.data ?? [];
        const filtered = alerts.filter((alert) => alert.msg.key.remoteJid === M.from && alert.done === false);
        if (filtered.length <= 0) {
            return M.reply("There's no active alerts!");
        }

        let message = "=======Alert List=======\n";
        filtered.forEach((alert, idx) => {
            message += `${idx + 1}\t- ${alert.symbol}\t| ${alert.alertPrice}\n`;
        });
        return M.reply(message);
    };
}
