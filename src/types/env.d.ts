declare global {
  namespace NodeJS {
    interface ProcessEnv {
      COINDAR_ACCESSTOKEN: string;
      COINDAR_BASE_URL_API: string;
    }
  }
}

export {}
