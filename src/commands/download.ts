import getUrls from "get-urls";
import fetch from "node-fetch-commonjs";
import convert from "../../node_modules/convert-pro/convert";
import { BaseCommand, Command, IArgs, Message } from "../core";
import { generateRandomUniqueTag } from "../helper/utils";

@Command("download", {
    description: "",
    usage: "",
    aliases: ["dl", "u2f"],
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<any> => {
        const urls = getUrls(args.context);
        if (!urls) return M.reply("Url required!");
        const url = urls.values().next().value as string;
        const response = await fetch(url);
        const contentLength = response.headers.get("content-length");
        if (!contentLength) return M.reply("This url is possibly not downloadable!");
        const contentDisposition = response.headers.get("content-disposition");
        const parts = contentDisposition?.split(";");
        let fileName = parts?.[1].split("=")[1];
        if (!fileName) fileName = url.substring(url.lastIndexOf("/") + 1);
        if (!fileName) fileName = generateRandomUniqueTag(10);
        console.log("filename :>> ", fileName);

        //TODO: Make this into function
        const size = convert.bytes(Number(contentLength), "MB");
        const sizeStr = convert.bytes(Number(contentLength), { accuracy: 2 });
        if (size >= 100) return M.reply(`Max file size is 100MB\nFile size : ${sizeStr}`);
        M.reply(`Downloading *${fileName}*\nSize : ${sizeStr}`);
        console.log(`Downloading ${fileName}...`);

        const blob = await response.blob();
        console.log("Download done");
        const mimeType = blob.type;
        console.log("mimeType :>> ", mimeType);
        console.log("Converting to buffer...");
        const buffer = Buffer.from(await blob.arrayBuffer());
        console.log("Convert done");
        return M.reply(buffer, "document", undefined, mimeType, undefined, undefined, undefined, undefined, fileName);
    };
}
