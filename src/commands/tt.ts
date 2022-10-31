import getUrls from "get-urls";
import fetch from "node-fetch-commonjs";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { tiktokDl } from "../lib/ttdl";

@Command("tt", {
    description: "",
    usage: "",
    aliases: ["tiktok"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args.length <= 0) return M.reply("Link diperlukan!");
        const urls = getUrls(args.context);
        if (!urls) return M.reply("Url required!");
        const url = urls.values().next().value as string;
        console.log("urls", urls);
        const ttdl = await tiktokDl(url);
        console.log("result", ttdl);
        if (ttdl.error) return M.reply(ttdl.error);
        if (!ttdl.video) throw new Error("ttdl.video is undefined");
        if (ttdl.video.urls.length <= 0) throw new Error("download urls is empty");
        const dlLink = ttdl.video.urls[0];
        console.log("Downloading " + dlLink);
        const arrayBuffer = await fetch(dlLink).then((r) => r.arrayBuffer());
        console.log("Download complete");
        console.log("Converting to buffer");
        const buffer = Buffer.from(arrayBuffer);
        console.log("Convert complete");
        console.log("Sending");

        return M.reply(buffer, "video");

        // const url = args.args[0];
        // const data = await downloadTiktok(url);
        // const views = data.video.playCount;
        // const title = data.video.text;

        // const caption = `${title}\n*Views* : ${formatNumber(views, 0)}`;
        // return M.reply(data.buffer, "video", undefined, undefined, caption);
    };
}
