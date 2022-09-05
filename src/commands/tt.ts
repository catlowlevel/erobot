import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { formatNumber } from "../helper/utils";
import { downloadTiktok } from "../lib/tiktok";

@Command("tt", {
    description: "",
    usage: "",
    aliases: ["tiktok"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args.length <= 0) return M.reply("Link diperlukan!");
        const url = args.args[0];
        const data = await downloadTiktok(url);
        const views = data.video.playCount;
        const title = data.video.text;

        const caption = `${title}\n*Views* : ${formatNumber(views, 0)}`;
        return M.reply(data.buffer, "video", undefined, undefined, caption);
    };
}
