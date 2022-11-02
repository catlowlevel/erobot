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

type Provider =
    | "snaptik"
    | "tikmate"
    | "ttdownloaderone"
    | "tikdown"
    | "musicallydown"
    | "downtik"
    | "lovetik"
    | "ttdownloader"
    | "dddtik";

export const tiktokDl = async (url: string, provider?: Provider) => {
    const params = new URLSearchParams({ url });
    if (provider) params.append("provider", provider);

    return fetch(`http://localhost:3123/api/download?${params}`).then((r) => r.json() as Promise<TikTokDL>); //https://github.com/hansputera/tiktok-dl
};
