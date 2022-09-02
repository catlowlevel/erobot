// import { JSONFile, Low } from "@commonify/lowdb";
// import fetch from "node-fetch-commonjs";
// import { ROOT_DIR } from "../..";
// import { Client } from "../../core";
// import { formatDate } from "../../helper/utils";

// interface Event {
// 	caption: string;
// 	source: string;
// 	proof: string;
// 	date_public: string;
// 	date_start: string;
// 	date_end: string;
// 	coin_id: string;
// 	coin_price_changes: string;
// 	tags: string;
// }

// interface DB {
// 	lastFetch: number;
// 	events: Event[];
// }
// //why would i want to use this? idk
// class Coindar {
// 	eventsAdapter = new JSONFile<DB>(`${ROOT_DIR}/json/coindar_events.json`);
// 	ACCESS_TOKEN = process.env.COINDAR_ACCESSTOKEN; //waapi
// 	API = process.env.COINDAR_BASE_URL_API;
// 	COINS_ENDPOINT = `${this.API}coins`;
// 	TAGS_ENDPOINT = `${this.API}tags`;
// 	EVENTS_ENDPOINT = `${this.API}events`;
// 	db: Low<DB>;

// 	initialized: boolean;
// 	constructor(client: Client) {
// 		this.initialized = false;
// 		this.db = new Low(this.eventsAdapter);
// 		this.db
// 			.write()
// 			.then(() => {
// 				return this.db.read().then(async () => {
// 					this.db.data ||= { events: [], lastFetch: Date.now() };

// 					await this.validateEvents();
// 					this.initialized = true;
// 				});
// 			})
// 			.then(console.error);
// 	}

// 	async getEvents(symbols: string[]) {
// 		await this.validateEvents();

// 		const events = this.db.data?.events!;
// 		for (let i = 0; i < events.length; i++) {
// 			const event = events[i];
// 		}
// 	}
// 	private async fetchAllEvents() {
// 		console.log("Fetching all events");
// 		if (!this.db.data) throw new Error("db is undefined");

// 		const today = formatDate(new Date());
// 		let page = 1;
// 		while (true) {
// 			const response = await fetch(
// 				`${
// 					this.EVENTS_ENDPOINT
// 				}?access_token=67461:R7u6AfDKiSAnz4OsofY&filter_date_start=${today}&page_size=100&page=${page++}`
// 			);
// 			if (response.status !== 200) break;
// 			const events = (await response.json()) as Event[];
// 			if (events.length <= 0) break;

// 			this.db.data.events = [...this.db.data?.events, ...events];
// 		}
// 		console.log(`${page} pages of events fetched`);
// 		console.log(`Total events : ${this.db.data.events.length}`);

// 		this.db.data.lastFetch = Date.now();
// 		await this.db.write();
// 	}

// 	waitInit = async () =>
// 		new Promise<void>((res, rej) => {
// 			setTimeout(() => {
// 				if (this.initialized) res();
// 			}, 500);
// 			setTimeout(() => {
// 				rej("Timeout");
// 			}, 5000);
// 		});

// 	async validateEvents() {
// 		if (!this.db.data) throw new Error("db is undefined");
// 		const lastFetch = new Date(this.db.data.lastFetch).getTime();
// 		if (Date.now() - lastFetch > 1000 * 60 * 60 * 6) {
// 			console.log(`Coindar events expired after 6 hours`);
// 			this.db.data = { events: [], lastFetch: Date.now() };
// 			await this.db.write();
// 		}
// 		if (this.db.data.events.length <= 0) {
// 			await this.fetchAllEvents();
// 		}
// 	}
// }
