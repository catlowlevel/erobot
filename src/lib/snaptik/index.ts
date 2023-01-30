import jwt from "jsonwebtoken";
interface FacebookResult {
    error: boolean;
    data: {
        id: null | string;
        link: null | string;
        title: string;
        des: string;
        thumbnail: string;
        sd?: string;
        hd?: string;
        mute: {
            [resolution: string]: string;
        };
        music: string;
        fi: string;
        audio_url: string;
    };
}

interface TiktokResult {
    status: string;
    aweme_id: string;
    thumbnail: string;
    name: string;
    auth_id: string;
    url: string;
    des: string;
    create_time: string;
    play_count: string;
    video_id: string;
    auth_avatar: string;
    video_link: string;
    music: string;
    dl: string;
    snapxcdn: string;
    original_video_link: string;
}

export class Snaptik {
    private TOKEN!: string;
    private BASE_URL = "https://api.snapx.info/v1";
    constructor() {
        this.TOKEN = this.generateJWT(10);
    }

    public facebook = async (url: string) => {
        console.log(`FACEBOOK : ${url}`);
        const fetchUrl = `${this.BASE_URL}/fb?url=${url}`;

        const json = await fetch(fetchUrl, {
            headers: {
                Host: "api.snapx.info",
                "content-type": "application/json; charset=utf-8",
                "x-app-id": "22062234009186",
                "x-app-token": this.TOKEN,
                "accept-encoding": "gzip",
                "user-agent": "okhttp/4.9.3",
            },
        }).then((r) => r.json());
        return json as FacebookResult;
    };
    public tiktok = async (url: string) => {
        console.log(`TIKTOK : ${url}`);
        const fetchUrl = `${this.BASE_URL}/tiktok?url=${url}`;
        console.log(fetchUrl);

        const json = (await fetch(fetchUrl, {
            headers: {
                Host: "api.snapx.info",
                "content-type": "application/json; charset=utf-8",
                "x-app-id": "22062234009186",
                "x-app-token": this.TOKEN,
                "accept-encoding": "gzip",
                "user-agent": "okhttp/4.9.3",
            },
        }).then((r) => r.json())) as TiktokResult;
        console.log(json);
        return json;
    };

    private checkTokenExpiry(token: string): boolean {
        if (!token) throw new Error("token is undefined!");
        // Decode the JWT to access the payload
        const payload = jwt.decode(token) as unknown as { exp: number };

        // Check if the "exp" claim is included in the payload
        if (payload && "exp" in payload) {
            // Calculate the current time in seconds since the Unix epoch
            const currentTime = Math.floor(Date.now() / 1000);

            // Return true if the current time is greater than or equal to the expiration time
            return currentTime >= payload.exp;
        } else {
            // If the "exp" claim is not included in the payload, the token is not expired
            return false;
        }
    }

    private generateJWT(expireTimeMinutes: number) {
        if (this.TOKEN && !this.checkTokenExpiry(this.TOKEN)) {
            console.log(`Token has not expired`);
            return this.TOKEN;
        }
        console.log("Generating new token!");

        const secretKey = "pkHlLyo2tCVDSA";

        // The claims of the JWT, which will be encoded in the token
        const claims = {
            exp: Math.floor(Date.now() / 1000) + expireTimeMinutes * 60, // Calculate the expiration time by adding the number of minutes to the current time in seconds
        };

        // Encode the claims using the secret key and return the JWT
        const token = jwt.sign(claims, secretKey, { algorithm: "HS256" });
        return token;
    }
}
