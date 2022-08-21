import fetch from "node-fetch-commonjs";
import { connect, getCandles } from "tradingview-ws";

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
