import { config } from "dotenv";
import { removeBackgroundFromImageBase64 } from "remove.bg";

export const removeBg = async (image: Buffer) => {
    config();
    const base64Image = image.toString("base64");
    const result = await removeBackgroundFromImageBase64({
        apiKey: process.env.REMOVEBG_APIKEY || "DTSixDNbRNj9ra3jCT12YB9k",
        base64img: base64Image,
    });
    const { base64img, ...rest } = result;
    console.log("rest", rest);
    const imageBuffer = Buffer.from(base64img, "base64");
    return imageBuffer;
};
