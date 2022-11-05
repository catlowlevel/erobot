import convert from "../../../node_modules/convert-pro/convert";
import { Utils } from "../../helper/utils";

const utils = new Utils();

export const downloadFile = async (
    url: string,
    confirmation?: (detail: { fileName: string; size: number; sizeStr: string }) => boolean | Promise<boolean>
) => {
    const response = await fetch(url);
    const contentLength = response.headers.get("content-length") ?? 0;
    console.log("contentLength :>> ", contentLength);
    // if (!contentLength) throw new Error(`This url is possibly not downloadable!\n${JSON.stringify(response)}`);
    const contentDisposition = response.headers.get("content-disposition");
    const parts = contentDisposition?.split(";");
    let fileName = parts?.[1]?.split("=")[1];
    if (!fileName) fileName = url.substring(url.lastIndexOf("/") + 1);
    if (!fileName) fileName = utils.generateRandomUniqueTag(10);
    console.log("filename :>> ", fileName);

    const size = convert.bytes(Number(contentLength), "MB");

    const sizeStr = convert.bytes(Number(contentLength), { accuracy: 2 });

    if (confirmation) {
        const result = await confirmation({ fileName, size, sizeStr });
        if (!result) return { fileName: "", mimeType: "", buffer: null };
    }

    console.log(`Downloading ${fileName}...`);

    const blob = await response.blob();
    console.log("Download done");
    const mimeType = blob.type;
    console.log("mimeType :>> ", mimeType);
    console.log("Converting to buffer...");
    const buffer = Buffer.from(await blob.arrayBuffer());
    console.log("Convert done");
    return { buffer, mimeType, fileName };
};
