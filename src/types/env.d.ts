declare global {
  namespace NodeJS {
    interface ProcessEnv {
      COINDAR_ACCESSTOKEN: string;
      COINDAR_BASE_URL_API: string;
      BITLY_ACCESS_TOKEN: string;
      BITLY_BASE_URL: string;
      BINANCE_APIKEY: string;
      BINANCE_APISECRET: string;
      REMOVEBG_APIKEY: string;
      MONGO_URI: string;
      BETA_CHARA_AI_TOKEN: string;
    }
  }
}

export {}
