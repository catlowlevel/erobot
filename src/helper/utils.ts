export const generateRandomUniqueTag = (n: number = 4): string => {
	let max = 11;
	if (n > max)
		return `${generateRandomUniqueTag(max)}${generateRandomUniqueTag(n - max)}`;
	max = Math.pow(10, n + 1);
	const min = max / 10;
	return (Math.floor(Math.random() * (max - min + 1)) + min)
		.toString()
		.substring(1);
};

export const extractNumbers = (content: string): number[] => {
    const search = content.match(/(-\d+|\d+)/g)
    if (search !== null) return search.map((string) => parseInt(string))
    return []
}