import { exec as ex } from "child_process";
import { createWriteStream } from "fs";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { promisify } from "util";
import ytdl from "ytdl-core";

const exec = promisify(ex);

export const COOKIES = `VISITOR_INFO1_LIVE=FDaOUZQc3Rw; SID=LQi_8ClwPHY4OtuVypSjOEASdKF5h0QFZKaLE8Ao61VB9HVolgB5Azr9dCNCFJsAseLHDQ.; __Secure-1PSID=LQi_8ClwPHY4OtuVypSjOEASdKF5h0QFZKaLE8Ao61VB9HVo01VwzbKdn_WJAquFCldbLg.; __Secure-3PSID=LQi_8ClwPHY4OtuVypSjOEASdKF5h0QFZKaLE8Ao61VB9HVoAp_JD01fh3Ehf2q4f6qcvQ.; HSID=Adp-Pt11kUFIwWSxM; SSID=APGisTOHIzCivHlsC; APISID=PvG88TmYq6Pm32nT/ALlmnQzn9JlqkQFEY; SAPISID=CZzO_tIKuBJm7ijL/ACB6YU8mrD_Drof96; __Secure-1PAPISID=CZzO_tIKuBJm7ijL/ACB6YU8mrD_Drof96; __Secure-3PAPISID=CZzO_tIKuBJm7ijL/ACB6YU8mrD_Drof96; LOGIN_INFO=AFmmF2swRQIhAMAqShRDAeU4t4hxo7fMtNVJQRbXtXV5NE-j2zaaKxfeAiB-GkwJcOQNBBFcUvVeFcV8k4FgLOAWuVcQrVNNv1ZP7g:QUQ3MjNmekRleDJMZTh0TDRaQ18wZUs5QmdJNThGanNHRFdHQ29DN2JsRnFPSGE1ZnFxVnNHV1dkMVZoOHc4MmV4WHdRUDROeEp6dXo1aEpXR3JVWkpsYmhVOTZmdDZZdTdYQ3EwU2tLZkNCa2YzSmhOUUZjblNZRU9YZVNjMWswQ3UyME1ocEFjVVlLN3JoU2pnY1dtUjRBZDM2clM2Qy13; PREF=tz=Asia.Makassar&f6=400&f5=30000&hl=en&f7=1; YSC=DnWB6CHAtMQ; SIDCC=AJi4QfEFzuTEm0_KncoLKhIZvU6B9CJ-80EDkGmZ7TU4Pr33zwTcxv4NVRxKEE_HQ4upO2Ox3V0; __Secure-1PSIDCC=AJi4QfHkX5ITR0dOzmOXolbzRA26gw4SdFL3hyFo2cuEytJW0fxLPtTlIu-S79bmFmATg2tEYLE; __Secure-3PSIDCC=AJi4QfE3DvevofQ6EWosMsrcQb5FGp7JB6wYBbm5-oPC4cDua2qzMDT267aghLrcsarNVsYAfgo`;

export const ytdlDownload = async (
    url: string,
    type: "video" | "audio" = "video",
    quality: "high" | "medium" | "low"
): Promise<Buffer> => {
    if (type === "audio" || quality === "medium") {
        let filename = `${tmpdir()}/${Math.random().toString(36)}.${type === "audio" ? "mp3" : "mp4"}`;
        const stream = createWriteStream(filename);
        ytdl(url, {
            quality: type === "audio" ? "highestaudio" : "highest",
            requestOptions: { headers: { cookie: COOKIES } },
        }).pipe(stream);
        filename = await new Promise((resolve, reject) => {
            stream.on("finish", () => resolve(filename));
            stream.on("error", (error) => reject(error && console.log(error)));
        });
        const buffer = await readFile(filename);
        await unlink(filename);
        return buffer;
    }
    let audioFilename = `${tmpdir()}/${Math.random().toString(36)}.mp3`;
    let videoFilename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
    const filename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
    const audioStream = createWriteStream(audioFilename);
    ytdl(url, {
        quality: "highestaudio",
        requestOptions: { headers: { cookie: COOKIES } },
    }).pipe(audioStream);
    audioFilename = await new Promise((resolve, reject) => {
        audioStream.on("finish", () => resolve(audioFilename));
        audioStream.on("error", (error) => reject(error && console.log(error)));
    });
    const stream = createWriteStream(videoFilename);
    ytdl(url, {
        quality: quality === "high" ? "highestvideo" : "lowestvideo",
        requestOptions: { headers: { cookie: COOKIES } },
    }).pipe(stream);
    videoFilename = await new Promise((resolve, reject) => {
        stream.on("finish", () => resolve(videoFilename));
        stream.on("error", (error) => reject(error && console.log(error)));
    });
    await exec(`ffmpeg -i ${videoFilename} -i ${audioFilename} -c:v copy -c:a aac ${filename}`);
    const buffer = await readFile(filename);
    Promise.all([unlink(videoFilename), unlink(audioFilename), unlink(filename)]);
    return buffer;
};
