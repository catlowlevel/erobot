import getUrls from "get-urls";
import { getLinkPreview } from "link-preview-js";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("linkpreview", {
    description: "",
    usage: "",
    aliases: ["links", "preview"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const urls = getUrls(args.context);
        if (!urls) return M.reply("Url required!");
        const url = urls.values().next().value as string;
        const preview = await getLinkPreview(url, { followRedirects: "follow" });
        const text = JSON.stringify(preview, null, 2);
        return this.client.sendMessage(
            M.from,
            {
                text,
                linkPreview: {
                    "canonical-url": "",
                    "matched-text": "",
                    title: "",
                    description: "",
                },
            },
            { quoted: M.message }
        );
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
