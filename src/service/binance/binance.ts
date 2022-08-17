import EventEmitter from "events";
import binanceApiNode, { Binance } from "binance-api-node";
import { writeFileSync } from "fs";
import pMap from "p-map";
import TypedEmitter from "typed-emitter";
import { proto, WASocket } from "@adiwajshing/baileys";
import { Client } from "../../core";
import { JSONFile, Low } from "@commonify/lowdb";
import { ROOT_DIR } from "../..";
import { getPercentageChange } from "../../helper/utils";
// prettier-ignore
type Interval = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

interface Candle {
	open: number;
	high: number;
	low: number;
	close: number;
	closeTime: number;
	openTime: number;
}

type StreamCallback = (data: {
	symbol: string;
	candles: Candle[];
	isFinal: boolean;
}) => void;

interface AlertType {
	symbol: string;
	alertPrice: string;
	done: boolean;
	amGreater?: boolean | undefined;
	msg: proto.IWebMessageInfo;
	resolved: boolean;
}

type Events = {
	alert: (data: {
		symbol: string;
		currentPrice: number;
		alert: AlertType;
	}) => void;
	streamedSymbol: (data: { symbol: string; currentPrice: number }) => void;
};

export class BinanceClient {
	private alertAdapter = new JSONFile<AlertType[]>(
		`${ROOT_DIR}/json/binance_alerts.json`
	);
	tickers = new Map<string, Candle[]>();
	rsis = new Map<string, number[]>();
	binanceClient: Binance;
	evt: TypedEmitter<Events>;
	private streamingCandles = false;
	db: Low<AlertType[]>;
	symbols: string[];
	constructor(public client: Client, streamCandles: boolean = false) {
		this.db = new Low(this.alertAdapter);
		this.db.write().then(() => {
			this.db.read().then(() => {
				this.db.data ||= [];
			});
		});

		this.binanceClient = binanceApiNode({});
		this.evt = new EventEmitter() as TypedEmitter<Events>;
		if (streamCandles) {
			this.getFuturesSymbols().then((symbols) => {
				this.streamCandles(symbols, "5m", 7, (data) => {
					const currentPrice = data.candles[data.candles.length - 1].close;
					this.handleAlert(data.symbol, currentPrice);

					this.evt.emit("streamedSymbol", {
						symbol: data.symbol,
						currentPrice,
					});
				});
			});
		}
	}

	async onAlert(
		cb: (data: {
			symbol: string;
			currentPrice: number;
			alert: AlertType;
		}) => void
	) {
		this.evt.on("alert", (data) => {
			cb(data);
		});
	}

	async addAlert(symbol: string, price: number, msg: proto.IWebMessageInfo) {
		try {
			const data = await this.getSymbolData(symbol);
			console.log("addAlert data", data);
			const alert: AlertType = {
				alertPrice: price.toString(),
				symbol,
				done: false,
				msg,
				resolved: false,
				amGreater: price > data.currentPrice,
			};
			this.db.data?.push(alert);
			this.db.write();
			const gap = getPercentageChange(price, data.currentPrice);
			return this.client.sendMessage(
				msg.key.remoteJid!,
				{
					text: `Alert added for ${symbol} at ${price}\nCurrent price: ${
						data.currentPrice
					}\nGap : ${gap.toFixed(2)}%`,
				},
				{ quoted: msg }
			);
		} catch (error) {
			console.log(error);
			throw error;
		}
	}

	async getSymbolData(symbol: string) {
		if (!this.streamingCandles) {
			throw new Error("Not streaming candles");
		}
		return new Promise<{ symbol: string; currentPrice: number }>((res, rej) => {
			this.evt.on("streamedSymbol", ({ symbol: pair, currentPrice }) => {
				if (pair === symbol) {
					res({
						symbol: pair,
						currentPrice,
					});
				}
			});
			setTimeout(() => {
				rej("Timeout");
			}, 1000 * 5);
		});
	}

	async handleAlert(symbol: string, currentPrice: number) {
		this.db.data?.forEach((alert, idx) => {
			if (alert.symbol !== symbol) return;
			if (alert.done) return;

			const alertPrice = Number.parseFloat(alert.alertPrice);
			if (alert.amGreater === undefined) {
				alert.amGreater = alertPrice > currentPrice;
				this.db.write().then(() => console.log("Saved alert on amGreater"));
			}

			const percentChange = getPercentageChange(currentPrice, alertPrice);
			const crossOrClose =
				alert.amGreater === false
					? currentPrice <= alertPrice
					: currentPrice > alertPrice;

			// console.log(
			// 	"handleAlert",
			// 	"symbol",
			// 	symbol,
			// 	"currentPrice",
			// 	currentPrice,
			// 	"alertPrice",
			// 	alertPrice,
			// 	"percentChange",
			// 	percentChange,
			// 	"crossOrClose",
			// 	crossOrClose,
			// 	"alert.amGreater",
			// 	alert.amGreater
			// );

			if (percentChange <= 0.01 || crossOrClose) {
				// this.evt.emit("alert", { symbol, currentPrice, alert });
				alert.done = true;
				this.client
					.sendMessage(
						alert.msg.key.remoteJid!,
						{
							// text: `Alert for ${symbol} at ${alertPrice} triggered at ${currentPrice}`,
							text: `⏰ Alert triggered! ⏰\nFor ${symbol} at ${alertPrice}\nCurrent Price : ${currentPrice}`,
						},
						{ quoted: alert.msg }
					)
					.then(() => {
						const idx = this.db.data?.indexOf(alert) ?? -1;
						if (idx > -1) {
							this.db.data?.splice(idx, 1);
							this.db.write().then(() => console.log("Saved alert"));
						}
					})
					.catch(() => {
						alert.done = false;
					});
			}
		});
	}

	async streamCandles(
		pairs: string[],
		interval: Interval,
		limit: number,
		streamCB: StreamCallback
	) {
		console.log(`Getting all candles for ${pairs.length} pairs`);
		const errorCandles: string[] = [];
		const successCandles: string[] = [];
		const lastTime = new Date().getTime();
		const proms = pairs.map(async (symbol) => {
			try {
				const ticker = await this.binanceClient.futuresCandles({
					interval,
					symbol,
					limit,
				});
				const candles: Candle[] = ticker.map((c) => ({
					open: Number(c.open),
					high: Number(c.high),
					low: Number(c.low),
					close: Number(c.close),
					openTime: c.openTime,
					closeTime: c.closeTime,
				}));
				candles.pop();
				this.tickers.set(symbol, candles);
				successCandles.push(symbol);
			} catch (error) {
				errorCandles.push(symbol);
			}
		});
		await pMap(proms, (p) => p, { concurrency: 2 });
		const nowTime = new Date().getTime();
		console.log(`Time to get candles : ${(nowTime - lastTime) / 1000}s`);
		console.log(`Got all past candles except for`, errorCandles);
		console.log(`Total pairs: ${successCandles.length}`);
		this.streamingCandles = true;
		this.binanceClient.ws.futuresCandles(pairs, interval, (candle) => {
			const symbol = candle.symbol;
			const candles = this.tickers.get(symbol);
			if (!candles) {
				console.log("no candles", symbol);
				return;
			}
			// const pastCandle = candles.map((c) => c.close);
			// const newValues = [...pastCandle, Number(candle.close)];
			// const rsi = RSI.calculate({
			// 	period: 14,
			// 	values: newValues,
			// });
			// const ema99 = EMA.calculate({
			// 	period: 99,
			// 	values: newValues,
			// });
			// const currentRSI = rsi[rsi.length - 1];
			// const previousRSI = rsi[rsi.length - 2];
			if (candle.isFinal) {
				candles.push({
					open: Number(candle.open),
					high: Number(candle.high),
					low: Number(candle.low),
					close: Number(candle.close),
					openTime: candle.startTime + 1000,
					closeTime: candle.closeTime + 1000,
				});
				if (candles.length >= limit) {
					candles.shift();
				}
			}

			streamCB({
				symbol,
				candles: !candle.isFinal
					? [
							...candles,
							{
								open: Number(candle.open),
								high: Number(candle.high),
								low: Number(candle.low),
								close: Number(candle.close),
								openTime: candle.startTime + 1000,
								closeTime: candle.eventTime + 1000,
							},
					  ]
					: candles,
				isFinal: candle.isFinal,
			});

			// const current = this.rsis.get(symbol);
			// if (currentRSI > 70 && previousRSI < 70 && !current) {
			// 	this.rsis.set(symbol, rsi);
			// 	console.log("RSI", symbol, rsi[rsi.length - 1]);
			// } else if (currentRSI < 30 && previousRSI > 30 && !current) {
			// 	this.rsis.set(symbol, rsi);
			// 	console.log("RSI", symbol, rsi[rsi.length - 1]);
			// }
		});
	}

	async getFuturesTickers() {
		const ts: string[] = [];
		this.binanceClient.ws.futuresAllTickers((tickers) => {
			for (const ticker of tickers) {
				if (ts.includes(ticker.symbol)) {
					console.log("duplicate", ticker.symbol);
					continue;
				}
				ts.push(ticker.symbol);
				console.log("ticker", ticker.symbol, ts.length);
			}
			writeFileSync("tickers.json", JSON.stringify(ts));
		});
	}

	async getFuturesSymbols() {
		const exchangeInfo = await this.binanceClient.futuresExchangeInfo();
		if (!this.symbols) this.symbols = exchangeInfo.symbols.map((s) => s.symbol);
		return this.symbols;
	}
}
