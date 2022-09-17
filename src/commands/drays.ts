import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { Driverays } from "../lib/driverays";

@Command("drays", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    getOptions(flags: string[]) {
        const type = this.getFlag(flags, "--type", ["details"]);
        const url = this.getFlag(flags, "--url");
        return { type, url };
    }
    public override execute = async (M: Message, { flags, args }: IArgs): Promise<any> => {
        flags = flags.filter((f) => f.startsWith("--type") || f.startsWith("--url"));

        const drays = new Driverays();

        const opts = this.getOptions(flags);

        switch (opts.type) {
            case "details": {
                if (!opts.url) return M.reply("URL required!");
                const details = await drays.getPostDetails(opts.url);
                let text = "";
                details.forEach((d) => {
                    text += `*${d.subType}* | ${d.server} | ${d.link}\n`;
                });
                return M.reply(text);
            }

            default:
                {
                    console.log("Default");
                }
                break;
        }
        if (args.length <= 0) {
            const posts = await drays.getLatestMovies();
            const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "Latest Movies" }];
            posts.forEach((p) => {
                sections[0].rows?.push({
                    title: p.title,
                    description: `${p.quality} | ${p.rating} | ${p.releaseYear}`,
                    rowId: `.drays --type=details --url=${p.link}`,
                });
            });
            return this.client.sendMessage(
                M.from,
                {
                    text: `Driverays`,
                    buttonText: "Latest Movies",
                    sections,
                },
                { quoted: M.message }
            );
        } else {
            const query = args.join(" ");
            console.log("query", query);
            const posts = await drays.searchPosts(query);
            const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "Hasil Pencarian" }];
            posts.forEach((p) => {
                sections[0].rows?.push({
                    title: p.title,
                    description: `${p.quality} | ${p.rating} | ${p.releaseYear}`,
                    rowId: `.drays --type=details --url=${p.link}`,
                });
            });
            return this.client.sendMessage(
                M.from,
                {
                    text: `Driverays query : ${query}`,
                    buttonText: "Hasil Pencarian",
                    sections,
                },
                { quoted: M.message }
            );
        }
    };
}
