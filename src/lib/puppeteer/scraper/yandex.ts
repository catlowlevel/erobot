import puppeteer from "puppeteer";
import { Utils } from "../../../helper/utils";

const utils = new Utils();

//TODO: fix this parameter
export const searchImages = (yandexThumbnailResult: Awaited<ReturnType<typeof utils.yandexThumbnail>>) =>
    new Promise<
        {
            image: string;
            thumb: string;
            link: string;
            title: string;
        }[]
    >((res, rej) => {
        puppeteer
            .launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            })
            .then(async (browser) => {
                console.log("Opening new page");
                const page = await browser.newPage();
                page.setViewport({ width: 1280, height: 780 });
                let url = yandexThumbnailResult.url;
                console.log("navigating....");

                const timeout = setTimeout(async () => {
                    console.log("timeout");
                    await browser.close();
                    rej("timeout after 30 seconds");
                }, 1000 * 30);

                url = `https://yandex.com/images/search?rpt=imageview&url=${url}`;
                console.log(url);
                await page.goto(url, {
                    waitUntil: "networkidle2",
                });
                const resultUl = await page.waitForSelector("div[id^=CbirSites_infinite] > section > ul");
                if (!resultUl) throw new Error("Err");
                const lists = await resultUl.$$("li");
                const results = lists.map(async (li) => {
                    const linkAndTitle = await li.$eval("div[class$=ItemTitle] > a", (a) => {
                        let href = a.getAttribute("href");
                        href = decodeURIComponent(href ?? "");
                        return {
                            link: href,
                            title: a.textContent ?? "",
                        };
                    });

                    const images = await li.$eval("div[class$=ItemThumb] > a", (a) => {
                        let href = a.getAttribute("href");
                        href = decodeURIComponent(href ?? "");
                        //TODO: Convert img source to buffer/base64
                        const imgSrc = a.querySelector("img")?.getAttribute("src");
                        let thumb = decodeURIComponent(imgSrc ?? "");
                        if (!!thumb && !thumb.startsWith("http")) thumb = `https:${thumb}`;
                        return { image: href, thumb };
                    });

                    return { ...linkAndTitle, ...images };
                });

                const data = await Promise.all(results);
                await browser.close();
                clearTimeout(timeout);
                res(data);
            });
    });
