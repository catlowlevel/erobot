import { fetch } from "undici";

interface Result {
    video?: Video;
    provider: string;
}
interface ResultError {
    error?: string;
    provider: string;
}

interface Video {
    thumb: string;
    urls: string[];
}

type TikTokDL = Result & ResultError;
export const tiktokDl = async (url: string) =>
    fetch(`http://localhost:3123/api/download?url=${url}`).then((r) => r.json() as Promise<TikTokDL>); //https://github.com/hansputera/tiktok-dl
