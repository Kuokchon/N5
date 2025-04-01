/**
 * redis.js - Redis缓存配置模块
 * 
 * 该模块负责创建和管理Redis缓存客户端连接
 * 提供了Redis不可用时的内存缓存备用方案
 * 封装了常用的缓存操作方法（get, set, setex, del等）
 */
const redis = require('redis');
const { promisify } = require('util');

/**
 * 创建一个内存缓存对象作为Redis不可用时的备用
 * 使用JavaScript的Map对象实现简单的键值存储
 */
const memoryCache = new Map();

/**
 * Redis客户端初始化
 * 全局变量用于跟踪Redis连接状态
 */
let client;
let isRedisAvailable = false;

/**
 * 尝试创建Redis客户端连接
 * 从环境变量读取连接参数，并设置重试策略
 */
try {
  client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    /**
     * 重试策略函数
     * 定义Redis连接失败时的重试行为
     * @param {Object} options - 重试选项对象
     * @returns {boolean|number} - false表示不再重试，数字表示重试等待时间（毫秒）
     */
    retry_strategy: function(options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        // 如果连接被拒绝，标记Redis为不可用，但不会抛出错误
        console.warn('Redis连接被拒绝，将使用内存缓存作为替代');
        isRedisAvailable = false;
        return false; // 不再重试
      }
      
      // 重试策略: 最多5次，每次等待时间加倍
      if (options.attempt > 5) {
        console.warn('Redis重试次数已达上限，将使用内存缓存作为替代');
        isRedisAvailable = false;
        return false; // 不再重试
      }
      
      // 重试时间指数退避，最长等待3秒
      return Math.min(options.attempt * 100, 3000);
    }
  });

  /**
   * Redis错误事件监听器
   * 当Redis连接发生错误时触发，将标记Redis为不可用
   */
  client.on('error', (err) => {
    console.error('Redis错误:', err);
    isRedisAvailable = false;
  });

  /**
   * Redis连接成功事件监听器
   * 当Redis连接成功建立时触发，将标记Redis为可用
   */
  client.on('connect', () => {
    console.log('Redis连接成功');
    isRedisAvailable = true;
  });
} catch (error) {
  console.warn('Redis初始化失败，将使用内存缓存作为替代:', error.message);
  isRedisAvailable = false;
  // 创建一个假的客户端对象，避免后续代码出错
  client = {
    get: (key, callback) => callback(null, null),
    set: (key, value, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) callback(null, 'OK');
    },
    setex: (key, seconds, value, callback) => {
      if (callback) callback(null, 'OK');
    },
    del: (key, callback) => {
      if (callback) callback(null, 1);
    },
    quit: () => Promise.resolve('OK')
  };
}

// 包装Redis方法，当Redis不可用时使用内存缓存
const get = async (key) => {
  try {
    if (isRedisAvailable) {
      return await promisify(client.get).bind(client)(key);
    } else {
      return memoryCache.get(key) || null;
    }
  } catch (error) {
    console.error('Redis读取失败，使用内存缓存:', error.message);
    return memoryCache.get(key) || null;
  }
};

const set = async (key, value) => {
  try {
    if (isRedisAvailable) {
      return await promisify(client.set).bind(client)(key, value);
    } else {
      memoryCache.set(key, value);
      return 'OK';
    }
  } catch (error) {
    console.error('Redis写入失败，使用内存缓存:', error.message);
    memoryCache.set(key, value);
    return 'OK';
  }
};

const setex = async (key, seconds, value) => {
  try {
    if (isRedisAvailable) {
      return await promisify(client.setex).bind(client)(key, seconds, value);
    } else {
      memoryCache.set(key, value);
      // 模拟过期：设置一个定时器删除缓存
      setTimeout(() => {
        memoryCache.delete(key);
      }, seconds * 1000);
      return 'OK';
    }
  } catch (error) {
    console.error('Redis设置失败，使用内存缓存:', error.message);
    memoryCache.set(key, value);
    return 'OK';
  }
};

const del = async (key) => {
  try {
    if (isRedisAvailable) {
      return await promisify(client.del).bind(client)(key);
    } else {
      return memoryCache.delete(key) ? 1 : 0;
    }
  } catch (error) {
    console.error('Redis删除失败，使用内存缓存:', error.message);
    return memoryCache.delete(key) ? 1 : 0;
  }
};

// 导出Redis客户端和包装后的方法
module.exports = {
  client,
  get,
  set,
  setex,
  del,
  quit: () => {
    if (isRedisAvailable) {
      return client.quit();
    }
    return Promise.resolve('OK');
  }
};