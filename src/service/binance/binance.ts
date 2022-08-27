import { proto } from "@adiwajshing/baileys";
import { JSONFile, Low } from "@commonify/lowdb";
import binanceApiNode, { Binance } from "binance-api-node";
import { debounce } from "debounce";
import EventEmitter from "events";
import { writeFileSync } from "fs";
import pMap from "p-map";
import TypedEmitter from "typed-emitter";
import { ROOT_DIR } from "../..";
import { Client } from "../../core";
import { LowDB } from "../../core/LowDB";
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

type Data = { symbol: string; candles: Candle[]; isFinal: boolean };
type StreamCallback = (data: Data) => void;

interface AlertType {
    symbol: string;
    alertPrice: string;
    done: boolean;
    amGreater?: boolean | undefined;
    msg: proto.IWebMessageInfo;
    resolved: boolean;
}

type Events = {
    alert: (data: { symbol: string; currentPrice: number; alert: AlertType }) => void;
    streamedSymbol: (data: { symbol: string; currentPrice: number }) => void;
};

export class BinanceClient {
    private alertAdapter = new JSONFile<AlertType[]>(`${ROOT_DIR}/json/binance_alerts.json`);
    db: Low<AlertType[]>;
    private pndAdapter = new JSONFile<Record<string, { createdAt: number; lastPrice: number }>>(
        `${ROOT_DIR}/json/binance_pnd.json`
    );
    dbPnd: Low<Record<string, { createdAt: number; lastPrice: number }>>;
    bullishDb: LowDB<{ [symbol: string]: number }>;

    tickers = new Map<string, Candle[]>();
    rsis = new Map<string, number[]>();
    binanceClient: Binance;
    evt: TypedEmitter<Events>;
    private streamingCandles = false;
    symbols: string[];
    avgDb: LowDB<{ [symbol: string]: boolean }>;
    constructor(public client: Client, streamCandles: boolean = false) {
        this.bullishDb = new LowDB<{ [symbol: string]: number }>(`${ROOT_DIR}/json/binance_bullish.json`, {});
        this.avgDb = new LowDB<{ [symbol: string]: boolean }>(`${ROOT_DIR}/json/binance_avgpnd.json`, {});
        this.db = new Low(this.alertAdapter);
        this.db.write().then(() => {
            this.db.read().then(() => {
                this.db.data ||= [];
            });
        });

        this.dbPnd = new Low(this.pndAdapter);
        this.dbPnd.write().then(() => {
            this.dbPnd.read().then(() => {
                this.dbPnd.data ||= {};
            });
        });

        this.binanceClient = binanceApiNode({});
        this.evt = new EventEmitter() as TypedEmitter<Events>;
        if (streamCandles) {
            this.getFuturesSymbols().then((symbols) => {
                this.streamCandles(symbols, "5m", 8, (data) => {
                    const currentPrice = data.candles[data.candles.length - 1].close;
                    this.handleAlert(data.symbol, currentPrice);
                    this.handlePnD(data.symbol, currentPrice); //Pump And Dump
                    this.handleBnB(data); //Bullish And Bearish
                    this.handleAvgPnD(data);

                    this.evt.emit("streamedSymbol", {
                        symbol: data.symbol,
                        currentPrice,
                    });
                });
            });
        }
    }

    async onAlert(cb: (data: { symbol: string; currentPrice: number; alert: AlertType }) => void) {
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

    async handleAvgPnD(data: Data) {
        if (this.avgDb.data[data.symbol] === undefined) {
            this.avgDb.data[data.symbol] = true;
            await this.avgDb.write();
        }
        const current = data.candles[data.candles.length - 1];
        const candles = data.candles.filter((_c, i) => i !== data.candles.length - 1);
        let totalPercent = 0;
        for (const candle of candles) {
            const percent = getPercentageChange(candle.close, candle.open);
            totalPercent += percent;
        }
        const avg = totalPercent / candles.length;
        const currentPercent = getPercentageChange(current!.close, current!.open);

        if (data.isFinal) {
            this.avgDb.data[data.symbol] = true;
        }
        if (currentPercent > avg * 5 && current.close > current.open && this.avgDb.data[data.symbol]) {
            // console.log(data.symbol, avg.toFixed(2), currentPercent.toFixed(2));
            this.avgDb.data[data.symbol] = false;
            const text = `${data.symbol.padEnd(10)} => ${`${current.close}`.padEnd(7)} | LAST 7 % AVG : ${avg
                .toFixed(2)
                .padEnd(5)}% | CURRENT % : ${currentPercent.toFixed(2)}%`;

            console.log(text);
            await this.client.sendMessage("62895611963535-1631537374@g.us", {
                text: `Avg Pump! *${data.symbol}* => ${currentPercent.toFixed(2)}%\nCurrent Price : $${current.close}`,
            });
            await this.avgDb.write();
        }
    }

    private datas: Data[] = [];
    private deb = debounce(async () => {
        // console.log(this.datas.length);
        let messages = "";
        for (const data of this.datas) {
            const currentPrice = data.candles[data.candles.length - 1].close;
            const lastPrice = data.candles[0].close;
            const percentGap = getPercentageChange(currentPrice, lastPrice);
            const text = `${data.symbol} => ${percentGap.toFixed(2)}%\n${lastPrice} => ${currentPrice}`;
            console.log(`${data.symbol} => ${percentGap.toFixed(2)}%`);
            this.bullishDb.data[data.symbol] = 5;
            messages += `${text}\n======================\n`;
        }
        console.log("debounced");
        if (this.datas.length <= 0) return;
        await this.client.sendMessage("62895611963535-1631537374@g.us", { text: messages });
        await this.bullishDb.write();
        this.datas = [];
    }, 500);

    private debo = (data: Data) => {
        this.datas.push(data);
        this.deb();
    };

    async handleBnB(data: Data) {
        if (data.isFinal) {
            const db = this.bullishDb.data;
            if (!db[data.symbol]) db[data.symbol] = 0;

            let bullish = true;
            let count = 0; // error count
            for (const candle of data.candles) {
                if (candle.open > candle.close) {
                    if (count-- <= 0) {
                        bullish = false;
                        break;
                    }
                }
            }

            if (db[data.symbol]-- <= 0) db[data.symbol] = 0;
            if (bullish && db[data.symbol] <= 0) {
                this.debo(data);
            }
            await this.bullishDb.write();
        }
    }

    async handlePnD(symbol: string, currentPrice: number) {
        const current = this.pnd[symbol];
        if (!current && !symbol.endsWith("BUSD")) {
            console.log("New symbol", symbol);
            this.pnd[symbol] = { createdAt: Date.now(), lastPrice: currentPrice };
            await this.dbPnd.write();
            return;
        } else if (current) {
            const isExpired = Date.now() - current.createdAt > 1000 * 60 * 10; //n minutes
            const percentGap = getPercentageChange(current.lastPrice, currentPrice);
            if (isExpired) {
                this.pnd[symbol] = {
                    createdAt: Date.now(),
                    lastPrice: currentPrice,
                };
                await this.dbPnd.write();
            } else if (percentGap > 5) {
                const pompom = currentPrice > current.lastPrice;
                const time = Date.now() - current.createdAt;
                let ago = Math.floor(time / 1000 / 60);
                let seconds: number | undefined;
                let useSecond = false;
                if (ago === 0) {
                    useSecond = true;
                    seconds = Math.floor(time / 1000);
                    ago = seconds;
                }
                this.client.sendMessage("120363023114788849@g.us", {
                    text: `${pompom ? "📈📈📈 Pump" : "📉📉📉 Dump"} alert for *${symbol}*\n${
                        pompom ? "" : "-"
                    }${percentGap.toFixed(2)}%\nLast Price (${ago} ${useSecond ? "seconds" : "minutes"} ago): $${
                        current.lastPrice
                    }\nCurrent Price : $${currentPrice}`.trim(),
                });

                delete this.pnd[symbol];
                await this.dbPnd.write();
                console.log("pnd saved");
            }
        }
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
            const crossOrClose = alert.amGreater === false ? currentPrice <= alertPrice : currentPrice > alertPrice;

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

    async streamCandles(pairs: string[], interval: Interval, limit: number, streamCB: StreamCallback) {
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

            if (candle.isFinal) {
                if (candles.length >= limit) {
                    candles.shift();
                }
            }

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
        return this.symbols.filter(
            (s) => !["ICPUSDT", "BTSUSDT", "BTCSTUSDT", "SCUSDT", "TLMUSDT"].includes(s) && s.endsWith("USDT")
        );
    }

    public get pnd() {
        return this.dbPnd.data!;
    }
}
