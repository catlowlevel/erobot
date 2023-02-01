import { load } from "cheerio";

interface Post {
    title: string;
    version: string;
    link: string;
}

export class Apkmody {
    BASE = "https://apkmody.io/";
    // constructor() {}

    async getDownloadLink(postLink: Post["link"]) {
        const url = `${postLink}/download/0`;
        const html = await fetch(url).then((res) => res.text());
        const $ = load(html);
        const link = $("#download-button");
        const dl = $(link).attr("href") ?? "";
        return dl;
    }

    async search(query: string) {
        const url = `${this.BASE}?s=${query}`;
        const html = await fetch(url).then((res) => res.text());
        const $ = load(html);
        const cards = $("div.flex-item:nth-child(1) > article:nth-child(1) > div");
        const posts: Post[] = [];
        cards.each((i, el) => {
            const body = $(el).find(".card-body");
            const title = $(body).find("h2").text().trim() ?? "";
            const version = $(body).find("p").text().trim() ?? "";
            const link = $(el).find("a").attr("href") ?? "";
            posts.push({ title, version, link });
        });
        return posts;
    }

    async editorChoices() {
        const html = await fetch(this.BASE).then((res) => res.text());
        const $ = load(html);
        const articles = $("#primary > section:nth-child(2) > div:nth-child(1) > div:nth-child(3) > article");
        const posts: Post[] = [];
        articles.each((i, el) => {
            const h3 = $(el).find("h3");
            const title = $(h3).text() ?? "";
            const version = $(h3).next().text().trim() ?? "";
            const link = $(el).find("a").attr("href") ?? "";
            posts.push({ title, version, link });
        });
        return posts;
    }
    async recentlyUpdated() {
        const html = await fetch(this.BASE).then((res) => res.text());
        const $ = load(html);
        const articles = $(".margin-bottom-15 > article");
        const posts: Post[] = [];
        articles.each((i, el) => {
            const h3 = $(el).find("h3");
            const title = $(h3).text() ?? "";
            const version = $(h3).next().text().trim() ?? "";
            const link = $(el).find("a").attr("href") ?? "";
            posts.push({ title, version, link });
        });
        return posts;
    }
}
