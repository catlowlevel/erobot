import { load } from "cheerio";
import fetch from "node-fetch-commonjs";

const url = "https://sslecal2.forexprostools.com/";

interface Result {
    economy: string;
    impact: number;
    date: string;
    name: string;
    actual: string;
    forecast: string;
    previous: string;
}

export const getCalendar = async () => {
    const results: Result[] = [];
    const html = await fetch(url).then((res) => res.text());
    const $ = load(html);
    const rows = $("tr[id*='eventRowId']");
    rows.each((_idx, row) => {
        const economy = $(row).find("td.flagCur").text()?.trim() ?? "";
        const impact = $(row).find("td.sentiment").first().find("i.grayFullBullishIcon").length;
        const date3 = $(row).attr("event_timestamp") ?? "";
        const date2 = new Date(date3);
        const date = new Date(date2.setHours(date2.getHours() + 8)).toLocaleString();
        const name = $(row).find("td.event").text()?.trim() ?? "";
        const actual = $(row).find("td.act").text()?.trim() ?? "";
        const forecast = $(row).find("td.fore").text()?.trim() ?? "";
        const previous = $(row).find("td.prev").text()?.trim() ?? "";
        results.push({
            economy,
            impact,
            date,
            name,
            actual,
            forecast,
            previous,
        });
    });
    return results;
};
