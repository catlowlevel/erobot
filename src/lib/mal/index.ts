import pkg from "jakan";
const { Jakan } = pkg;
const jakan = new Jakan().withMemory().forSearch();

export const searchAnime = async (query: string) => {
    const result = await jakan.anime(query);
    return result;
};
