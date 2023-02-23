import { proto } from "@adiwajshing/baileys";
import Queue from "queue";
import { BaseCommand, Command, IArgs, Message } from "../core";

@Command("imagine", {
    description: "",
    usage: "",
})
export default class extends BaseCommand {
    queue = Queue({ autostart: true, concurrency: 1 });
    public override execute = async (M: Message, args: IArgs): Promise<unknown> => {
        const quoted = M.quoted?.content;
        console.log(args.context, quoted);
        args.context = args.context ? args.context : (quoted as string);
        if (!args.context) return M.reply("Prompt required!");
        if (this.queue.length > 0) M.reply(`You are in a queue : ${this.queue.length}`);

        const id = this.getFlag(args.flags, "--id");
        const style = args.flags.some((a) => a.startsWith("--style"));
        console.log(style);

        console.log(id);

        if (!id && style) {
            const sections: proto.Message.ListMessage.ISection[] = [];
            sections.push({
                title: "Available styles",
                rows: this.styles.map((style) => ({
                    title: style.style_name,
                    rowId: `.imagine ${args.context} --id=${style.style_id}`,
                })),
            });
            return M.reply(
                "Style",
                "text",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                { buttonText: "Select Style", sections }
            );
        }
        //TODO: validate id
        return new Promise<void>((res) => {
            this.queue.push(async (cb) => {
                try {
                    const buffer = await this.imagine(args.context, id);
                    await M.reply(buffer, "image", undefined, undefined, args.context);
                    res();
                } catch (err) {
                    await M.reply("Error");
                    res();
                    cb?.();
                }
            });
        });
    };
    imagine = async (prompt: string, styleId?: string) => {
        const data = new URLSearchParams({ model_version: "1" });
        data.append("prompt", prompt);
        data.append("width", "512");
        data.append("height", "512");
        if (styleId) data.append("style_id", styleId);

        return this.client.utils.getBuffer("https://inferenceengine.vyro.ai/sd", {
            body: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        });
    };

    public handleError = async (M: Message, err: Error): Promise<unknown> => {
        return M.reply(err.message);
    };
    styles = [
        { style_id: 27, style_name: "Imagine V2", style_thumb: "assets/styles_v1/thumbv1_27.webp" },
        { style_id: 28, style_name: "Imagine V1", style_thumb: "assets/styles_v1/thumbv1_28.webp" },
        { style_id: 29, style_name: "Realistic", style_thumb: "assets/styles_v1/thumbv1_29.webp" },
        { style_id: 21, style_name: "Anime", style_thumb: "assets/styles/thumb_20.webp" },
        { style_id: 3, style_name: "Cyberpunk", style_thumb: "assets/styles/thumb_2.webp" },
        { style_id: 7, style_name: "Euphoric", style_thumb: "assets/styles/thumb_6.webp" },
        { style_id: 101, style_name: "Poster Art", style_thumb: "assets/styles_v1/thumbv1_101.webp" },
        { style_id: 102, style_name: "Ink", style_thumb: "assets/styles_v1/thumbv1_102.webp" },
        { style_id: 103, style_name: "Japanese Art", style_thumb: "assets/styles_v1/thumbv1_103.webp" },
        { style_id: 104, style_name: "Salvador Dali", style_thumb: "assets/styles_v1/thumbv1_104.webp" },
        { style_id: 105, style_name: "Van Gogh", style_thumb: "assets/styles_v1/thumbv1_105.webp" },
        { style_id: 106, style_name: "Steampunk", style_thumb: "assets/styles_v1/thumbv1_106.webp" },
        { style_id: 107, style_name: "Retrowave", style_thumb: "assets/styles_v1/thumbv1_107.webp" },
        { style_id: 108, style_name: "Poly Art", style_thumb: "assets/styles_v1/thumbv1_108.webp" },
        { style_id: 109, style_name: "Vibrant", style_thumb: "assets/styles_v1/thumbv1_109.webp" },
        { style_id: 110, style_name: "Mystical", style_thumb: "assets/styles_v1/thumbv1_110.webp" },
        { style_id: 111, style_name: "Cinematic Render", style_thumb: "assets/styles_v1/thumbv1_111.webp" },
        { style_id: 112, style_name: "Futuristic", style_thumb: "assets/styles_v1/thumbv1_112.webp" },
        { style_id: 113, style_name: "Polaroid", style_thumb: "assets/styles_v1/thumbv1_113.webp" },
        { style_id: 114, style_name: "Picaso", style_thumb: "assets/styles_v1/thumbv1_114.webp" },
        { style_id: 115, style_name: "Sketch", style_thumb: "assets/styles_v1/thumbv1_115.webp" },
        { style_id: 116, style_name: "Comic Book", style_thumb: "assets/styles_v1/thumbv1_116.webp" },
    ];
    inspirations = [
        {
            inspiration_id: 32,
            prompt: "close up portait beautiful girl the orange desert in modern fight suit, hyper realistic, pastel colors, complementary colors, muted colors, vibrant colors, dramatic colors, vaporwave, retrowave, black and white, colorfull, artochrome, highly detailed, 4k",
            inspiration_thumb: "assets/inspirations/insp_32.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 440593,
        },
        {
            inspiration_id: 33,
            inspiration_thumb: "assets/inspirations/insp_33.webp",
            prompt: "a cat with wings, flyng over clouds, futuristic, elegant atmosphere, glowing lights, highly detailed, digital painting, artstaion, concept art, smooth sharp focus, illustration, art by wlop, mars ravelo,greg rutkowski",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 156337,
        },
        {
            inspiration_id: 34,
            prompt: "back to the future car, flying, Lightening, futuristic, elegant atmosphere, glowing lights, highly detailed, digital painting, artstaion, concept art, smooth sharp focus, illustration, art by wlop, mars ravelo,greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_34.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 463788,
        },
        {
            inspiration_id: 35,
            prompt: "polymorph parametric Living Quarters on planet Jupiter, Interior Design, superb view of the planet, from the inside, Spacial Design, Futuristic, Patterns, Textures, Fluid, Massive, Detailed, Polished, Complex, Beautiful, Octane Rendering, Insane Graphics, 8k",
            inspiration_thumb: "assets/inspirations/insp_35.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 113667,
        },
        {
            inspiration_id: 36,
            prompt: "The Last Ship Envy, steampunk, stylized digital illustration, sharp focus, elegant, intricate, digital painting, artstaion concept art, global illumination,ray tracing, advanced technology, chaykan howard, campion pascal,cooke darwin, davis jack, pink atmosphere",
            inspiration_thumb: "assets/inspirations/insp_36.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 319577,
        },
        {
            inspiration_id: 37,
            prompt: "a painting of a purple owl sitting in a forest, trending on artstation, pixiv, dramatic, cinematic, 4k, highly detailed, mystic",
            inspiration_thumb: "assets/inspirations/insp_37.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 437959,
        },
        {
            inspiration_id: 38,
            prompt: "a painting of a cute, iridescent ghost in a winter forest, futuristic, elegant atmosphere, glowing lights, highly detailed, digital painting, artstaion, concept art, smooth sharp focus, illustration, art by wlop, mars ravelo,greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_38.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 649048,
        },
        {
            inspiration_id: 39,
            prompt: "a close up of a cat wearing a space suit, digital art, by Ryan Yee, zbrush central contest winner, 9gag, cute 3 d render, illustration of a cat, in style of nanospace, very detailed illustration, ruan cute vtuber, (extremely detailed, cute cartoon, with a space suit on",
            inspiration_thumb: "assets/inspirations/insp_39.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 735177,
        },
        {
            inspiration_id: 40,
            prompt: "Futuristic cyberpunk masked assassin, half cyborg, riding a motorcycle, full body, in heavy rain, open road, neon lights, cyberpunk city, hyper realistic, unreal engine",
            inspiration_thumb: "assets/inspirations/insp_40.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 370724,
        },
        {
            inspiration_id: 41,
            prompt: "A surreal time machine designed by dieter rams, product ad retro, colorful, futuristic, elegant atmosphere, glowing lights, highly detailed, digital painting, artstaion, concept art, smooth sharp focus, illustration, art by wlop, mars ravelo,greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_41.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 646627,
        },
        {
            inspiration_id: 42,
            prompt: "Steampunk, ambulance, photorealistic, detailed, on a city street, in wartime, cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d, hard surface modeling, 8k, render octane, inspired by beksinski",
            inspiration_thumb: "assets/inspirations/insp_42.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 57459,
        },
        {
            inspiration_id: 43,
            prompt: "A photo of astronaut in a jungle, cold color palette, muted colors, detailed, 8k, cinematic, dramatic colors, close-up",
            inspiration_thumb: "assets/inspirations/insp_43.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 36999,
        },
        {
            inspiration_id: 44,
            prompt: "Cute and adorable cartoon goku baby, fantasy, dreamlike, surrealism, super cute, trending on artstation, cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d, hard surface modeling, 8k,render octane, inspired by beksinski",
            inspiration_thumb: "assets/inspirations/insp_44.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 252249,
        },
        {
            inspiration_id: 45,
            prompt: "Cute girl, with short, choppy hair and bangs, serene eyes, gentle eyebrows, slight smile, 4k, sharp focus, high resolution, by artgerm and greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_45.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 734636,
        },
        {
            inspiration_id: 46,
            prompt: "modelshoot style, (extremely detailed CG unity 8k wallpaper), full shot body photo of the most beautiful artwork in the world, medieval armor, professional majestic oil painting by Ed Blinkey, Atey Ghailan, Studio Ghibli, by Jeremy Mann, Greg Manchess, Antonio Moro, trending on ArtStation, trending on CGSociety, Intricate, High Detail, Sharp focus, dramatic, photorealistic painting art by midjourney and greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_46.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 979211,
        },
        {
            inspiration_id: 47,
            prompt: "diorama of a futuristic house made from a nautilus shell, concept art behance hd by jesper ejsing",
            inspiration_thumb: "assets/inspirations/insp_47.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 609302,
        },
        {
            inspiration_id: 48,
            prompt: "dreamlikeart, modelshoot style, extremely detailed CG unity 8k, full body shot photo of the most beautiful artwork in the world, viking blonde shieldmaiden, beautiful blue eyes, sexy, winter, dark medieval, professional majestic oil painting by Atey Ghailan, by Jeremy Mann, Greg Manchess, Anthonis Mor, Studio Ghibli, ArtStation, CGSociety, Intricate, High Detail, Sharp focus, dramatic, photorealistic painting art by Midjourney and Greg Rutkowski",
            inspiration_thumb: "assets/inspirations/insp_48.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 254039,
        },
        {
            inspiration_id: 49,
            prompt: "anthropomorphic art of a detective mouse, victorian inspired clothing by artgerm, victo ngai, ryohei hase, artstation. fractal papersand books. highly detailed digital painting, smooth, global illumination, fantasy art by greg rutkowsky, karl spitzweg",
            inspiration_thumb: "assets/inspirations/insp_49.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 638726,
        },
        {
            inspiration_id: 50,
            prompt: "fantasy (mushroom girl), forest, (8k), beautiful, perfect, high quality, high detail, digital drawing, cute, blue, pretty face",
            inspiration_thumb: "assets/inspirations/insp_50.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 448837,
        },
        {
            inspiration_id: 51,
            prompt: "An astronaut resting on mars in a beach chair, vibrant lighting, elegant, highly detailed, smooth, sharp focus, illustration, beautiful, geometric, trending on artstation, full body, cinematic, artwork by borovikovsky",
            inspiration_thumb: "assets/inspirations/insp_51.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 282780,
        },
        {
            inspiration_id: 52,
            prompt: "Magic mad scientist, inside cosmic labratory, radiating a glowing aura stuff, loot legends, stylized, digital illustration, video game icon, artstation, lois van baarle, ilya kuvshinov, rossdraws",
            inspiration_thumb: "assets/inspirations/insp_52.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 78861,
        },
        {
            inspiration_id: 53,
            prompt: "Photo of 8k ultra realistic lighthouse on island, heavy rain, night, light shining, heavy seas, full of colour, cinematic lighting, battered, trending on artstation, 4k, hyperrealistic, focused, extreme details, unreal engine 5, cinematic, masterpiece, art by studio ghibli",
            inspiration_thumb: "assets/inspirations/insp_53.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 779494,
        },
        {
            inspiration_id: 54,
            prompt: "A study of cell shaded portrait of james cameron cyborg as borderlands 3 concept art, llustration, post grung, concept art by josan gonzales and wlop, by james jean, victo ngai, david rubin, mike mignola, laurie greasley, highly detailed, sharp focus, alien, trending on artstation, hq, deviantart, art by artgem",
            inspiration_thumb: "assets/inspirations/insp_54.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 740685,
        },
        {
            inspiration_id: 55,
            prompt: "A demon girl with big and cute eyes, || very anime, fine-face, realistic shaded perfect face, fine details. anime. realistic shaded lighting poster by ilya kuvshinov katsuhiro otomo ghost-in-the-shell, magali villeneuve, artgerm, jeremy lipkin and michael garmash, rob rey and kentarõ miura style, trending on art station",
            inspiration_thumb: "assets/inspirations/insp_55.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 878148,
        },
        {
            inspiration_id: 56,
            prompt: "A futuristic shoe designed by nike, cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d, hard surface modeling, 8k, render octane, inspired by beksinski",
            inspiration_thumb: "assets/inspirations/insp_56.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 969439,
        },
        {
            inspiration_id: 57,
            prompt: "A cute adorable baby owl made of crystal ball with low poly eye's highly detailed intricated concept art trending artstation 8k, cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d",
            inspiration_thumb: "assets/inspirations/insp_57.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 718274,
        },
        {
            inspiration_id: 58,
            prompt: "Se7een design studio in a modern cool font and 3d metalic pastel, futuristic, elegant atmosphere, glowing lights, highly detailed, digital painting, artstaion, concept art, smooth sharp focus, illustration, art by wlop, mars ravelo,greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_58.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 856963,
        },
        {
            inspiration_id: 59,
            prompt: "A miniature tabletop a pleasant christmas time canada landscape, snow, trees, christmas shop, glowing under an ornate glass dome, by paulette tavormina and michael whelan and donato giancola, inside a dusty abandoned laboratory, hyper realistic, extremely detailed, dramatic lighting, victorian, unreal engine, featured on artstation, octane rendar",
            inspiration_thumb: "assets/inspirations/insp_59.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 514654,
        },
        {
            inspiration_id: 60,
            prompt: "Interior of luxury condominium with minimalist furniture and lush house plants and abstract wall paintings | modern architecture by makoto shinkai, ilya kuvshinov, lois van baarle, rossdraws and frank lloyd wright",
            inspiration_thumb: "assets/inspirations/insp_60.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 307235,
        },
        {
            inspiration_id: 61,
            prompt: "Cartoony, happy joe rogan portrait painting of a rabbit character from overwatch, armor, girly pink color scheme design, full shot, asymmetrical, splashscreen, organic painting, sunny day, matte painting, bold shapes, hard edges, cybernetic, moon in background, street art, trending on artstation, by huang guangjian and gil elvgren and sachin teng",
            inspiration_thumb: "assets/inspirations/insp_61.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 696433,
        },
        {
            inspiration_id: 62,
            prompt: "Dark minimalist background with 3d geometry dunes desert with flying cubes and pyramids abstract neon vector colored degraded gradient abstract hdr, uhd, 4k, 8k trending on artstation and deviantart bokeh",
            inspiration_thumb: "assets/inspirations/insp_62.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 73896,
        },
        {
            inspiration_id: 63,
            prompt: ".your thoughts become your reality cloud, sky, and sun in the background, palms, see. renaissance aesthetic, star trek aesthetic, pastel colors aesthetic, intricate fashion clothing, highly detailed, surrealistic, digital painting, concept art, sharp focus, illustration, unreal engine art by artgerm and greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_63.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 968698,
        },
        {
            inspiration_id: 64,
            prompt: "A black and white drawing of an astronaut, an ambient occlusion render by esao, cgsociety, space art, sci-fi, chillwave, ue5",
            inspiration_thumb: "assets/inspirations/insp_64.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 77696,
        },
        {
            inspiration_id: 65,
            prompt: "Side view cyber vehicle white isolated background futuristic design,  futuristic, elegant atmosphere, glowing lights, highly detailed, digital painting, artstaion, concept art, smooth sharp focus, illustration, art by wlop, mars ravelo, greg rutkowski",
            inspiration_thumb: "assets/inspirations/insp_65.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 536900,
        },
        {
            inspiration_id: 66,
            prompt: "A photo of Pikachu in interstellar movie, cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d, hard surface modeling, 8k, render octane, inspired by beksinski",
            inspiration_thumb: "assets/inspirations/insp_66.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 195176,
        },
        {
            inspiration_id: 67,
            prompt: "Cute stylish pikachu dressed in stylish futuristic sportswear clothes, big sneakers and a futuristic glasses, cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d, hard surface modeling, 8k, render octane, inspired by beksinski",
            inspiration_thumb: "assets/inspirations/insp_67.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 362884,
        },
        {
            inspiration_id: 68,
            prompt: "A photo of Batman sitting on a roof looking down at a city below, extremely detailed, gotham, gloomy, dark",
            inspiration_thumb: "assets/inspirations/insp_68.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 540588,
        },
        {
            inspiration_id: 69,
            prompt: "Highly detailed, digital painting, atmospheric lighting, octane render, unreal engine, professional, eagle owl metal beak fantasy mystery sick,  cinematic, dramatic colors, close-up, cgscociety, computer rendering, by mike winkelmann, uhd, rendered in cinema4d, hard surface modeling, 8k,render octane, inspired by beksinski",
            inspiration_thumb: "assets/inspirations/insp_69.webp",
            style_id: 28,
            aspect_ratio: "1:1",
            seed: 462024,
        },
    ];
}
