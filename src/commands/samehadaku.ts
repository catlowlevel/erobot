import { proto } from "@adiwajshing/baileys";
import { Message } from "../core";
import { BaseCommand } from "../core/BaseCommand";
import { IArgs } from "../core/MessageHandler";
import { Post } from "../service/samehadaku/samehadaku";
type UnUnion<T, S> = T extends S ? ([S] extends [T] ? T : never) : never;
type NotUnion<T> = UnUnion<T, T>;
type LiteralString<T extends string> = string extends T ? never : NotUnion<T>;

export default class extends BaseCommand {
	name = "samehadaku";

	private get samehadaku() {
		return this.client.samehadaku;
	}

	// private getType(flags: string[]) {
	// 	const index = this.getIndex(flags, "--type=");
	// 	const flagValue = flags[index].split("=")[1].toLowerCase();
	// 	if (index < 0 || !["sinopsis", "download"].includes(flagValue))
	// 		return "default";
	// 	return flagValue as "sinopsis" | "download";
	// }

	// private getUrl(flags: string[]) {
	// 	const index = this.getIndex(flags, "--url=");
	// 	const flagValue = flags[index].split("=")[1].toLowerCase();
	// 	if (index < 0) return "";
	// 	return flagValue;
	// }

	private getOptions(flags: string[]) {
		const type =
			this.getFlag(
				flags,
				"--type",
				["sinopsis", "download", "other_episodes"],
				"default"
			) ?? "default";
		const url = this.getFlag(flags, "--url") ?? "";
		return {
			type,
			url,
		};
	}

	public override execute = async (
		M: Message,
		{ flags }: IArgs
	): Promise<any> => {
		flags = flags.filter(
			(flag) =>
				flag.startsWith("--url=") ||
				flag.startsWith("--type=") ||
				flag.startsWith("--title=")
		);
		const options = this.getOptions(flags);
		console.log("options", options);
		switch (options.type) {
			case "download":
				return this.handleDownload(M, options);
			case "sinopsis":
				return this.handleSinopsis(M, options);
			case "other_episodes":
				return this.handleOtherEpisodes(M, options);
			case "default":
				break;
		}
		const url = this.getFlag(flags, "--url");
		let post: Post | undefined;
		if (!url) post = this.samehadaku.db.data?.[0];
		else {
			try {
				post = await this.samehadaku.getPost(url);
			} catch (error) {
				console.log("error", error);
			}
		}

		if (!post) return M.reply("There's no recent post");
		return this.samehadaku.sendPost(M.from, post, M.message);
	};
	async handleDownload(
		M: Message,
		options: ReturnType<typeof this.getOptions>
	) {
		const post = await this.samehadaku.getPost(options.url);
		const downloadLinks = await this.samehadaku.getDownloadLinks(
			post.url,
			post.title
		);
		let text = `*${post.title}*\n============================\n`;
		Object.keys(downloadLinks).forEach((format) => {
			const resolution = downloadLinks[format as keyof typeof downloadLinks];
			text += `*${format}*\n`;
			text += "============================\n";
			Object.keys(resolution).forEach((reso) => {
				const links = downloadLinks[format][reso];
				text += `${reso}\n`;
				links.forEach((link) => {
					text += `${link.url}\n`;
				});
			});
			text += "============================\n";
		});
		M.reply(text);
	}
	async handleSinopsis(
		M: Message,
		options: ReturnType<typeof this.getOptions>
	) {
		const post = await this.samehadaku.getPost(options.url);
		const sinopsis = await this.samehadaku.getSinopsis(options.url);
		return M.reply(`*${post.title}*\n==========================\n${sinopsis}`);
	}

	async handleOtherEpisodes(
		M: Message,
		options: ReturnType<typeof this.getOptions>
	) {
		const post = await this.samehadaku.getPost(options.url);
		const eps = await this.samehadaku.getOtherEpisodes(options.url);
		const sections: proto.Message.ListMessage.ISection[] = [
			{ title: "Episode List", rows: [] },
		];
		eps.forEach((ep) => {
			sections[0].rows?.push({
				title: ep.title,
				rowId: `.samehadaku --type=default --url=${ep.url} --title=${ep.title}`,
			});
		});

		return this.client.sendMessage(
			M.from,
			{
				text: `*${post.title}*`,
				buttonText: "List Episode",
				sections,
			},
			{ quoted: M.message }
		);
	}
}
