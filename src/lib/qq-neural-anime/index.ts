import axios from "axios";
import md5 from "md5";
import sharp from "sharp";
import { v4 as v4uuid } from "uuid";

import asyncRetry from "async-retry";
import Proxy from "https-proxy-agent";
const { HttpsProxyAgent } = Proxy;

// eslint-disable-next-line prefer-const
export let QQ_MODE: "CHINA" | "WORLD" = "WORLD";

const signV1 = (obj: Record<string, unknown>) => {
    const str = JSON.stringify(obj);
    return md5(
        "https://h5.tu.qq.com" + (str.length + (encodeURIComponent(str).match(/%[89ABab]/g)?.length || 0)) + "HQ31X02e"
    );
};

/**
 *
 * @param imgData base64 encoded image
 * @returns
 */
export const qqRequest = async (imgData: string) => {
    const obj = {
        busiId: QQ_MODE === "WORLD" ? "different_dimension_me_img_entry" : "ai_painting_anime_entry",
        extra: JSON.stringify({
            face_rects: [],
            version: 2,
            platform: "web",
            data_report: {
                parent_trace_id: v4uuid(),
                root_channel: "",
                level: 0,
            },
        }),
        images: [imgData],
    };
    const sign = signV1(obj);

    const httpsAgent = new HttpsProxyAgent("http://rtknibzg-rotate:o78zzaz6csfl@p.webshare.io:80");
    let extra;
    try {
        extra = await asyncRetry(
            async (bail) => {
                const response = await axios.request({
                    httpsAgent,
                    method: "POST",
                    url: "https://ai.tu.qq.com/trpc.shadow_cv.ai_processor_cgi.AIProcessorCgi/Process",
                    data: obj,
                    headers: {
                        "Content-Type": "application/json",
                        Origin: "https://h5.tu.qq.com",
                        Referer: "https://h5.tu.qq.com/",
                        "User-Agent":
                            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
                        "x-sign-value": sign,
                        "x-sign-version": "v1",
                    },
                    timeout: 30000,
                });

                const data = response?.data as Record<string, unknown> | undefined;

                if (!data) {
                    throw new Error("No data");
                }

                if (data.msg === "VOLUMN_LIMIT") {
                    throw new Error("QQ rate limit caught");
                }

                if (data.msg === "IMG_ILLEGAL") {
                    bail(new Error("Couldn't pass the censorship. Try another photo."));
                    return;
                }

                if (data.code === 1001) {
                    bail(new Error("Face not found. Try another photo."));
                    return;
                }

                if (data.code === -2100) {
                    // request image is invalid
                    bail(new Error("Try another photo."));
                    return;
                }

                if (
                    data.code === 2119 || // user_ip_country | service upgrading
                    data.code === -2111 // AUTH_FAILED
                ) {
                    console.error("Blocked", JSON.stringify(data));
                    bail(new Error("The Chinese website has blocked the bot, too bad 🤷‍♂️"));
                    return;
                }

                if (!data.extra) {
                    throw new Error("Got no data from QQ: " + JSON.stringify(data));
                }

                return JSON.parse(data.extra as string);
            },
            {
                onRetry(e, attempt) {
                    console.error(`QQ file upload error caught (attempt #${attempt}): ${e.toString()}`);
                },
                retries: 10,
                factor: 1,
            }
        );
    } catch (e) {
        console.error(`QQ file upload error caught: ${(e as Error).toString()}`);
        throw new Error(`Unable to upload the photo: ${(e as Error).toString()}`);
    }

    return {
        videoUrl: QQ_MODE === "CHINA" ? (extra.video_urls[0] as string) : undefined,
        comparedImgUrl: extra.img_urls[1] as string,
        singleImgUrl: QQ_MODE === "CHINA" ? (extra.img_urls[2] as string) : undefined,
    };
};

export const qqDownload = async (url: string): Promise<Buffer> => {
    let data;
    try {
        data = await asyncRetry(
            async () => {
                const response = await axios.request({
                    url,
                    timeout: 7000,
                    responseType: "arraybuffer",
                });

                if (!response.data) {
                    throw new Error("No data");
                }

                return response.data;
            },
            {
                onRetry(e, attempt) {
                    console.error(`QQ file download error caught (attempt #${attempt}): ${e.toString()}`);
                },
                retries: 10,
                factor: 1,
            }
        );
    } catch (e) {
        console.error(`QQ file download error caught: ${(e as Error).toString()}`);
        throw new Error(`Unable to download media: ${(e as Error).toString()}`);
    }

    return data;
};

export const qqCropImage = async (imgData: Buffer, type: "COMPARED" | "SINGLE"): Promise<Buffer> => {
    const img = sharp(imgData);
    const meta = await img.metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    let cropLeft;
    let cropTop;
    let cropWidth;
    let cropHeight;
    if (type === "COMPARED") {
        cropLeft = 0;
        cropTop = 0;
        cropWidth = width;
        cropHeight = height - (width > height ? 177 : 182);
    } else {
        cropLeft = width > height ? 19 : 27;
        cropTop = width > height ? 19 : 29;
        cropWidth = width - cropLeft - (width > height ? 22 : 30);
        cropHeight = height - cropTop - (width > height ? 202 : 213);
    }

    return img
        .extract({
            left: cropLeft,
            top: cropTop,
            width: cropWidth,
            height: cropHeight,
        })
        .toBuffer();
};
