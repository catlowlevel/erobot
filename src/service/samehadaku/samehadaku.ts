import { proto } from "@adiwajshing/baileys";
import { JSONFile, Low } from "@commonify/lowdb";
import * as cheerio from "cheerio";
import { fetch } from "undici";
import { ROOT_DIR } from "../..";
import { Client } from "../../core";
import { extractNumber } from "../../helper/utils";
export interface Post {
    title: string;
    eps: string;
    releaseDate: string;
    thumb: string;
    url: string;
}
type Resolution = {
    [res: string]: { server: string; url: string; title: string }[];
};

export interface SearchPost {
    link: string;
    title: string;
    poster: string;
    rating: string;
    sinopsis: string;
    genres: string[];
}

export class Samehadaku {
    BASE_URL = "https://194.163.183.129/";
    private postAdapter = new JSONFile<Post[]>(`${ROOT_DIR}/json/samehadaku_posts.json`);
    db: Low<Post[]>;
    htmlCacheMap: Map<string, string>; //url, html

    constructor(private client: Client) {
        this.htmlCacheMap = new Map<string, string>();
        setInterval(() => {
            this.htmlCacheMap.forEach((_, key) => {
                this.htmlCacheMap.delete(key);
            });
            this.htmlCacheMap = new Map<string, string>();
        }, 1000 * 60 * 60);

        this.db = new Low(this.postAdapter);
        this.db.write().then(() => {
            this.db.read().then(() => {
                this.loop();
            });
            this.db.data ||= [];
        });
    }

    async loop() {
        try {
            const posts = await this.getPosts();

            const newPosts = posts.filter((post) => {
                if (!this.db.data) throw new Error("data is undefined");
                return !this.db.data.map((post) => post.url).includes(post.url);
            });
            this.db.data = posts;

            await this.db.write();
            console.log(
                "saved new Posts",
                newPosts.map((p) => p.title)
            );
            for (const post of newPosts) {
                // await this.sendPost("62895611963535-1631537374@g.us", post);
                // await this.sendPost("6282293787977-1527865416@g.us", post);
            }
            setTimeout(() => this.loop(), 1000 * 60 * 60);
        } catch (error) {
            console.log("Error on loop", error);
        }
    }

    async sendPost(to: string, post: Post, reply?: proto.IWebMessageInfo) {
        const response = await fetch(post.thumb.split("?")[0]);
        const thumbBuffer = Buffer.from(await response.arrayBuffer());
        return this.client.sendMessage(
            to,
            {
                caption: `*${post?.title}*`,
                image: thumbBuffer,
                buttons: [
                    {
                        buttonText: { displayText: "Sinopsis" },
                        type: 0,
                        buttonId: `.samehadaku --url=${post.url} --type=sinopsis`,
                    },
                    {
                        buttonText: { displayText: "Download" },
                        type: 0,
                        buttonId: `.samehadaku --url=${post.url} --type=download`,
                    },
                    {
                        buttonText: { displayText: "Other Episodes" },
                        type: 0,
                        buttonId: `.samehadaku --url=${post.url} --type=other_episodes`,
                    },
                ],
            },
            { quoted: reply }
        );
    }
    async searchPosts(query: string) {
        // https://194.163.183.129/?s=ojisan
        const url = `${this.BASE_URL}?s=${query}`;
        console.log("url", url);
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        const main = $("main[role='main']");
        const results = main.find(".animepost");

        const searchResults: SearchPost[] = [];
        results.each((i, post) => {
            const a = $(post).find("a").first();
            const link = a.attr("href") ?? "";
            const title = a.attr("title") ?? "";
            const poster = a.find("img").attr("src") ?? "";
            const rating = $(post).find(".score")?.text()?.trim() ?? "";
            const sinopsis = $(post).find(".ttls")?.text()?.trim() ?? "";

            const mta = $(post).find(".genres>.mta");
            const genres: string[] = [];
            mta.children().each((i, a) => {
                if ($(a).text()) genres.push($(a).text().trim());
            });
            searchResults.push({
                title,
                link,
                poster,
                rating,
                sinopsis,
                genres,
            });
        });
        return searchResults;
    }

    async getPosts() {
        const response = await fetch(this.BASE_URL);
        const html = await response.text();
        const $ = cheerio.load(html);
        const postShow = $("div.post-show").first();
        const posts: Post[] = postShow.children()[0].children.map((child) => {
            const post = $(child);
            const titleTitle = post.find("[title]");
            const title = titleTitle.text().trim();
            const url = titleTitle.attr("href") || "";
            const spans = post.find("span");
            const eps = spans.first()?.text()?.trim();
            const releaseDate = spans.last()?.text()?.trim()?.split(":")[1];
            const thumb = post.find("img").attr("src") || "";
            const epsUrls: string[] = [];
            const epsNumber = Number(extractNumber(eps));
            if (epsNumber > 1) {
                let maxEps = 20;
                for (let i = epsNumber; i > 0; i--) {
                    const epsUrl = url.replace(`episode-${epsNumber}` ?? "", `episode-${i}`);
                    epsUrls.push(epsUrl);
                    if (!maxEps--) break;
                }
            }

            return { title, eps, releaseDate, thumb, url };
        });
        return posts;
    }
    async getOtherEpisodes(postUrl: string) {
        const cache = this.htmlCacheMap.get(postUrl);
        let html = "";
        if (cache) {
            console.log("Using cache for " + postUrl);
            html = cache;
        } else {
            const response = await fetch(postUrl);
            html = await response.text();
            this.htmlCacheMap.set(postUrl, html);
            console.log("Setting cache for " + postUrl);
        }
        if (html === "") throw new Error("Failed to fetch!");

        const $ = cheerio.load(html);

        const eps = $(".epsleft");

        const epsUrls: { url: string; title: string }[] = [];

        eps.each((idx, el) => {
            const a = $(el).find("a");
            if (!a) throw new Error("Fail to scrape others episodes!");
            const url = a.attr("href") || "";
            if (url === postUrl) return true;
            const title = a.text().trim() || "";
            epsUrls.push({ url, title });
            return true;
        });

        return epsUrls;
    }
    getSinopsis = async (url: string) => {
        const cache = this.htmlCacheMap.get(url);
        let html = "";
        if (cache) {
            console.log("Using cache for " + url);
            html = cache;
        } else {
            const response = await fetch(url);
            html = await response.text();
            this.htmlCacheMap.set(url, html);
            console.log("Setting cache for " + url);
        }
        if (html === "") throw new Error("Failed to fetch!");
        const $ = cheerio.load(html);
        const sinopsis = $("[itemprop=description]").text().trim();
        let genre = "Genre: \n";
        $("[itemprop='genre']").each((i, el) => {
            genre += `*${$(el).text()?.trim()}*\n`;
        });
        return `${sinopsis}\n\n${genre}`;
    };
    getDownloadLinks = async (url: string, title: string) => {
        const cache = this.htmlCacheMap.get(url);
        let html = "";
        if (cache) {
            console.log("Using cache for " + url);
            html = cache;
        } else {
            const response = await fetch(url);
            html = await response.text();
            this.htmlCacheMap.set(url, html);
            console.log("Setting cache for " + url);
        }
        if (html === "") throw new Error("Failed to fetch!");
        const $ = cheerio.load(html);

        // MKV : {resolution : {server : string, url : string}}
        const dlData: {
            [key: string]: Resolution;
        } = {};
        const dlDivs = $(".download-eps");
        dlDivs.each((i, dlDiv) => {
            const format = $(dlDiv).find("b").text().trim();
            if (!dlData[format]) dlData[format] = {};

            const rows = $(dlDiv).find("li");
            rows.each((i, row) => {
                const resolution = $(row).find("strong").text().trim();
                const spans = $(row).find("span");
                spans.each((i, span) => {
                    const link = $(span).find("a").attr("href");
                    const server = $(span).find("a").text().trim();

                    if (!dlData[format][resolution]) dlData[format][resolution] = [];
                    dlData[format][resolution].push({
                        server,
                        url: link ?? "",
                        title: title,
                    });
                });
            });
        });
        return dlData;
    };

    //TODO : Some url breaks, fix required
    getPost = async (url: string) => {
        const cache = this.htmlCacheMap.get(url);
        let html = "";
        if (cache) {
            console.log("Using cache for " + url);
            html = cache;
        } else {
            const response = await fetch(url);
            html = await response.text();
            this.htmlCacheMap.set(url, html);
            console.log("Setting cache for " + url);
        }
        if (html === "") throw new Error("Failed to fetch!");

        const $ = cheerio.load(html);

        const otherA = $(`[href="${url}"]`); //breaks for some url
        const imgEl = $(otherA).find("img");
        const thumb = $(imgEl).attr("src") ?? "";
        const title = $(imgEl).attr("title") ?? "";
        const timePost = $(".time-post").text().trim() ?? "";
        const epsNumber = $('[itemprop="episodeNumber"]').text() ?? "";
        const post: Post = {
            title,
            eps: `Episode ${epsNumber}`,
            releaseDate: timePost,
            thumb,
            url,
        };
        return post;
    };
}
