import puppeteer from "puppeteer";

export const ss = async (url: string, width: number, height: number) => {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    page.setViewport({ height, width });
    await page.goto(url, { waitUntil: "load" });
    const buffer = (await page.screenshot({ type: "png" })) as Buffer;
    await browser.close();
    return buffer;
};
