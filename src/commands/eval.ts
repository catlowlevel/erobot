import { fileTypeFromBuffer } from "file-type";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { Command } from "../core/Command";
import { IArgs } from "../core/MessageHandler";

@Command("eval", {
    description: "Jalankan kode javascript",
    usage: "eval [kode]",
    aliases: ["js"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<unknown> => {
        const lines = context.split("\n");
        lines[lines.length - 1] = "return " + lines[lines.length - 1];
        const parsed = lines.join("\n");
        const evaluate = await eval(`;(async () => { ${parsed} })()`).catch((e: Error) => {
            return e.message;
        });
        console.log(Buffer.isBuffer(evaluate), evaluate);
        if (Buffer.isBuffer(evaluate)) {
            const metadata = await fileTypeFromBuffer(evaluate);
            const mimeType = metadata?.mime;
            console.log(metadata);

            type BufferType = Parameters<typeof M.reply>[1];
            const type: BufferType = !mimeType
                ? "document"
                : mimeType.startsWith("video/")
                ? "video"
                : mimeType.startsWith("image/")
                ? "image"
                : "document";
            return M.reply(evaluate, type);
        }
        return M.reply(
            `${JSON.stringify(
                evaluate,
                (_key, value) => {
                    if (typeof value === "function") {
                        return (value as string).toString().split("\n")[0];
                    }
                    return value;
                },
                "\t"
            )}`
        );
    };

    public override handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
}
