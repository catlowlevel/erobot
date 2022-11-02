import { delay, proto } from "@adiwajshing/baileys";
import { NHentai } from "@shineiichijo/nhentai-ts";
import { fetch } from "undici";
import { BaseCommand, Command, IArgs, Message } from "../core";

type Options = ReturnType<command["getOptions"]>;

@Command("nhentai", {
    description: "",
    usage: "",
    aliases: ["nh"],
})
export default class command extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        args.flags.forEach((flag) => (args.context = args.context.replace(flag, "")));
        args.flags = args.flags.filter(
            (flag) =>
                flag.startsWith("--type=") ||
                flag.startsWith("--get=") ||
                flag.startsWith("--id=") ||
                flag.startsWith("--page=")
        );
        const options = this.getOptions(args.flags);

        if (!options.id) return;

        const nhentai = new NHentai();
        switch (options.type) {
            case "search":
                return await this.handleSearch(M, args, options, nhentai);
            case "get":
                return await this.handleDownload(M, options, nhentai);
        }
        if (options.id) return this.handleDownload(M, options, nhentai);
    };
    private handleSearch = async (
        M: Message,
        { context }: IArgs,
        { page }: Options,
        nhentai: NHentai
    ): Promise<unknown> => {
        if (!context) return M.reply("Provide a query for the search");
        return await nhentai
            .search(context.trim(), { page: Number(page) })
            .then(async ({ data, pagination }) => {
                const sections: proto.Message.ListMessage.ISection[] = [];
                const paginationRows: proto.Message.ListMessage.IRow[] = [];
                if (pagination.currentPage > 1)
                    paginationRows.push({
                        title: "Previous Page",
                        rowId: `.nhentai ${context.trim()} --type=search --page=${pagination.currentPage - 1}`,
                        description: "Returns to the previous page of the search",
                    });
                if (pagination.hasNextPage)
                    paginationRows.push({
                        title: "Next Page",
                        rowId: `.nhentai ${context.trim()} --type=search --page=${pagination.currentPage + 1}`,
                        description: "Goes to the next page of the search",
                    });
                if (paginationRows.length) sections.push({ title: "Pagination", rows: paginationRows });
                let text = "";
                data.forEach((content, i) => {
                    const rows: proto.Message.ListMessage.IRow[] = [];
                    rows.push(
                        {
                            title: "Get PDF",
                            rowId: `.nhentai --type=get --id=${content.id} --get=pdf`,
                        },
                        {
                            title: "Get ZIP",
                            rowId: `.nhentai --type=get --id=${content.id} --get=zip`,
                        }
                    );
                    text += `${i === 0 ? "" : "\n\n"}*#${i + 1}*\n📕 *Title:* ${
                        content.title
                    }\n🌐 *URL: ${content.url.replace("to", "net")}*`;
                    sections.push({ title: content.title, rows });
                });
                return await M.reply(
                    text,
                    "text",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        sections,
                        buttonText: "Search Results",
                    }
                );
            })
            .catch(async () => void (await M.reply(`Couldn't find any doujin | *"${context.trim()}"*`)));
    };

    private handleDownload = async (M: Message, { id, output }: Options, nhentai: NHentai): Promise<unknown> => {
        if (!id) return M.reply("Provide the id of the doujin that you want to download");
        if (!output) output = "pdf";
        const valid = await nhentai.validate(id);
        if (!valid) return M.reply(`Invaid Doujin ID | *"${id}"*`);
        await delay(1500);
        const capitalize = (content: string): string => `${content.charAt(0).toUpperCase()}${content.slice(1)}`;
        return await nhentai
            .getDoujin(id)
            .then(async (res) => {
                const { title, originalTitle, cover, url, tags, images, artists } = res;
                const thumbnail = await fetch(cover || "https://i.imgur.com/uLAimaY.png")
                    .then((r) => r.arrayBuffer())
                    .then((ab) => Buffer.from(ab));
                await M.reply(
                    thumbnail,
                    "image",
                    undefined,
                    undefined,
                    `📕 *Title:* ${title} *(${originalTitle})*\n✍ *Artists:* ${artists}\n🔖 *Tags:* ${tags
                        .map(capitalize)
                        .join(", ")}\n📚 *Pages:* ${images.pages.length}`,
                    undefined,
                    {
                        title,
                        body: originalTitle,
                        thumbnail,
                        mediaType: 1,
                        sourceUrl: url.replace("to", "net"),
                    }
                );
                const buffer = await images[output === "zip" ? "zip" : "PDF"]();
                return await M.reply(
                    buffer,
                    "document",
                    undefined,
                    `application/${output}`,
                    undefined,
                    undefined,
                    undefined,
                    thumbnail,
                    `${title}.${output}`
                );
            })
            .catch(async () => void (await M.reply(`*Try Again!*`)));
    };

    private getOptions = (flags: string[]) => {
        const type = this.getFlag(flags, "--type=", ["search", "get"], "search");
        const page = this.getFlag(flags, "--page=");
        const id = this.getFlag(flags, "--id=", [], "");
        const output = this.getFlag(flags, "--get=", ["zip", "pdf"]);
        return { type, page, id, output };
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
