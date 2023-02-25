import { proto } from "@adiwajshing/baileys";
import Queue from "queue";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("imagine", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    queue = Queue({ autostart: true, concurrency: 1 });
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const quoted = M.quoted?.content;
        console.log(args.context, quoted);
        args.context = args.context ? args.context : (quoted as string);
        if (!args.context) return M.reply("Prompt required!");
        if (this.queue.length > 0) M.reply(`You are in a queue : ${this.queue.length}`);

        const id = this.getFlag(args.flags, "--id");
        const style = args.flags.some((a) => a.startsWith("--style"));
        console.log(style);

        console.log(id);

        if (!id && style) {
            const sections: proto.Message.ListMessage.ISection[] = [];
            sections.push({
                title: "Available styles",
                rows: this.styles.map((style) => ({
                    title: style.style_name,
                    rowId: `.imagine ${args.context} --id=${style.style_id}`,
                })),
            });
            return M.reply(
                "Style",
                "text",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                { buttonText: "Select Style", sections }
            );
        }
        //TODO: validate id
        return new Promise<void>((res) => {
            this.queue.push(async (cb) => {
                try {
                    const buffer = await this.imagine(args.context, id);
                    await M.reply(buffer, "image", undefined, undefined, args.context);
                    res();
                } catch (err) {
                    await M.reply("Error");
                    res();
                    cb?.();
                }
            });
        });
    };
    imagine = async (prompt: string, styleId?: string) => {
        const data = new URLSearchParams({ model_version: "1", prompt, width: "512", height: "512" });
        if (styleId) data.append("style_id", styleId);

        return this.client.utils.getBuffer("https://inferenceengine.vyro.ai/sd", {
            body: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        });
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
    styles = [
        { style_id: "27", style_name: "Imagine V2" },
        { style_id: "28", style_name: "Imagine V1" },
        { style_id: "29", style_name: "Realistic" },
        { style_id: "21", style_name: "Anime" },
        { style_id: "3", style_name: "Cyberpunk" },
        { style_id: "7", style_name: "Euphoric" },
        { style_id: "101", style_name: "Poster Art" },
        { style_id: "102", style_name: "Ink" },
        { style_id: "103", style_name: "Japanese Art" },
        { style_id: "104", style_name: "Salvador Dali" },
        { style_id: "105", style_name: "Van Gogh" },
        { style_id: "106", style_name: "Steampunk" },
        { style_id: "107", style_name: "Retrowave" },
        { style_id: "108", style_name: "Poly Art" },
        { style_id: "109", style_name: "Vibrant" },
        { style_id: "110", style_name: "Mystical" },
        { style_id: "111", style_name: "Cinematic Render" },
        { style_id: "112", style_name: "Futuristic" },
        { style_id: "113", style_name: "Polaroid" },
        { style_id: "114", style_name: "Picaso" },
        { style_id: "115", style_name: "Sketch" },
        { style_id: "116", style_name: "Comic Book" },
    ];
}
