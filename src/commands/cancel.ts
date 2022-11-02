import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("cancel", {
    description: "Batalkan alert",
    usage: "cancel",
})
export default class extends BaseCommand {
    name = "cancel";
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (!M.quoted) return M.reply("Balas pesan yang ingin dibatalkan!");
        if (!this.client.binance) return console.log("binance is undefined");
        const alerts = this.client.binance.db.data ?? [];

        const replyId = M.quoted.key.id;
        const alert = alerts.find((al) => {
            // console.log("al.msg.key.id", al.msg.key.id);
            // console.log("replyId", replyId);
            return al.msg.key.id === replyId;
        });
        if (!alert) return M.reply("Tidak dapat membatalkan pesan ini!");

        this.client.binance.db.data = this.client.binance.db.data.filter((al) => al.msg.key.id !== alert.msg.key.id);
        this.client.binance.db.write().then(() => {
            console.log("Alert deleted");
        });
        return M.reply("Alert dibatalkan!");
    };
}
