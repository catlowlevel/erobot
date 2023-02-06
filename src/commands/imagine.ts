import Queue from "queue";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("imagine", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    queue = Queue({ autostart: true, concurrency: 1 });
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (!args.context) return M.reply("Prompt required!");
        if (this.queue.length > 0) M.reply(`You are in a queue : ${this.queue.length}`);
        return new Promise<void>((res) => {
            this.queue.push(async (cb) => {
                try {
                    const buffer = await this.imagine(args.context);
                    await M.reply(buffer, "image");
                    res()
                } catch (err) {
                    await M.reply("Error");
                    res()
                    cb?.();
                }
            });
        });
    };
    imagine = async (prompt: string) => {
        const data = new URLSearchParams({ model_version: "1" });
        data.append("prompt", prompt);
        data.append("width", "512");
        data.append("height", "512");

        return this.client.utils.getBuffer("https://inferenceengine.vyro.ai/sd", {
            body: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        });
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
