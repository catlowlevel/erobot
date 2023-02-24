import { Message } from ".";

interface CollectOption {
    /** Timeout in ms before stop collect */
    timeout: number;
    /** Maximum number of message to collect */
    max?: number;
    /** Only collect message from the sender */
    senderOnly?: boolean;
}

type NewMessageType = (M: Message, stopCollect: (dontCollect?: boolean) => void) => void | Promise<void>;
export const Collector =
    (M: Message) =>
    /**
     * @param options Options
     * @param newMessageCB Process new messages, return undefined to NOT collect the message
     * @returns Collected messages
     */
    (options: CollectOption, newMessageCB?: NewMessageType, timeoutCb?: (messages: Message[]) => void) => {
        const client = M.getClient();
        if (options.timeout < 1000) throw new Error("timeout must be greater than 1000ms");
        console.log("Collecting messages");
        return new Promise<{ messages: Message[]; isTimeout: boolean }>((res, rej) => {
            const messages: Message[] = [];

            const timeout = setTimeout(() => {
                done({ isTimeout: true });
            }, options.timeout);

            const done = (opt: { isTimeout: boolean }) => {
                try {
                    clearTimeout(timeout);
                    client.off("new_message", messageHandler);
                    console.log(`Collect done : ${messages.length} collected`);
                    res({ messages, ...opt });
                } catch (error) {
                    rej(error);
                }
            };

            const messageHandler = async (newM: Message) => {
                if (options.senderOnly) {
                    if (newM.sender.jid !== newM.sender.jid) return null;
                }
                newM.markAsRead();
                const addNewMessage = () => {
                    messages.push(newM);
                    console.log(`${messages.length} message${messages.length > 1 ? "s" : ""} collected`);
                };
                if (newMessageCB) {
                    const finishing = (dontCollect?: boolean) => {
                        if (!dontCollect) addNewMessage();
                        done({ isTimeout: false });
                    };
                    const result = await newMessageCB(newM, finishing);
                    if (result !== undefined) {
                        addNewMessage();
                    }
                } else {
                    addNewMessage();
                }
                if (options.max) {
                    if (messages.length >= options.max) {
                        done({ isTimeout: false });
                    }
                }
            };
            client.on("new_message", messageHandler);

            //const interval = setInterval(() => {
            //try {
            //if (options.max) {
            //if (messages.length >= options.max) {
            //clearInterval(interval);
            //clearTimeout(timeout);
            //done();
            //}
            //} else {
            //clearInterval(interval);
            //}
            //} catch (error) {
            //rej(error);
            //}
            //}, 100);
        });
    };
