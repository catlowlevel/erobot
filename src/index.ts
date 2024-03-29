import "dotenv/config";
import path from "path";
import "reflect-metadata";
import { register } from "timeago.js";
import id_ID from "timeago.js/lib/lang/id_ID";
import { Client } from "./core";
import { MessageHandler } from "./core/MessageHandler";
const url = new URL(import.meta.url);
const __dirname = url.pathname;
export const ROOT_DIR = path.resolve(__dirname, "..", "..");
export const INDEX_DIR = path.resolve(__dirname, "..");
console.log("ROOT_DIR", ROOT_DIR);
console.log("INDEX_DIR", INDEX_DIR);
register("id_ID", id_ID);

const client = new Client();
client.start().then(async (client) => {
    const { handleMessage, loadCommands } = new MessageHandler(client);
    await loadCommands();

    client.on("new_message", handleMessage);
});

export const getClient = () => client;
