import { fetch } from "undici";
import { ROOT_DIR } from "../..";
import { LowDB } from "../../core";
import { CreateResponse, TextResponse } from "./types";

interface DBType {
    [charaId: string]: {
        historyId: string;
        tgt: string;
    };
}

export class CharaAi {
    private token: string;
    /** external_id */
    private historyId: string;
    private tgt: string;
    private cache: LowDB<DBType>;

    constructor(private charaId: string) {
        if (!process.env.BETA_CHARA_AI_TOKEN) throw new Error("beta.chara.ai token is required!");
        this.token = process.env.BETA_CHARA_AI_TOKEN;
        this.cache = new LowDB<DBType>(`${ROOT_DIR}/json/beta_chara_ai_cache.json`, {});
    }

    private setData = (historyId: string, tgt: string) => {
        if (!historyId) throw new Error("historyId is undefined!");
        this.historyId = historyId;
        if (!tgt) throw new Error("historyId is undefined!");
        this.tgt = tgt;
    };

    create = async (createNew = false) => {
        if (!createNew) {
            await this.cache.waitInit();
            const cache = this.cache.data[this.charaId];
            if (cache) {
                console.log("cache is exist");
                this.setData(cache.historyId, cache.tgt);
                return { [this.charaId]: cache };
            }
        }
        console.log("this.token", this.token);
        return fetch(`https://beta.character.ai/chat/history/create/`, {
            credentials: "include",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.5",
                Authorization: `Token ${this.token}`,
                "Content-Type": "application/json",
                // "Sec-Fetch-Dest": "empty",
                // "Sec-Fetch-Mode": "cors",
                // "Sec-Fetch-Site": "same-origin",
            },
            // referrer: `https://beta.character.ai/chat?char=${this.charaId}`,
            body: JSON.stringify({
                character_external_id: this.charaId,
                // override_history_set: null,
            }),
            method: "POST",
            mode: "cors",
        })
            .then((r) => r.json() as Promise<CreateResponse>)
            .then((data): DBType => {
                console.log("data", JSON.stringify(data, null, 2));
                const historyId = data.external_id;
                const user = data?.participants?.find((p) => !p.is_human);
                if (!user) throw new Error(`user is undefined, data => ${JSON.stringify(data)}`);
                const tgt = user.user.username;
                this.setData(historyId, tgt);
                this.cache.waitInit().then(() => {
                    this.cache.data[this.charaId] = {
                        historyId: historyId,
                        tgt: tgt,
                    };
                    this.cache.write().then(() => {
                        console.log(`Cache saved for ${this.charaId}`);
                    });
                });
                return {
                    [this.charaId]: { historyId: this.historyId, tgt: this.tgt },
                };
            });
    };
    get created(): boolean {
        return this.tgt !== undefined && this.historyId !== undefined;
    }

    /** Make sure to call create() method before calling this method */
    text = (text: string, streamCb?: (response: TextResponse) => void) => {
        if (!this.created) throw new Error("call create() before calling this method!");
        console.log("sending text " + text);
        return fetch("https://beta.character.ai/chat/streaming/", {
            credentials: "include",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0",
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                Authorization: `Token ${this.token}`,
                "content-type": "application/json",
                // "Sec-Fetch-Dest": "empty",
                // "Sec-Fetch-Mode": "cors",
                // "Sec-Fetch-Site": "same-origin",
            },
            // referrer:
            // 	"https://beta.character.ai/chat?char=UI68g1Msb3dinws1rin1unk2y97TizoZpYN5SHq0n-s",
            body: JSON.stringify({
                history_external_id: this.historyId,
                character_external_id: this.charaId,
                text: text,
                tgt: this.tgt,
                ranking_method: "random",
                faux_chat: false,
                staging: false,
                stream_every_n_steps: 16,
                chunks_to_pad: 8,
                is_proactive: false,
            }),
            method: "POST",
            mode: "cors",
        })
            .then((r) => r.body)
            .then(async (body) => {
                if (!body) throw new Error("body is undefined!");
                const reader = body.getReader();
                let done = false;
                let counter = 0;
                let data: TextResponse | undefined;
                console.log("reading...");
                while (!done) {
                    counter++;
                    const read = await reader.read();
                    if (!read || !read.value) {
                        done = true;
                        console.log("read is undefined");
                        continue;
                    }
                    const buffer = Buffer.from(read.value);
                    const value = buffer.toString().trim();
                    if (value.includes('"is_final_chunk": true')) {
                        console.log("done");
                        data = JSON.parse(value);
                        done = true;
                        continue;
                    } else if (value.includes('"is_final_chunk": false')) {
                        try {
                            const data = JSON.parse(value);
                            streamCb?.(data);
                        } catch (error) {
                            console.log("parse error");
                        }
                    }
                }
                console.log(`Counter : ${counter}`);
                if (!data) throw new Error("data is undefined!");
                return data;
            });
    };
}
