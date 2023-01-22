import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { snaptik } from "../lib/snaptik";

@Command("fb", {
    description: "",
    usage: "",
    aliases: ["facebook"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (args.args.length <= 0) return M.reply("Link diperlukan!");
        const url = args.args[0];
        console.log("url :>> ", url);
        //TODO: Directly download video
        const results = await snaptik.facebook(url);
        return M.reply(JSON.stringify(results, null, 2));
        // const buffer = await downloadFacebook(url);
        // return M.reply(buffer, "video");
    };
}
