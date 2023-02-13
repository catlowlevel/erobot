import { ChatGPTAPI, ChatMessage } from "chatgpt";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("chatgpt", {
    description: "",
    usage: "",
    aliases: ["gpt", "ai"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        if (!process.env.OPENAI_API_KEY) throw new Error("NO OPENAI APIKEY!");
        const api = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY as string });
        this.lastResult = await api.sendMessage(args.context, { parentMessageId: this.lastResult?.id });
        return M.reply(this.lastResult.text);
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
    lastResult: ChatMessage;
}
