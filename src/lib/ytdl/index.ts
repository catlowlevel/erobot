import { load } from "cheerio";
import fetch from "node-fetch-commonjs";
import { Stream } from "stream";
import YTDlpWrap from "yt-dlp-wrap";

const ytdl = new YTDlpWrap();
async function stream2buffer(stream: Stream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const _buf = Array<any>();

        stream.on("data", (chunk) => _buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", (err) => reject(`error converting stream - ${err}`));
    });
}
export const downloadVideo = async (link: string) => {
    console.log("Downloading video");
    const stream = ytdl.execStream([link, "-f", "bestvideo+bestaudio", "--cookies", `~/fb-cookies.txt`]); //TODO : make this more generic
    stream.on("end", () => console.log("Done"));
    return stream2buffer(stream);
};

//Before : https://web.facebook.com/story.php?story_fbid=pfbid0JyChERXDuq5u4SC9od6eiyDRjyUppRtQg7KZcg4DYJtur89mn9W6P5YSRd4P876El&id=100075459038925&sfnsn=wiwspwawes
//After  : https://www.facebook.com/100075459038925/videos/1114156399506856/
//This link give better quality ^
const convertUrlVideos = async (link: string) => {
    console.log("Convert url => " + link);
    const html = await fetch(link, {
        headers: {
            "sec-fetch-site": "none",
            cookie: "sb=IkN6YpD--3wEqllQOFNPvJkf; datr=IkN6YgtI6CxocH8heTXNu9hq; c_user=100007145043176; m_pixel_ratio=1; x-referer=eyJyIjoiL3N0b3J5LnBocD9zdG9yeV9mYmlkPXBmYmlkMEp5Q2hFUlhEdXE1dTRTQzlvZDZlaXlEUmp5VXBwUnRRZzdLWmNnNERZSnR1cjg5bW45VzZQNVlTUmQ0UDg3NkVsJmlkPTEwMDA3NTQ1OTAzODkyNSZzZm5zbj13aXdzcHdhd2VzIiwiaCI6Ii9zdG9yeS5waHA%2Fc3RvcnlfZmJpZD1wZmJpZDBKeUNoRVJYRHVxNXU0U0M5b2Q2ZWl5RFJqeVVwcFJ0UWc3S1pjZzREWUp0dXI4OW1uOVc2UDVZU1JkNFA4NzZFbCZpZD0xMDAwNzU0NTkwMzg5MjUmc2Zuc249d2l3c3B3YXdlcyIsInMiOiJtIn0%3D; wd=1056x957; xs=22%3AQb_yv3o2Rx1vtg%3A2%3A1652179784%3A-1%3A11213%3A%3AAcWq55gfks5ybD5nbboR0p1OPAnuVxhUoW5FYXn7Kq0; fr=0trfRc3yJrghLsx4D.AWWOWYn5OGVSWPIFfEF4xLNZ3Lg.BjFzZG.HK.AAA.0.0.BjFzZG.AWXEB3-hlio; presence=C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1662467882505%2C%22v%22%3A1%7D",
        },
        method: "GET",
    }).then((res) => res.text());
    const $ = load(html);
    const meta = $(`meta`);
    let href = "";
    meta.each((i, el) => {
        const content = $(el).attr("content");
        const name = $(el).attr("name");
        console.log("name,content :>> ", name, content);
        console.log(JSON.stringify($(el).attr(), null, 2));
        if (name === "twitter:player") {
            href = content!;
        }
    });
    const idx = href.indexOf("href=");
    href = href.substring(idx + 5, href.length - 1);
    console.log("href :>> ", href);
    return `https://facebook.com${href}`;
};

export const downloadFacebook = async (link: string) => {
    //if (link.includes("m.facebook.com")) link = link.replace("m.facebook.com", "web.facebook.com");
    //if (!link.includes("videos")) link = await convertUrlVideos(link);
    console.log("link :>> ", link);
    return downloadVideo(link);
};
