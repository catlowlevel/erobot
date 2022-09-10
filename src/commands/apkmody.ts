import fetch from "node-fetch-commonjs";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { Apkmody } from "../lib/apkmody";

@Command("apkmody", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        if (args.args.length <= 0) return M.reply("Nama apk diperlukan!");
        const apkmody = new Apkmody();
        const name = args.context;
        console.log("name :>> ", name);
        const posts = await apkmody.search(name);
        const dl = await apkmody.getDownloadLink(posts[0].link);
        console.log("dl :>> ", dl);
        const arrayBuffer = await fetch(dl).then((res) => res.arrayBuffer());
        const buffer = Buffer.from(arrayBuffer);
        return M.reply(buffer, "document", undefined, "application/vnd.android.package-archive");
    };
}
