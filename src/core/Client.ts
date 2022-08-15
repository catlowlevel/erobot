//Core implementation mostly copied from https://github.com/LuckyYam/WhatsApp-bot
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import Baileys, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeInMemoryStore,
	MessageRetryMap,
	ParticipantAction,
	proto,
	useMultiFileAuthState,
	WACallEvent,
} from "@adiwajshing/baileys";
import { config } from "dotenv";
// import { connect } from "mongoose";
import { Boom } from "@hapi/boom";
import { Message } from ".";
import P from "pino";
import { join } from "path";
import { ROOT_DIR } from "..";
import { BinanceClient } from "../service/binance/binance";

type Events = {
	new_call: (call: WACallEvent) => void;
	new_message: (M: Message) => void;
	participants_update: (event: IEvent) => void;
	new_group_joined: (group: { jid: string; subject: string }) => void;
};
const msgRetryCounterMap: MessageRetryMap = {};
interface IEvent {
	jid: string;
	participants: string[];
	action: ParticipantAction;
}
export class Client extends (EventEmitter as new () => TypedEmitter<Events>) {
	client: ReturnType<typeof Baileys>;
	store: ReturnType<typeof makeInMemoryStore>;
	binanceClient: BinanceClient;
	// public contact = new Contact(this);
	constructor() {
		super();
		config();
		this.store = makeInMemoryStore({ logger: P({ level: "fatal" }) });
		this.store.readFromFile(join(ROOT_DIR, "store", "stores.json"));
		setInterval(() => {
			this.store.writeToFile(join(ROOT_DIR, "store", "stores.json"));
		}, 10_000);

		this.binanceClient = new BinanceClient(this, true);
	}
	public correctJid = (jid: string): string =>
		`${jid.split("@")[0].split(":")[0]}@s.whatsapp.net`;

	async start() {
		// if (!process.env.MONGO_URI) throw new Error("No mongo uri provided!");
		// console.log("Connecting to database...");
		// await connect(process.env.MONGO_URI);
		// console.log("Connected to database!");
		const { saveCreds, state } = await useMultiFileAuthState(
			join(ROOT_DIR, "store", "auth")
		);
		// const { clearState, saveState, state } = await useDatabaseAuth();
		const { version, isLatest } = await fetchLatestBaileysVersion();
		console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
		this.client = Baileys({
			version,
			printQRInTerminal: true,
			auth: state,
			logger: P({ level: "fatal" }),
			msgRetryCounterMap,
			browser: ["Erobot", "-_-", "0.3"],
			keepAliveIntervalMs: 1000 * 30,
			// implement to handle retries
			getMessage: async (key) => {
				if (this.store) {
					const msg = await this.store.loadMessage(
						key.remoteJid!,
						key.id!,
						undefined
					);
					return msg?.message || undefined;
				}

				// only if store is present
				return {
					conversation: "ignore",
				};
			},
		});

		this.store.bind(this.client.ev);

		this.client.ev.on("messages.upsert", ({ messages, type }) => {
			const M: Message = new Message(messages[0], this);

			if (
				M.type === "protocolMessage" ||
				M.type === "senderKeyDistributionMessage"
			)
				return void null;

			if (type !== "notify") return void null;
			if (messages[0].key.remoteJid === "status@broadcast") return void null;

			if (M.stubType && M.stubParameters) {
				const emitParticipantsUpdate = (action: ParticipantAction): boolean =>
					this.emit("participants_update", {
						jid: M.from,
						participants: M.stubParameters as string[],
						action,
					});
				switch (M.stubType) {
					case proto.WebMessageInfo.StubType.GROUP_CREATE:
						return void this.emit("new_group_joined", {
							jid: M.from,
							subject: M.stubParameters[0],
						});
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_ADD:
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_ADD_REQUEST_JOIN:
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_INVITE:
						return void emitParticipantsUpdate("add");
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_LEAVE:
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_REMOVE:
						return void emitParticipantsUpdate("remove");
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_DEMOTE:
						return void emitParticipantsUpdate("demote");
					case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_PROMOTE:
						return void emitParticipantsUpdate("promote");
				}
			}
			return void this.emit("new_message", M);
		});
		this.client.ev.on("connection.update", (update) => {
			const { connection, lastDisconnect } = update;
			if (connection === "close") {
				if (
					(lastDisconnect?.error as Boom)?.output?.statusCode !==
					DisconnectReason.loggedOut
				) {
					console.log("Reconnecting...");
					setTimeout(() => this.start(), 3000);
				} else {
					console.log("Disconnected.", true);
					// console.log("Deleting session and restarting");
					// clearState();
					// console.log("Session deleted");
					console.log("Starting...");
					setTimeout(() => this.start(), 3000);
				}
			}
			if (connection === "connecting") {
				console.log("Connecting to WhatsApp...");
			}
			if (connection === "open") {
				console.log("Connected to WhatsApp");
			}
		});
		this.client.ev.on("creds.update", saveCreds);
		return this.client;
	}
}
