// Generated by https://quicktype.io

export interface Data {
    message: string;
    status: false;
}

export interface OtpData {
    message: string;
    status: true;
}

// Generated by https://quicktype.io

export interface LoginData {
    profileTime: number;
    secretKey: string;
    subscriberType: string;
    language: string;
    accessToken: string;
    appsflyerMsisdn: string;
    callPlan: string;
    balance: string;
    creditLimit: string;
    msisdn: string;
    profileColor: string;
    status: true;
}
// Generated by https://quicktype.io

export interface AccountData {
    balanceOnNet: string;
    profileName: string;
    lastLogin: string;
    profileTime: number;
    balanceTotal: string;
    dueDateHybrid: string;
    dukcapilName: string;
    firstLogin: string;
    profileHobby: string;
    dueDate: string;
    callPlan: string;
    sumOfBonuses: SumOfBonuses;
    balance: string;
    balanceDetails: BalanceDetails;
    creditLimit: string;
    msisdn: string;
    profileColor: string;
    balanceOffNet: string;
    balanceTrims: string;
    dukcapilUrl: string;
    email: string;
    customerSegmentation: CustomerSegmentation;
    statusSubscription: boolean;
    packageProductList: unknown[];
    activePackages: null;
    subscriberType: string;
    emailHybrid: string;
    birthDate: null;
    packageList: PackageList[];
    cashback: string;
    profilePicture: string;
    packageProductGroupList: null;
    balanceOnAndOffNet: string;
    maxPullNotification: number;
    validity: string;
    creditLimitHybrid: string;
    status: true;
}

interface BalanceDetails {
    balance: Balance;
    balanceOnNet: BalanceOnNet;
    balanceOffnet: BalanceOffnet;
    balanceOnAndOffNet: null;
}

interface Balance {
    title: string;
    value: string;
}

interface BalanceOffnet {
    detail: BalanceOffnetDetail;
    title: string;
    value: string;
}

interface BalanceOffnetDetail {
    "Sisa Pulsa": string;
}

interface BalanceOnNet {
    detail: BalanceOnNetDetail;
    title: string;
    value: string;
}

interface BalanceOnNetDetail {
    "Masa Berlaku": string;
    "Sisa Pulsa": string;
}

interface CustomerSegmentation {
    segmentationName: string;
    title: string;
    description: string;
    deeplink: null;
}

interface PackageList {
    isRenewable: boolean;
    isProductBuy: boolean;
    isMore: boolean;
    isShareQuota: boolean;
    name: string;
    linkProductBuyType: string;
    linkProductBuyValue: string;
    productId: null;
    detail: DetailElement[];
    groupId: string;
}

interface DetailElement {
    validity: string;
    value: string;
    valueOriginal: null;
}

interface SumOfBonuses {
    Data: string;
    Voice: string;
    SMS: string;
}

export interface ProductData {
    rfu: boolean;
    product: Product;
    status: true;
}

interface Product {
    productId: string;
    productName: string;
    productPrice: string;
    productOriginalPrice: string;
    productDescription: string;
    productOtherInfo: null;
    productHowTo: string;
    productPricing: string;
    productDetailsType: string;
    productDetails: unknown;
    labelDescription: string;
    labelHowTo: string;
    labelPricing: string;
    labelDetails: string;
    labelOtherInfo: string;
    buttonBuy: string;
    bonstriPoints: null;
    productRating: number;
    productRatingTotalUser: number;
    categoryId: null;
    paymentMatrix: number[];
    isRedirectToLink: boolean;
    redirectLink: string;
    isDownloadLink: boolean;
    downloadLink: string;
    metadata: { [key: string]: string };
    vendorList: VendorList[];
    paymentList: PaymentList[];
    isInappBrowser: null;
    isTransferable: number;
    isShareable: number;
    isAutoRenewable: number;
    deeplink: null;
    campaign: number;
    tagDetail: null;
    flagUrl: null;
    flagType: null;
    isArticle: boolean;
    isBanner: boolean;
    subMenuCategoryId: null;
    articleTitle: null;
    articleBody: null;
    articleLayout: null;
    isSquareBanner: null;
    productLayout: null;
    isInstallment: null;
    isRedemption: boolean;
    basePackage: null;
    partnerId: null;
    isProductRedirection: boolean;
    isGamePartner: boolean;
}

interface PaymentList {
    methodCode: string;
    methodName: string;
    rest: boolean;
}

// interface ProductDetails {}

interface VendorList {
    vendorId: number;
    vendorName: string;
    priceList: PriceList[];
}

interface PriceList {
    planName: string;
    price: string;
}
