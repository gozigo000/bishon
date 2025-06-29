// 실행환경 확인
export function isDev() { return process.env.NODE_ENV === 'development'; }
export function isTest() { return process.env.NODE_ENV === 'test'; }
export function isProd() { return process.env.NODE_ENV === 'production'; }
