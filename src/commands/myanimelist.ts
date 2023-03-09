import { BaseCommand, Command, IArgs, Message } from "../core";
import { searchAnime } from "../lib/mal";

@Command("myanimelist", {
    description: "",
    usage: "",
    aliases: ["mal"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (!args.context) return M.reply("what's your query?");
        const result = await searchAnime(args.context);
        const sections = M.createSections(result.data, "Result", (anime) => {
            const title = (anime["titles"] as any[])[0].title;
            const type = anime["type"];
            const episodes = anime["episodes"];
            const status = anime["status"];
            return { title, rowId: "", description: `${type} | ${episodes} Episode(s) | ${status}` };
        });
        return M.reply(
            `Query *${args.context}*`,
            "text",
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            {
                buttonText: "Search Result",
                sections,
            }
        );
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
