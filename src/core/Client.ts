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
import { Samehadaku } from "../service/samehadaku/samehadaku";
export type client = ReturnType<typeof Baileys>;

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
export class Client
	extends (EventEmitter as new () => TypedEmitter<Events>)
	implements client
{
	private client!: client;
	store: ReturnType<typeof makeInMemoryStore>;
	binance: BinanceClient;
	samehadaku: Samehadaku;
	// public contact = new Contact(this);
	constructor() {
		super();
		config();
		this.store = makeInMemoryStore({ logger: P({ level: "fatal" }) });
		this.store.readFromFile(join(ROOT_DIR, "store", "stores.json"));
		setInterval(() => {
			this.store.writeToFile(join(ROOT_DIR, "store", "stores.json"));
		}, 10_000);

		this.initService();
	}

	async initService() {
		await new Promise<void>((res) => {
			setInterval(() => {
				if (this.condition === "connected") {
					res();
				}
			}, 500);
		});
		this.binance = new BinanceClient(this, true);
		this.samehadaku = new Samehadaku(this);
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
		for (const method of Object.keys(this.client))
			this[method as keyof Client] = this.client[method as keyof client];
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
				this.condition = "connecting";
				console.log("Connecting to WhatsApp...");
			}
			if (connection === "open") {
				this.condition = "connected";
				console.log("Connected to WhatsApp");
			}
		});
		this.client.ev.on("creds.update", saveCreds);
		return this.client;
	}
	public condition!: "connected" | "connecting" | "logged_out";

	public end!: client["end"];
	public ev!: client["ev"];
	public fetchBlocklist!: client["fetchBlocklist"];
	public updateProfileName!: client["updateProfileName"];
	public fetchPrivacySettings!: client["fetchPrivacySettings"];
	public fetchStatus!: client["fetchStatus"];
	public generateMessageTag!: client["generateMessageTag"];
	public getBusinessProfile!: client["getBusinessProfile"];
	public getCatalog!: client["getCatalog"];
	public getCollections!: client["getCollections"];
	public getOrderDetails!: client["getOrderDetails"];
	public groupAcceptInvite!: client["groupAcceptInvite"];
	public groupAcceptInviteV4!: client["groupAcceptInviteV4"];
	public groupInviteCode!: client["groupInviteCode"];
	public groupLeave!: client["groupLeave"];
	public groupMetadata!: client["groupMetadata"];
	public groupCreate!: client["groupCreate"];
	public groupFetchAllParticipating!: client["groupFetchAllParticipating"];
	public groupGetInviteInfo!: client["groupGetInviteInfo"];
	public groupRevokeInvite!: client["groupRevokeInvite"];
	public groupSettingUpdate!: client["groupSettingUpdate"];
	public groupToggleEphemeral!: client["groupToggleEphemeral"];
	public groupUpdateDescription!: client["groupUpdateDescription"];
	public groupUpdateSubject!: client["groupUpdateSubject"];
	public groupParticipantsUpdate!: client["groupParticipantsUpdate"];
	public logout!: client["logout"];
	public presenceSubscribe!: client["presenceSubscribe"];
	public productDelete!: client["productDelete"];
	public productCreate!: client["productCreate"];
	public productUpdate!: client["productUpdate"];
	public profilePictureUrl!: client["profilePictureUrl"];
	public updateMediaMessage!: client["updateMediaMessage"];
	public query!: client["query"];
	public readMessages!: client["readMessages"];
	public refreshMediaConn!: client["refreshMediaConn"];
	public relayMessage!: client["relayMessage"];
	public resyncAppState!: client["resyncAppState"];
	public resyncMainAppState!: client["resyncMainAppState"];
	public sendMessageAck!: client["sendMessageAck"];
	public sendNode!: client["sendNode"];
	public sendRawMessage!: client["sendRawMessage"];
	public sendReceipts!: client["sendReceipts"];
	public sendRetryRequest!: client["sendRetryRequest"];
	public sendMessage!: client["sendMessage"];
	public sendPresenceUpdate!: client["sendPresenceUpdate"];
	public sendReceipt!: client["sendReceipt"];
	public type!: client["type"];
	public updateBlockStatus!: client["updateBlockStatus"];
	public onUnexpectedError!: client["onUnexpectedError"];
	public onWhatsApp!: client["onWhatsApp"];
	public uploadPreKeys!: client["uploadPreKeys"];
	public updateProfilePicture!: client["updateProfilePicture"];
	public user!: client["user"];
	public ws!: client["ws"];
	public waitForMessage!: client["waitForMessage"];
	public waitForSocketOpen!: client["waitForSocketOpen"];
	public waitForConnectionUpdate!: client["waitForConnectionUpdate"];
	public waUploadToServer!: client["waUploadToServer"];
	public getPrivacyTokens!: client["getPrivacyTokens"];
	public assertSessions!: client["assertSessions"];
	public processingMutex!: client["processingMutex"];
	public appPatch!: client["appPatch"];
	public authState!: client["authState"];
	public upsertMessage!: client["upsertMessage"];
	public updateProfileStatus!: client["updateProfileStatus"];
	public chatModify!: client["chatModify"];
}
