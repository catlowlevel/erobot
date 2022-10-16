import getUrls from "get-urls";
import { BaseCommand, Command, IArgs, Message } from "../core";
import { downloadFile } from "../lib/downloader";

@Command("download", {
    description: "",
    usage: "",
    aliases: ["dl", "u2f"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        const urls = getUrls(args.context);
        if (!urls) return M.reply("Url required!");
        const url = urls.values().next().value as string;
        const { buffer, mimeType, fileName } = await downloadFile(url, async ({ fileName, size, sizeStr }) => {
            if (size <= 0) {
                M.reply("This url is possibly not downloadable!");
                return false;
            }
            if (size <= 0.5) {
                M.reply(`Minimal size 500 KB\nFile size : *${sizeStr}*`);
                return false;
            }

            await M.reply(`Downloading... *${fileName}*\nSize : *${sizeStr}*`);
            return true;
        });
        if (!buffer) return;
        await M.react("Download Completed\nUploading...");
        M.reply(buffer, "document", undefined, mimeType, undefined, undefined, undefined, undefined, fileName);
    };
}
