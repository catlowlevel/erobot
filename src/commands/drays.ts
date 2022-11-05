import { proto } from "@adiwajshing/baileys";
import { fetch } from "undici";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";
import { shortenUrl } from "../lib/bitly/api";
import { Driverays } from "../lib/driverays";

@Command("drays", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    getOptions(flags: string[]) {
        const type = this.getFlag(flags, "--type", ["details", "download-link", "poster"]);
        const url = this.getFlag(flags, "--url");
        const poster = this.getFlag(flags, "--poster");
        const types = this.getFlag(flags, "--types");
        return { type, url, poster, types };
    }
    public override execute = async (M: Message, { flags, args }: IArgs): Promise<unknown> => {
        flags = flags.filter(
            (f) =>
                f.startsWith("--type") || f.startsWith("--url") || f.startsWith("--poster") || f.startsWith("--types")
        );

        const drays = new Driverays();
        await drays.dbData.waitInit();

        const opts = this.getOptions(flags);

        switch (opts.type) {
            case "poster": {
                if (!opts.url) return M.reply("URL required!");
                const details = await drays.getPostDetails(opts.url);
                const arrayBuffer = await fetch(
                    opts.poster ??
                        "https://assets.kompasiana.com/items/album/2021/08/14/images-6117992706310e0d285e54d2.jpeg?t=t&v=260"
                ).then((r) => r.arrayBuffer());
                const posterBuffer = Buffer.from(arrayBuffer);
                const text = `*${details.runTime}* | *${details.country}*\n====== *Synopsis* ======\n\n${details.synopsis}`;
                return this.client.sendMessage(
                    M.from,
                    {
                        caption: text,
                        image: posterBuffer,
                        buttons: [
                            {
                                buttonId: `.drays --type=details --url=${opts.url}`,
                                buttonText: { displayText: "Get download link" },
                                type: 0,
                            },
                        ],
                    },
                    { quoted: M.message }
                );
            }
            case "details": {
                if (!opts.url) return M.reply("URL required!");
                const details = await drays.getPostDetails(opts.url);

                const types = this.client.utils.groupBy(details.dlData, "type");
                const typesKeys = Object.keys(types);
                //let text = "";
                //details.forEach((d) => {
                //text += `*${d.subType}* | ${d.server} | ${d.link}\n`;
                //});
                return this.client.sendMessage(M.from, {
                    text: "aaa",
                    sections: typesKeys
                        .map((key) => {
                            const data = types[key];
                            const rows: proto.Message.ListMessage.IRow[] = data.map((d) => {
                                return {
                                    description: `${d.server}`,
                                    title: d.subType,
                                    rowId: `.drays --type=download-link --url=${opts.url} --poster=${
                                        opts.poster
                                    } --types=${key.split(" ").join("|")}::::${d.subType
                                        .split(" ")
                                        .join("|")}::::${d.server.split(" ").join("|")}`,
                                };
                            });
                            return {
                                title: key,
                                rows,
                            };
                        })
                        .filter((v, i) => i <= 0),
                    buttonText: "Download",
                });
            }
            case "download-link": {
                console.log("opts", opts);
                if (!opts.url) return M.reply("URL required!");
                if (!opts.types) throw new Error("opts.types is not defined!");
                const [type, subType, server] = opts.types.split("::::");
                console.log([type, subType]);
                const details = await drays.getPostDetails(opts.url);
                console.log("details", details);

                const detail = details.dlData.find(
                    (d) =>
                        d.type.split(" ").join("|") === type &&
                        d.subType.split(" ").join("|") === subType &&
                        d.server.split(" ").join("|") === server
                );
                if (!detail) return M.reply("Gagal mendapatkan download link!");
                const link = await shortenUrl(detail.link);
                return M.reply(`${detail.type} | ${detail.subType}\n*${detail.server}* : ${link}`);
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
                    rowId: `.drays --type=poster --url=${p.link} --poster=${p.poster}`,
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
            if (posts.length <= 0) return M.reply(`Tidak ada hasil pencarian untuk *${query}*`);
            const sections: proto.Message.ListMessage.ISection[] = [{ rows: [], title: "Hasil Pencarian" }];
            posts.forEach((p) => {
                sections[0].rows?.push({
                    title: p.title,
                    description: `${p.quality} | ${p.rating} | ${p.releaseYear}`,
                    rowId: `.drays --type=poster --url=${p.link} --poster=${p.poster}`,
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
