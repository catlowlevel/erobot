import fetch from "node-fetch-commonjs";
import { connect, getCandles } from "tradingview-ws";
import { load as Cheerio } from "cheerio";

interface Data {
	symbol: string; //"BNBUSDT";
	description: string; //"Binance Coin / TetherUS";
	type: string; //"crypto";
	exchange: string; //"BINANCE";
	currency_code: string; //"USDT";
	"currency-logoid": string; //"crypto/XTVCUSDT";
	"base-currency-logoid": string; //"crypto/XTVCBNB";
	provider_id: string; //"binance";
}
interface Idea {
	timestamp: number;
	data: {
		id: number; //13782710,
		name: string; //'can it break pivot level?🥶',
		short_name: string; //'NKNUSDT',
		image_url: string; //'PLKM977y',
		published_url: string; //'https://www.tradingview.com/chart/NKNUSDT/PLKM977y-can-it-break-pivot-level/',
		is_script: boolean; //false,
		is_public: boolean; //true,
		base_url: string; //"https://www.tradingview.com";
	};
	author: {
		username: string; //"Vibranium_Capital";
		is_broker: boolean; //false;
	};
}

const fetchJson = async (url: string) => fetch(url).then((res) => res.json());
const exchanges = ["BINANCE"];

export const searchSymbol = async (symbol: string, exchange?: string) => {
	let url =
		"https://symbol-search.tradingview.com/symbol_search/?text=" + symbol;
	if (exchange) {
		exchange = exchange.toUpperCase();

		if (exchanges.includes(exchange)) {
			url += `&exchange=${exchange}`;
		} else {
			throw new Error(`Exchange ${exchange} is unknown!`);
		}
	}
	console.log("url :>> ", url);
	const json = (await fetchJson(url)) as Data[];
	const crypto = json.filter((data) => {
		return (
			data.type === "crypto" &&
			!data.description.includes("calculated by TradingView")
		);
	});
	// console.log("crypto :>> ", crypto);
	return crypto;
};

export const getPrices = async (symbols: string[]) => {
	const connection = await connect();
	const candles = await getCandles({
		connection,
		symbols,
		timeframe: 5,
		amount: 288,
	});
	const data = candles.map((candle, i) => {
		candle = candle.reverse();
		return {
			price: candle[0].close,
			price10m: candle[2].close,
			priceHour: candle[11].close,
			price4Hour: candle[47].close,
			price24Hour: candle[287].close,
			symbol: symbols[i],
		};
	});
	return data;
};

export const getIdeas = async (symbol: string) => {
	const cardsData: Idea[] = [];
	const url = `https://www.tradingview.com/symbols/${symbol}/ideas`;
	console.log('url :>> ', url);
	const html = await fetch(url).then((res) => res.text());
	const $ = Cheerio(html);
	const cards = $(".tv-feed__item.tv-feed-layout__card-item");
	cards.each((_idx, card) => {
		// console.log("idx :>> ", idx);
		const data = $(card).data("card") as Idea;
		const timeStamp = $(card)
			.find(".tv-card-stats__time")
			.data("timestamp") as number;
		data.timestamp = timeStamp;

		// console.log("data.data.name :>> ", data.data.name);
		const imgId = data.data.image_url;
		const baseUrl = "https://s3.tradingview.com/";
		const imgUrl = baseUrl + imgId.toLowerCase()[0] + `/${imgId}.png`;
		data.data.image_url = imgUrl;
		cardsData.push(data);
	});
	return cardsData;
};
