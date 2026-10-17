export const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("زمان اتصال تمام شد")), ms))]);
