import { BaseCommand, Command, IArgs, Message } from "../core";
import { CharaAi } from "../lib/beta.character.ai/CharaAi";

@Command("googleai", {
    description: "",
    usage: "",
    aliases: ["gai", "ai", "google"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<any> => {
        if (!context) return M.reply("Tanyakan sesuatu...");
        const ai = new CharaAi("UI68g1Msb3dinws1rin1unk2y97TizoZpYN5SHq0n-s");
        await ai.create();
        const response = await ai.text(context);
        return M.reply(response.replies[0].text);
    };
}
