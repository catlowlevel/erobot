import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";

export default class extends BaseCommand {
    name = "alerts";
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
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
