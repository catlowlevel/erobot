import { JSONFile, Low } from "@commonify/lowdb";
import fetch from "node-fetch-commonjs";
import { ROOT_DIR } from "../..";
import { Client } from "../../core";

export interface Event {
	caption: string;
	source: string;
	proof: string;
	date_public: string;
	date_start: string;
	date_end: string;
	coin_id: string;
	coin_price_changes: string;
	tags: string;
}
export interface Coin {
	id: string;
	name: string;
	symbol: string;
	image_32: string;
	image_64: string;
}

interface DB {
	lastFetch: number;
	coins: Coin[];
}

export class Coindar {
	ACCESS_TOKEN = process.env.COINDAR_ACCESSTOKEN; //waapi
	API = process.env.COINDAR_BASE_URL_API;
	COINS_ENDPOINT = `${this.API}coins?access_token=${this.ACCESS_TOKEN}`;
	TAGS_ENDPOINT = `${this.API}tags?access_token=${this.ACCESS_TOKEN}`;
	EVENTS_ENDPOINT = `${this.API}events?access_token=${this.ACCESS_TOKEN}`;

	private coinsAdapter = new JSONFile<DB>(
		`${ROOT_DIR}/json/coindar_coins.json`
	);
	private db: Low<DB>;

	public get coins(): Coin[] {
		return this.db.data?.coins!;
	}

	constructor(private client: Client) {
		this.db = new Low(this.coinsAdapter);
		this.db
			.write()
			.then(async () => {
				await this.db.read();
				this.db.data ||= { coins: [], lastFetch: Date.now() };
				await this.validateCoins();
			})
			.catch(console.error);
	}

	async fetchEvents(opt: {
		coinIds?: string[];
		startDate: string;
		endDate?: string;
	}) {
		const urlParams = new URLSearchParams({
			filter_date_start: opt.startDate,
		});
		if (opt.coinIds && opt.coinIds.length) {
			urlParams.append("filter_coins", opt.coinIds.join());
		} else if (opt.endDate) {
			urlParams.append("filter_date_end", opt.endDate);
		}
		const url = `${this.EVENTS_ENDPOINT}&${urlParams}`;
		console.log("url :>> ", url);
		const response = await fetch(url);
		if (response.status !== 200)
			throw new Error("Fail to fetch events!" + response.statusText);
		const events = (await response.json()) as Event[];
		return events;
	}

	async validateCoins() {
		if (!this.db.data) throw new Error("db is undefined");
		const lastFetch = new Date(this.db.data.lastFetch).getTime();
		if (Date.now() - lastFetch > 1000 * 60 * 60 * 24) {
			console.log(`Coindar coins expired after 24 hours`);
			this.db.data = { coins: [], lastFetch: Date.now() };
			await this.db.write();
		}
		if (this.db.data.coins.length <= 0) {
			await this.fetchCoins();
		}
	}

	private async fetchCoins() {
		console.log("Fetching coindar coins");
		if (!this.db.data) throw new Error("db is undefined");
		const response = await fetch(this.COINS_ENDPOINT);
		if (response.status !== 200)
			throw new Error(
				"Error while trying to fetch coins, Reason : " + response.statusText
			);
		const coins = (await response.json()) as Coin[];
		this.db.data = {
			coins,
			lastFetch: Date.now(),
		};
		await this.db.write();
		console.log(`Coins fetched! Total : ${coins.length} coins`);
	}

	getCoin(symbol: string) {
		return this.db.data?.coins.find((c) =>
			c.symbol.toLowerCase().startsWith(symbol.toLowerCase())
		);
	}
}
