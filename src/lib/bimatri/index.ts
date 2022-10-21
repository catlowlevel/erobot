import { ROOT_DIR } from "../..";
import { LowDB } from "../../core/LowDB";
import { AccountData, Data, LoginData, OtpData, ProductData } from "./types";

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
    async beliPaket(loginData: LoginData, productId: string) {
        const url = `https://bimaplus.tri.co.id/api/v1/purchase/purchase-product`;
        const data = {
            addonMenuCategory: "",
            addonMenuSubCategory: "",
            balance: "",
            callPlan: loginData.callPlan,
            deviceManufactur: "Samsung",
            deviceModel: "SMG991B",
            deviceOs: "Android",
            imei: "Android 93488a982824b403",
            language: 0,
            menuCategory: "3",
            menuCategoryName: "TriProduct",
            menuIdSource: "",
            menuSubCategory: "",
            menuSubCategoryName: "",
            msisdn: loginData.msisdn,
            paymentMethod: "00",
            productAddOnId: "",
            productId: productId,
            secretKey: loginData.secretKey,
            servicePlan: "Default",
            sms: true,
            subscriberType: "Prepaid",
            totalProductPrice: "",
            utm: "",
            utmCampaign: "",
            utmContent: "",
            utmMedium: "",
            utmSource: "",
            utmTerm: "",
            vendorId: "11",
        };
        const response = await fetch(url, {
            headers: {
                "content-type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        });
        const json = await response.json();
        return json;
    }

    async checkProduct(productId: string) {
        console.log(`Checking product id : ${productId}`);

        const data = JSON.stringify({
            imei: "WebSelfcare",
            language: "",
            callPlan: "",
            msisdn: "",
            secretKey: "",
            subscriberType: "",
            productId: productId,
        });
        const response = await fetch(`https://my.tri.co.id/apibima/product/product-detail`, {
            headers: {
                "content-type": "application/json",
            },
            method: "POST",
            body: data,
        });
        const product = (await response.json()) as ProductData;
        return product;
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
    async logout(loginData: LoginData) {
        const url = "https://bima.tri.co.id/apibima/login/logout";
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

        const result = (await response.json()) as OtpData | Data;
        if (!result.status) throw new Error("Terjadi kesalahan!" + " " + result.message);
        console.log("result", result);
        return loginData;
    }
}
