import getUrls from "get-urls";
import { BaseCommand, Command, IArgs, Message } from "../core";
import { downloadFile } from "../lib/downloader";

@Command("download", {
    description: "",
    usage: "",
    aliases: ["dl", "u2f"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const noConfirm = args.flags.filter((f) => f.startsWith("--no-confirm")).length > 0;
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

            if (!noConfirm) {
                await this.client.sendMessage(M.from, {
                    text: `Download *${fileName}*\nSize : *${sizeStr}*`,
                    buttons: [{ buttonText: { displayText: "Confirm" }, buttonId: `.download ${url} --no-confirm` }],
                });
                return false;
            }

            await M.reply(`Downloading... *${fileName}*\nSize : *${sizeStr}*`);
            return true;
        });
        if (!buffer) return;
        await M.reply("Download Completed\nUploading...");
        const type: "text" | "image" | "video" | "audio" | "sticker" | "document" = mimeType.startsWith("video/")
            ? "video"
            : mimeType.startsWith("image/")
            ? "image"
            : "document";
        return M.reply(buffer, type, undefined, mimeType, undefined, undefined, undefined, undefined, fileName);
    };
}
