import { searchAnime } from "../lib/mal";

test("return an array of anime", async () => {
    const anime = await searchAnime("naruto");
    expect(anime.data[0].mal_id).toBe(53240);
});
