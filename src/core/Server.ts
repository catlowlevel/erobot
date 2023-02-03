import Express from "express";
import { Client } from "./Client";
//FIXME:
export class Server {
    app: ReturnType<typeof Express>;
    PORT = "4567";

    constructor(client: Client) {
        this.app = Express();
        this.app.get("/chats", (req, res) => {
            const chats = client.store.chats.toJSON();
            return res.send(chats);
        });

        this.app.get("/recent", async (req, res) => {
            const { jid }: { jid?: string } = req.query;
            if (!jid) return res.json({ error: "jid required!" });
            const recentMessages = await client.store.mostRecentMessage(jid);
            if (!recentMessages) return res.json({ error: "Not found" });
            return res.json(recentMessages);
        });

        this.app.listen(this.PORT, () => {
            console.log(`listening on http://localhost:${this.PORT}`);
        });
    }
}
