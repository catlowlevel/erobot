import { ROOT_DIR } from "../..";
import { LowDB } from "../../core/LowDB";
import { LoginData, AccountData, OtpData } from "./types";

type DBType = { [id: string]: LoginData[] };

export class Bimatri {
    db: LowDB<DBType>;
    constructor() {
        ////this.requestOtp(NOHP).then(() => {
        ////console.log("done");
        ////});
        ////this.loginOtp(NOHP, "243802").then(() => {
        ////console.log("DONE");
        ////});
        //const data = readFileSync("login.json", { encoding: "utf-8" });
        //const loginData: LoginData = JSON.parse(data);
        //this.accountData(NOHP, loginData).then(() => {
        //console.log("Done ");
        //});
        this.db = new LowDB<DBType>(`${ROOT_DIR}/json/bimatri.json`, {});
    }

    async accountData(loginData: LoginData) {
        const url = "https://bima.tri.co.id/apibima/profile/profile";
        const { accessToken, appsflyerMsisdn, balance, creditLimit, profileColor, profileTime, status, ...rest } =
            loginData;
        const response = await fetch(url, {
            headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + loginData.accessToken,
            },
            //payload["imei"] = "WebSelfcare"
            //payload["language"] = data["language"]
            //payload["callPlan"] = data["callPlan"]
            //payload["msisdn"] = data["msisdn"]
            //payload["secretKey"] = data["secretKey"]
            //payload["subscriberType"] = data["subscriberType"]
            //payload["lastId"] = 0
            body: JSON.stringify({
                imei: "WebSelfcare",
                ...rest,
            }),
            method: "POST",
        });
        if (response.status !== 200) throw new Error("Gagal mendapatkan data Akun!, " + response.statusText);

        const result = (await response.json()) as AccountData;
        return result;
    }

    async requestOtp(nohp: string) {
        const url = "https://bima.tri.co.id/apibima/login/otp-request";
        const response = await fetch(url, {
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                imei: "WebSelfcare",
                msisdn: nohp,
            }),
            method: "POST",
        });
        if (response.status !== 200) throw new Error("Gagal meminta OTP!, " + response.statusText);

        const result = (await response.json()) as OtpData;
        if (!result.status) throw new Error("Terjadi kesalahan!" + " " + result.message);

        return true;
    }

    async loginOtp(nohp: string, otp: string) {
        const url = "https://bima.tri.co.id/apibima/login/login-with-otp";
        const response = await fetch(url, {
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                imei: "WebSelfcare",
                msisdn: nohp,
                otp: otp,
            }),
            method: "POST",
        });
        if (response.status !== 200) throw new Error("Gagal login OTP!");
        const result = (await response.json()) as any;
        if (!result.status) throw new Error("Terjadi kesalahan!" + " " + result.message);

        return result as LoginData;
    }
}
