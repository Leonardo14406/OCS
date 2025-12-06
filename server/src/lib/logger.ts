export const logger = {
  info: (data: any, message: string) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (data: any, message: string) => {
    console.error(`[ERROR] ${message}`, data);
  },
  warn: (data: any, message: string) => {
    console.warn(`[WARN] ${message}`, data);
  },
  debug: (data: any, message: string) => {
    console.debug(`[DEBUG] ${message}`, data);
  }
};
