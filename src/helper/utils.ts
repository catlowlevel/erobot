/* eslint-disable @typescript-eslint/ban-ts-comment */
import chalk from "chalk";
import lodash from "lodash";
const { shuffle } = lodash;
//https://github.com/jonatanpedersen/quoted/blob/e72a980b600d07477ecc9e7028c8a5a62886faf6/index.js#L48
// function quotedRegExp(str: string) {
//     const expression = /(["'])(?:(?=(\\?))\2.)*?\1/gm;
//     const texts = [];
//     const emptyString = "";
//     let match;
//     while ((match = expression.exec(str))) {
//         const text = match[0].slice(1, -1);
//         if (text !== emptyString) {
//             texts.push(text);
//         }
//     }

//     return texts;
// }

export class Utils {
    public randomArray = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    public randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
    public shuffleArray = shuffle;

    public requireUncached = (module: string) => {
        delete require.cache[require.resolve(module)];
        return require(module);
    };

    public getBuffer = async (url: string, opts?: RequestInit) =>
        fetch(url, opts)
            .then((r) => r.arrayBuffer())
            .then((ab) => Buffer.from(ab));

    public yandexThumbnail = async (image: Buffer) => {
        type Result = {
            image_id: string;
            url: string;
            image_shard: number;
            height: number;
            width: number;
            namespace: string;
        };
        const result = await fetch(
            "https://yandex.com/images-apphost/image-download?cbird=111&images_avatars_size=preview&images_avatars_namespace=images-cbir",
            {
                headers: {
                    accept: "*/*",
                    "accept-language": "en,en-US;q=0.9,en-VI;q=0.8,id;q=0.7",
                    "content-type": "image/jpeg",
                    "sec-ch-ua": '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Linux"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    // cookie:
                    // 	"yandexuid=2100182771669010651; is_gdpr=0; is_gdpr_b=CMyzPRDRlgE=; _yasc=TEUwizWAlKDt3MIQz0UPcChIBSetsFDYG9eHMZrZvr/USS/w0xlQ3AMsdoobmg==; i=6WKkGvhJ4jgJVp0yqN08seSWL+K1w4PVEwHZmzdGN1SC8vWMOafZlLQGQYBPND6oQNSp19yqABneOSCKxybx0TX3sQw=; yp=1669615458.szm.1:1920x1080:1920x957",
                    Referer: "https://yandex.com/images",
                    "Referrer-Policy": "no-referrer-when-downgrade",
                },
                body: image,
                method: "POST",
            }
        ).then(async (r) => (await r.json()) as Result);
        return result;
    };

    public generateRandomUniqueTag = (n = 4): string => {
        let max = 11;
        if (n > max) return `${this.generateRandomUniqueTag(max)}${this.generateRandomUniqueTag(n - max)}`;
        max = Math.pow(10, n + 1);
        const min = max / 10;
        return (Math.floor(Math.random() * (max - min + 1)) + min).toString().substring(1);
    };

    public extractNumbers = (content: string): number[] => {
        const search = content.match(/(-\d+|\d+)/g);
        if (search !== null) return search.map((string) => parseInt(string));
        return [];
    };

    public timeSince = (
        date: Date,
        depth = 1,
        localization?: {
            year?: string;
            month?: string;
            day?: string;
            hour?: string;
            minute?: string;
            second?: string;
        }
    ) => {
        return this.timeSinceRecursive(date, depth, localization);
    };

    public formatNumber = (num: number, fixed = 2) => {
        return num.toFixed(fixed).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    };

    public getPercentageChange = (initial: number, final: number) => {
        if (initial < final) return ((final - initial) / initial) * 100;
        return ((initial - final) / initial) * 100;
    };

    public percentageCalculator = (percent: number, num: number, operation: "+" | "-" | "*" | "/") => {
        switch (operation) {
            case "+":
                return num + num * (percent / 100);
            case "-":
                return num - num * (percent / 100);
            case "*":
                return num * (percent / 100);
            case "/":
                return num / (percent / 100);
            default:
                return num;
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public debounce = <T extends (...args: any) => any>(func: T, wait: number, immediate: boolean) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let timeout: any;
        return (...args: Parameters<T>) => {
            const later = () => {
                timeout = null;
                if (!immediate) func(args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(args);
        };
    };

    //https://stackoverflow.com/a/23593099/13069078
    public formatDate = (date: string | Date) => {
        const d = new Date(date),
            month = "" + (d.getMonth() + 1),
            year = d.getFullYear();
        let day = "" + d.getDate();

        // if (month.length < 2) month =  month;
        if (day.length < 2) day = "0" + day;

        return [year, month, day].join("-");
    };

    public getDay = (plusDay = 0) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + plusDay);
        return date;
    };

    public extractNumber = (str: string) => {
        const regex = /([\d,]+)[\d,]*/g;
        const match = regex.exec(str);
        if (match) {
            return match[1].replace(/,/g, "");
        }
        return;
    };

    public getRandomColor = () => {
        return this.colors[(this.colors.length * Math.random()) | 0];
    };

    public countDecimalPlaces = (num: number) => {
        const str = "" + num;
        const index = str.indexOf(".");
        if (index >= 0) {
            return str.length - index - 1;
        } else {
            return 0;
        }
    };

    //groupBy with typed typescript
    public groupBy = <T, K extends keyof T>(array: T[], key: K): { [key: string]: T[] } => {
        return array.reduce((acc: { [key: string]: T[] }, curr) => {
            const keyValue = curr[key];
            //@ts-ignore
            if (!acc[keyValue]) {
                //@ts-ignore
                acc[keyValue] = [];
            }
            //@ts-ignore
            acc[keyValue].push(curr);
            return acc;
        }, {});
    };

    //https://stackoverflow.com/a/51712612
    /**
     *
     * @param input ex : "bluebird"
     * @param pattern ex : "*bird"
     * @returns true or false, true based on example
     */
    public wildcardCheck = function (input: string, pattern: string) {
        const regExpEscape = function (s: string) {
            return s.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        };
        const re = new RegExp("^" + pattern.toLowerCase().split(/\*+/).map(regExpEscape).join(".*") + "$");
        const match = input.toLowerCase().match(re);
        if (match && match.length >= 1) return true;
        return false;
        //return input.match(re) !== null && input.match(re).length >= 1;
    };

    /** Get all strings that are inside a quote */
    public quoted = (str: string) => {
        const backslash = "\\";
        const doubleQuote = '"';
        const singleQuote = "'";
        const emptyString = "";
        const texts = [];
        let quote;
        let escaping;
        let recording;
        let text;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            escaping = char === backslash && !escaping;

            if (!escaping) {
                if (!recording) {
                    if (char === singleQuote || char === doubleQuote) {
                        quote = char;
                        recording = true;
                        text = emptyString;
                    }
                } else {
                    if (char === quote) {
                        quote = emptyString;
                        recording = false;

                        if (text !== emptyString) {
                            texts.push(text);
                        }
                    } else {
                        text += char;
                    }
                }
            } else {
                text += char;
            }
        }

        return texts;
    };
    private timeSinceRecursive = (
        date: Date,
        depth = 1,
        localization?: {
            year?: string;
            month?: string;
            day?: string;
            hour?: string;
            minute?: string;
            second?: string;
        }
    ) => {
        let seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        seconds = Math.abs(seconds);
        let intervalType = "";
        let remainder = 0;
        let extra = "";

        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            remainder = seconds % 31536000;
            intervalType = localization ? localization.year ?? "year" : "year";
        } else {
            interval = Math.floor(seconds / 2592000);
            if (interval >= 1) {
                remainder = seconds % 2592000;
                intervalType = localization ? localization.month ?? "month" : "month";
            } else {
                interval = Math.floor(seconds / 86400);
                if (interval >= 1) {
                    remainder = seconds % 86400;
                    intervalType = localization ? localization.day ?? "day" : "day";
                } else {
                    interval = Math.floor(seconds / 3600);
                    if (interval >= 1) {
                        remainder = seconds % 3600;
                        intervalType = localization ? localization.hour ?? "hour" : "hour";
                    } else {
                        interval = Math.floor(seconds / 60);
                        if (interval >= 1) {
                            remainder = seconds % 60;
                            intervalType = localization ? localization.minute ?? "minute" : "minute";
                        } else {
                            interval = seconds;
                            intervalType = localization ? localization.second ?? "second" : "second";
                        }
                    }
                }
            }
        }

        if ((interval > 1 || interval === 0) && !localization) {
            intervalType += "s";
        }
        if (remainder > 0 && depth > 1) {
            extra = this.timeSinceRecursive(new Date(Date.now() - 1000 * remainder), depth - 1, localization);
        }
        return interval + " " + intervalType + " " + extra;
    };
    private colors: (keyof typeof chalk)[] = ["blue", "red", "green", "cyan", "magenta", "yellow"];
}
