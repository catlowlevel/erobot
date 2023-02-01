import * as cheerio from "cheerio";
import { ROOT_DIR } from "../..";
import { LowDB } from "../../core/LowDB";

const loadCheerio = async (url: string) => {
    const response = await fetch(url);
    if (response.status === 200) {
        const html = await response.text();
        const $ = cheerio.load(html);
        return $;
    }
    throw new Error("Failed to load page : error -> " + response.status);
};
interface Post {
    title: string;
    link: string;
    poster: string;
    rating: string;
    quality: string;
    releaseYear: string;
}
interface DownloadData {
    type: string;
    subType: string;
    server: string;
    link: string;
}
interface PostDetail {
    synopsis: string;
    country: string;
    runTime: string;
    dlData: DownloadData[];
}
export class Driverays {
    private BASE_URL = "https://167.86.71.48/";
    dbData: LowDB<{ [post_link: string]: PostDetail }>;

    constructor() {
        this.dbData = new LowDB<{ [post_link: string]: PostDetail }>(`${ROOT_DIR}/json/drays_posts.json`, {});
    }

    async getPostDetails(post_link: string) {
        console.log("Getting post details...");
        let details: PostDetail = this.dbData.data?.[post_link] ?? {
            dlData: [],
            country: "",
            runTime: "",
            synopsis: "",
        };
        if (details.dlData.length > 0) {
            console.log("cached");
            return details;
        }

        const $ = await loadCheerio(post_link);

        const tBodys = $("#main-content > div.text-sm.my-4.mb-4 > table > tbody");
        tBodys.each((i, tbody) => {
            const trs = $(tbody).find("tr");
            this.extractSeriesData(trs, $, (data: DownloadData) => {
                details.dlData.push(data);
            });
        });
        if (tBodys.length <= 0) {
            const divs = $("#dl_tab");
            divs.each((i, div) => {
                const children = $(div).children();
                this.extractMovieData(children, $, (data: DownloadData) => {
                    details.dlData.push(data);
                });
            });
        }
        const synopsis = $("#tab-1 > p:nth-child(1)").text().trim() ?? "";
        const country = $("div.mr-4:nth-child(2) > a:nth-child(1)").text().trim() ?? "";
        const runTime = $("div.mr-4:nth-child(3)").text().trim() ?? "";
        details = { ...details, synopsis, country, runTime };
        this.dbData.data[post_link] = details;
        await this.dbData.write();
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
        onExtract: (download: DownloadData) => void
    ) {
        const extractTds = (
            tds: cheerio.Cheerio<cheerio.Element>,
            type: string,
            onExtract: (download: DownloadData) => void
        ) => {
            let tdFirst = true;
            let tdType = "";
            tds.each((i, td) => {
                if (tdFirst) {
                    tdType = $(td).text();
                    tdFirst = false;
                } else {
                    const as = $(td).find("a");
                    as.each((i, a) => {
                        const aLink = $(a).attr("href") ?? "";
                        const aServer = $(a).text() ?? "";
                        const data: DownloadData = {
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

        let trFirst = true;
        let trType = "";
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
        onExtract: (download: DownloadData) => void
    ) {
        const details: DownloadData[] = [];
        let first = true;
        let type = "";
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
