import { getVideoMeta } from "tiktok-scraper";
import { fetch } from "undici";

export const downloadTiktok = async (url: string) => {
    url = await fetch(url).then((res) => res.url);
    const metadata = await getVideoMeta(url);
    const video = metadata.collector[0];
    const headers = metadata.headers;
    const videoUrl = video.videoUrl;
    const response = await fetch(videoUrl, { headers: { ...headers } });
    if (response.status !== 200) throw new Error(response.statusText);
    const arrayBuffer = await response.arrayBuffer();
    return { video, buffer: Buffer.from(arrayBuffer) };
};
