export const shortenUrl = async (url: string) : Promise<string> => {
	const ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN;
	const BASE_URL = process.env.BITLY_BASE_URL;
	const SHORTEN_ENDPOINT = `${BASE_URL}shorten`;
	return (
		(await fetch(SHORTEN_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ACCESS_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ long_url: url }),
		}).then((res) => res.json())) as any
	).link;
};
