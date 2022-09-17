import * as cheerio from "cheerio";
import fetch from "node-fetch-commonjs";

const loadCheerio = async (url: string) => {
    try {
        const response = await fetch(url);
        if (response.status === 200) {
            const html = await response.text();
            const $ = cheerio.load(html);
            return $;
        }
        throw new Error("Failed to load page : error -> " + response.status);
    } catch (error) {
        throw error;
    }
};
interface Post {
    title: string;
    link: string;
    poster: string;
    rating: string;
    quality: string;
    releaseYear: string;
}
interface Data {
    type: string;
    subType: string;
    server: string;
    link: string;
}
export class Driverays {
    private BASE_URL = "https://167.86.71.48/";
    constructor() {}

    async getPostDetails(post_link: string) {
        console.log("Getting post details...");

        const details: Data[] = [];
        const $ = await loadCheerio(post_link);

        const tBodys = $("#main-content > div.text-sm.my-4.mb-4 > table > tbody");
        tBodys.each((i, tbody) => {
            const trs = $(tbody).find("tr");
            this.extractSeriesData(trs, $, (data: Data) => {
                details.push(data);
            });
        });
        if (tBodys.length <= 0) {
            const divs = $("#dl_tab");
            divs.each((i, div) => {
                const children = $(div).children();
                this.extractMovieData(children, $, (data: Data) => {
                    details.push(data);
                });
            });
        }
        return details;
    }
    async searchPosts(query: string) {
        const url = `https://167.86.71.48/?s=${query}&post_type=post`;
        return this.getPosts(url);
    }
    async getLatestMovies() {
        return this.getPosts(this.BASE_URL);
    }
    private async getPosts(url: string) {
        console.log("Getting posts for " + url);
        const $ = await loadCheerio(url);
        const movies = $("#movies");
        const postEls = $(movies).find("[id^=post]");
        const posts: Post[] = [];
        postEls.each((i, post) => {
            const a = $(post).find("a").first();
            const title = $(a).attr("title") ?? "";
            const link = $(a).attr("href") ?? "";
            const poster = $(a).find("img").attr("src") ?? "";

            const quality = $(a).find(".thumbnail").children().first().text().trim();

            const desc = $(a).find(".desc");
            const ratingSpan = desc.children().first();
            const rating = $(ratingSpan).text().trim() ?? "";
            const releaseYear = $(ratingSpan).next().text().trim() ?? "";

            posts.push({
                title,
                link,
                poster,
                quality,
                rating,
                releaseYear,
            });
        });
        return posts;
    }
    private async extractSeriesData(
        elem: cheerio.Cheerio<cheerio.Element>,
        $: cheerio.CheerioAPI,
        onExtract: (download: Data) => void
    ) {
        const extractTds = (
            tds: cheerio.Cheerio<cheerio.Element>,
            type: string,
            onExtract: (download: Data) => void
        ) => {
            var tdFirst = true;
            var tdType = "";
            tds.each((i, td) => {
                if (tdFirst) {
                    tdType = $(td).text();
                    tdFirst = false;
                } else {
                    const as = $(td).find("a");
                    as.each((i, a) => {
                        const aLink = $(a).attr("href") ?? "";
                        const aServer = $(a).text() ?? "";
                        const data: Data = {
                            type: type,
                            subType: tdType,

                            server: aServer,
                            link: aLink,
                        };
                        onExtract(data);
                    });
                }
            });
        };

        var trFirst = true;
        var trType = "";
        elem.each((i, tr) => {
            if (trFirst) {
                trType = $(tr)
                    .text()
                    .replace(/(\r\n|\n|\r)/gm, "|");
                trFirst = false;
            } else {
                const tds = $(tr).find("td");
                extractTds(tds, trType, onExtract);
            }
        });
    }

    private async extractMovieData(
        elem: cheerio.Cheerio<cheerio.Element>,
        $: cheerio.CheerioAPI,
        onExtract: (download: Data) => void
    ) {
        const details: Data[] = [];
        var first = true;
        var type = "";
        elem.each((i, div) => {
            if (first) {
                first = false;
                type = $(div)
                    .text()
                    .replace(/(\r\n|\n|\r)/gm, "|");
            } else {
                const subType = $(div).children().first().text();
                const divs = $(div).children().last();
                const as = divs.find("a");
                as.each((i, a) => {
                    const link = $(a).attr("href") ?? "";
                    const server = $(a).text() ?? "";
                    // console.log(`${type} -> ${subType} -> ${server} -> ${link}`);
                    onExtract({
                        type,
                        subType,
                        link,
                        server,
                    });
                });
            }
        });
        return details;
    }
}
