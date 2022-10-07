import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { shortenUrl } from "../lib/bitly/api";

@Command("bitly", {
    description: "Shorten url",
    usage: "bitly [url]",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args.length <= 0) return M.reply("No url provided!");
        const url = args.args[0];
        const shorten = await shortenUrl(url);
        return M.reply(shorten);
    };
}
