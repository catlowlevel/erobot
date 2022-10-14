import puppeteer from "puppeteer";
import Queue from "queue";

const q = Queue({ concurrency: 1, autostart: true });

export const ss = async (url: string, width: number, height: number) => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    page.setViewport({ height, width });
    await page.goto(url, { waitUntil: "load" });
    const buffer = (await page.screenshot({ type: "png" })) as Buffer;
    await browser.close();
    return buffer;
};

export const ssQueue = async (url: string, width: number, height: number, queueing?: (queueNumber: number) => void) =>
    new Promise<Buffer>((res, rej) => {
        queueing?.(q.length);
        q.push((cb) => {
            ss(url, width, height)
                .then((img) => {
                    res(img);
                    cb?.();
                })
                .catch((err) => {
                    rej(err);
                    cb?.();
                });
        });
    });
