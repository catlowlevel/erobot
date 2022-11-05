import sharp from "sharp";
import { fetch } from "undici";
import { BaseCommand, Command, IArgs, Message } from "../core";
import { Buondua } from "../lib/buondua";

@Command("buondua", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const url = this.getFlag(args.flags, "--unblur=");
        if (url) {
            console.log("url :>> ", url);

            const imageBuffer = await fetch(url)
                .then((r) => r.arrayBuffer())
                .then((ab) => Buffer.from(ab));
            return M.reply(imageBuffer, "image");
        }

        const buondua = new Buondua();
        const albums = await buondua.getHomepage();
        const album = this.client.utils.randomArray(albums);
        let albumData = await buondua.getAlbumsData(album.id);
        const randomPage = this.client.utils.randomNumber(1, albumData.lastPage);
        console.log("randomPage :>> ", randomPage);
        albumData = await buondua.getAlbumsData(album.id, randomPage);
        const image = this.client.utils.randomArray(albumData.images);
        const imageBuffer = await fetch(image.link)
            .then((r) => r.arrayBuffer())
            .then((ab) => Buffer.from(ab));

        const blurredImage = await sharp(imageBuffer).blur(50).toBuffer();

        return this.client.sendMessage(
            M.from,
            {
                image: blurredImage,
                buttons: [
                    {
                        buttonId: `.buondua --unblur=${image.link}`,
                        buttonText: { displayText: "Unblur" },
                        type: 1,
                    },
                ],
                caption: albumData.name,
            },
            { quoted: M.message }
        );
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        throw new Error(err.message);
    };
}
