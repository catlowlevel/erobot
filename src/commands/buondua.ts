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
        const id = this.getFlag(args.flags, "--id=");
        if (url) {
            console.log("url :>> ", url);
            const imageBuffer = await fetch(url)
                .then((r) => r.arrayBuffer())
                .then((ab) => Buffer.from(ab));
            return this.client.sendMessage(
                M.from,
                {
                    image: imageBuffer,
                    buttons: [
                        {
                            buttonId: `.buondua --id=${id}`,
                            buttonText: { displayText: "More" },
                            type: 1,
                        },
                        {
                            buttonId: `.buondua`,
                            buttonText: { displayText: "New" },
                            type: 1,
                        },
                    ],
                    caption: id,
                },
                { quoted: M.message }
            );
        }

        const buondua = new Buondua();
        let albums: Awaited<ReturnType<typeof buondua["getHomepage"]>> | undefined;
        let album: Awaited<ReturnType<typeof buondua["getHomepage"]>>[0] | undefined;
        let albumData;
        if (!id) {
            albums = await buondua.getHomepage();
            album = this.client.utils.randomArray(albums);
            albumData = await buondua.getAlbumsData(album.id);
        } else albumData = await buondua.getAlbumsData(Number(id));
        const randomPage = this.client.utils.randomNumber(1, albumData.lastPage);
        console.log("randomPage :>> ", randomPage);
        const image = this.client.utils.randomArray(albumData.images);
        let imageBuffer = await fetch(image.link)
            .then((r) => r.arrayBuffer())
            .then((ab) => Buffer.from(ab));

        imageBuffer = id ? imageBuffer : await sharp(imageBuffer).blur(50).toBuffer();
        if (id) {
            return this.client.sendMessage(
                M.from,
                {
                    image: imageBuffer,
                    buttons: [
                        {
                            buttonId: `.buondua --id=${id}`,
                            buttonText: { displayText: "More" },
                            type: 1,
                        },
                        {
                            buttonId: `.buondua`,
                            buttonText: { displayText: "New" },
                            type: 1,
                        },
                    ],
                    caption: id,
                },
                { quoted: M.message }
            );
        }

        return this.client.sendMessage(
            M.from,
            {
                image: imageBuffer,
                buttons: [
                    {
                        buttonId: `.buondua --unblur=${image.link} --id=${albumData.id}`,
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
