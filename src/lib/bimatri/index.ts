import { ROOT_DIR } from "../..";
import { LowDB } from "../../core/LowDB";
import { Utils } from "../../helper/utils";
import { AccountData, Data, LoginData, OtpData, ProductData } from "./types";

type DBType = { [id: string]: LoginData[] };

export class Bimatri {
    db: LowDB<DBType>;
    utils = new Utils();
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
    async beliPaket(loginData: LoginData, product: ProductData) {
        const url = `https://bimaplus.tri.co.id/api/v1/purchase/purchase-product`;
        const data = {
            addonMenuCategory: "",
            addonMenuSubCategory: "",
            balance: Number(this.utils.extractNumber(loginData.balance)),
            callPlan: loginData.callPlan,
            deviceManufactur: "Xiaomi",
            deviceModel: "M2102J20SG",
            deviceOs: "Android",
            imei: "Android 4cfda44f4da0e587",
            language: 0,
            menuCategory: "",
            menuCategoryName: "",
            menuIdSource: "",
            menuSubCategory: "",
            menuSubCategoryName: "",
            msisdn: loginData.msisdn,
            paymentMethod: "00",
            productAddOnId: "",
            productId: product.product.productId,
            productName: product.product.productName,
            secretKey: loginData.secretKey,
            servicePlan: product.product.vendorList[0].priceList[0].planName,
            sms: true,
            subscriberType: loginData.subscriberType,
            totalProductPrice: Number(product.product.productPrice),
            utm: "",
            utmCampaign: "",
            utmContent: "",
            utmMedium: "",
            utmSource: "",
            utmTerm: "",
            vendorId: "11",
        };
        console.log("data :>> ", data);
        const response = await fetch(url, {
            headers: {
                "content-type": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "User-Agent": "okhttp/4.9.0",
                Host: "bimaplus.tri.co.id",
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
        const result = (await response.json()) as LoginData | Data;
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
