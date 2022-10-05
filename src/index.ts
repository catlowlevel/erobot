import path from "path";
import { register } from "timeago.js";
import id_ID from "timeago.js/lib/lang/id_ID";
import { Client } from "./core";
import { MessageHandler } from "./core/MessageHandler";
export const ROOT_DIR = path.resolve(__dirname, "..");
register("id_ID", id_ID);
(async () => {
    const client = new Client();
    await client.start();

    const { handleMessage, loadCommands } = new MessageHandler(client);
    await loadCommands();

    client.on("new_message", handleMessage);
})();
