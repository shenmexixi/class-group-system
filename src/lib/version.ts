/**
 * 版本信息
 * 用于确认部署版本
 */
export const VERSION = 'v1.1.0';
export const BUILD_TIME = new Date().toISOString().split('T')[0];
export const VERSION_INFO = `${VERSION} (${BUILD_TIME})`;
