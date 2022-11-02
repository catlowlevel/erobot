import { fetch } from "undici";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { Apkmody } from "../lib/apkmody";
import { downloadFile } from "../lib/downloader";

@Command("apkmody", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (args.args.length <= 0) return M.reply("Nama apk diperlukan!");
        const apkmody = new Apkmody();
        const name = args.context;
        console.log("name :>> ", name);
        const posts = await apkmody.search(name);
        const dl = await apkmody.getDownloadLink(posts[0].link);
        const url = await fetch(dl).then((r) => r.url);
        console.log("url :>> ", url);
        await downloadFile(url, async ({ fileName, size, sizeStr }) => {
            await this.client.sendMessage(M.from, {
                text: `Download *${fileName}*\nSize : *${sizeStr}*`,
                buttons: [{ buttonText: { displayText: "Confirm" }, buttonId: `.download ${url} --no-confirm` }],
            });
            return false; // use download command to process the download
        });
    };
}
