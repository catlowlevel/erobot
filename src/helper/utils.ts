import chalk from "chalk";

export const generateRandomUniqueTag = (n: number = 4): string => {
    let max = 11;
    if (n > max) return `${generateRandomUniqueTag(max)}${generateRandomUniqueTag(n - max)}`;
    max = Math.pow(10, n + 1);
    const min = max / 10;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString().substring(1);
};

export const extractNumbers = (content: string): number[] => {
    const search = content.match(/(-\d+|\d+)/g);
    if (search !== null) return search.map((string) => parseInt(string));
    return [];
};
export const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) {
        return `${interval} years`;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return `${interval} months`;
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return `${interval} days`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return `${interval} hours`;
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return `${interval} minutes`;
    }
    return `${Math.floor(seconds)} seconds`;
};

export const formatNumber = (num: number, fixed = 2) => {
    return num.toFixed(fixed).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

export const getPercentageChange = (initial: number, final: number) => {
    if (initial < final) return ((final - initial) / initial) * 100;
    return ((initial - final) / initial) * 100;
};

export const percentageCalculator = (percent: number, num: number, operation: "+" | "-" | "*" | "/") => {
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

export const debounce = <T extends (...args: any) => any>(func: T, wait: number, immediate: boolean) => {
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
export function formatDate(date: string | Date) {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

    // if (month.length < 2) month =  month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
}

export function objectToUrlQuery<T extends { [key: string]: any }>(obj: T): string {
    return Object.keys(obj)
        .map((key) => {
            return encodeURIComponent(key) + "=" + obj[key];
        })
        .join("&");
}

export const getDay = (plusDay: number = 0) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + plusDay);
    return date;
};
export const extractNumber = (str: string) => {
    const regex = /([\d,]+)[\d,]*/g;
    const match = regex.exec(str);
    if (match) {
        return match[1].replace(/,/g, "");
    }
    return;
};

const colors: (keyof typeof chalk)[] = ["blue", "red", "green", "cyan", "magenta", "yellow"];

export const getRandomColor = () => {
    return colors[(colors.length * Math.random()) | 0];
};

export function countDecimalPlaces(num: number) {
    let str = "" + num;
    let index = str.indexOf(".");
    if (index >= 0) {
        return str.length - index - 1;
    } else {
        return 0;
    }
}
