/**
 * 配置文件 - 包含API基础URL等常量
 */

export const API_BASE_URL = 'http://localhost:3000';

export const DEFAULT_TIMEOUT = 15000;

export const AUTH_HEADER_NAME = 'Authorization';

// 其他应用配置常量
export const APP_CONFIG = {
  title: 'AI应用平台',
  version: '1.0.0',
  debug: process.env.NODE_ENV !== 'production'
};