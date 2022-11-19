import { load } from "cheerio";
import { fetch } from "undici";

interface IAlbum {
    id: number;
    link: string;
    name: string;
    thumb: string;
    tags: string[];
}

interface IAlbumData {
    id: number;
    images: IImage[];
    name: string;
    currentPage: number;
    lastPage: number;
}

interface IImage {
    link: string;
    width: number;
    height: number;
}
export class Buondua {
    private BASE_URL = "https://buondua.com/";
    private static cache: Record<string, IAlbumData> = {};
    constructor() {
        setTimeout(() => {
            setInterval(() => {
                console.log(`Resetting Buondua cache | ${Object.keys(Buondua.cache).length} `);
                Buondua.cache = {};
            }, 1000 * 60 * 60 * 12);
        }, 1000 * 60 * 60 * 12);
    }

    public getHomepage = async () => {
        const html = await fetch(this.BASE_URL).then((r) => r.text());
        return this.parseAlbumHtml(html);
    };

    public getHotPage = async () => {
        const html = await fetch(`${this.BASE_URL}hot`).then((r) => r.text());
        return this.parseAlbumHtml(html);
    };

    //TODO: handle link and id
    public getAlbumsData = async (id: number, page = 1) => {
        const url = `${this.BASE_URL}${id}/?page=${page}`;
        console.log("url :>> ", url);
        if (Buondua.cache[url]) {
            console.log("returning cache");
            return Buondua.cache[url];
        }
        const html = await fetch(url).then((r) => r.text());
        const $ = load(html);
        const pTags = $(".article-fulltext").find("p");
        const images: IImage[] = [];
        pTags.each((i, p) => {
            const img = $(p).find("img");
            const link = img.attr("src");
            const w = img.attr("width");
            const width = Number(w);
            const h = img.attr("height");
            const height = Number(h);
            if (link && !isNaN(width) && !isNaN(height)) {
                images.push({ link, width, height });
            } else {
                console.log(`something index@${i} is undefined`);
            }
        });

        const name = $("h2").first().text().trim();
        console.log("name :>> ", name);

        const paginationList = $(".pagination-list");
        const lastSpan = paginationList?.children()?.last();
        const lastPageText = lastSpan?.text()?.trim();
        const lastPage = Number(lastPageText);
        console.log("lastPage :>> ", lastPage);

        const currentSpan = paginationList?.find(".is-current")?.first();
        const currentPageText = currentSpan?.text()?.trim();
        const currentPage = Number(currentPageText);
        console.log("currentPage :>> ", currentPage);
        const albumData: IAlbumData = { id, name, images, currentPage, lastPage };
        if (!Buondua.cache[url]) {
            console.log(`Setting cache for ${url}`);
            Buondua.cache[url] = albumData;
        }
        return albumData;
    };
    private parseAlbumHtml = (html: string) => {
        const albums: IAlbum[] = [];
        const $ = load(html);
        const divs = $("div[data-id]");
        divs.each((i, div) => {
            const id = ($(div).data("id") as number) ?? undefined;
            const thumb = $(div).find("img").attr("src");
            const itemLink = $(div).find(".item-link");
            const name = itemLink.text().trim();
            const link = itemLink.attr("href");
            const tags = $(div)
                .find(".item-tags")
                ?.find("a")
                ?.get()
                ?.map((el) => $(el).text().trim());

            if (id && thumb && name && link && tags && tags.length) albums.push({ id, link, thumb, name, tags });
        });
        return albums;
    };
}
