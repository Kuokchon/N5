/**
 * 用户头像模型
 * 
 * 本模块负责处理用户头像相关操作，包括：
 * 1. 上传和保存用户头像
 * 2. 获取用户头像信息
 * 3. 维护头像历史记录
 * 4. 清理旧头像文件
 */

const pool = require('../config/mysql');
const redis_client = require('../config/redis');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// 头像存储目录
const AVATAR_DIR = path.join(__dirname, '../public/avatars');
// 头像CDN基础URL（如果使用CDN的话）
const AVATAR_BASE_URL = process.env.AVATAR_CDN_URL || '';
// 默认头像路径
const DEFAULT_AVATAR = '/default-avatar.png';
// 允许的文件类型
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// 最大文件大小（2MB）
const MAX_FILE_SIZE = 2 * 1024 * 1024;
// 头像尺寸
const AVATAR_SIZE = 256;

const user_avatar_model = {
  /**
   * 初始化头像存储目录
   */
  async init() {
    try {
      await fs.access(AVATAR_DIR);
    } catch (error) {
      // 目录不存在，创建它
      await fs.mkdir(AVATAR_DIR, { recursive: true });
    }
  },
  
  /**
   * 上传头像
   * 
   * @param {number} user_id - 用户ID
   * @param {Object} file - 上传的文件对象 (multer提供)
   * @returns {Promise<Object>} - 头像信息
   */
  async upload_avatar(user_id, file) {
    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('不支持的文件类型，请上传JPG或PNG图片');
    }
    
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('文件太大，最大支持2MB');
    }
    
    // 确保目录存在
    await this.init();
    
    // 生成唯一文件名
    const filename = `u${user_id}_${uuidv4()}.jpg`;
    const filepath = path.join(AVATAR_DIR, filename);
    
    // 使用sharp处理图片
    await sharp(file.buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);
    
    // 生成头像URL
    const avatar_url = `${AVATAR_BASE_URL}/avatars/${filename}`;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 获取用户当前的头像URL
      const [userRows] = await connection.query(
        'SELECT avatar_url FROM users WHERE id = ?',
        [user_id]
      );
      
      if (!userRows.length) {
        throw new Error('用户不存在');
      }
      
      const old_avatar_url = userRows[0].avatar_url;
      
      // 添加到历史记录
      if (old_avatar_url && old_avatar_url !== DEFAULT_AVATAR) {
        await connection.query(
          'INSERT INTO user_avatars_history (user_id, avatar_url) VALUES (?, ?)',
          [user_id, old_avatar_url]
        );
      }
      
      // 更新用户头像
      await connection.query(
        'UPDATE users SET avatar_url = ?, avatar_updated_at = NOW() WHERE id = ?',
        [avatar_url, user_id]
      );
      
      await connection.commit();
      
      // 清除缓存
      await redis_client.del(`user_${user_id}`);
      
      // 异步清理旧文件（不等待完成）
      if (old_avatar_url && old_avatar_url !== DEFAULT_AVATAR) {
        this.clean_old_avatar(old_avatar_url).catch(err => {
          console.error('清理旧头像文件失败:', err);
        });
      }
      
      return {
        avatar_url,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      await connection.rollback();
      
      // 清理临时创建的文件
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        console.error('清理临时头像文件失败:', unlinkError);
      }
      
      throw error;
    } finally {
      connection.release();
    }
  },
  
  /**
   * 获取用户头像信息
   * 
   * @param {number} user_id - 用户ID
   * @returns {Promise<Object>} - 头像信息
   */
  async get_avatar(user_id) {
    // 检查users表中是否存在avatar_url字段
    try {
      const [rows] = await pool.query(
        'SELECT avatar_url, avatar_updated_at FROM users WHERE id = ?',
        [user_id]
      );
      
      if (!rows.length) {
        throw new Error('用户不存在');
      }
      
      return {
        avatar_url: rows[0].avatar_url || DEFAULT_AVATAR,
        updated_at: rows[0].avatar_updated_at
      };
    } catch (error) {
      // 如果avatar_url字段不存在，使用备用查询
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('avatar_url字段不存在，使用备用查询');
        const [rows] = await pool.query(
          'SELECT id FROM users WHERE id = ?',
          [user_id]
        );
        
        if (!rows.length) {
          throw new Error('用户不存在');
        }
        
        return {
          avatar_url: DEFAULT_AVATAR,
          updated_at: null
        };
      }
      throw error;
    }
  },
  
  /**
   * 获取用户头像历史记录
   * 
   * @param {number} user_id - 用户ID
   * @returns {Promise<Array>} - 头像历史记录
   */
  async get_avatar_history(user_id) {
    const [rows] = await pool.query(
      'SELECT avatar_url, created_at FROM user_avatars_history WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    
    return rows;
  },
  
  /**
   * 清理旧头像文件
   * 
   * @param {string} avatar_url - 头像URL
   * @returns {Promise<void>}
   */
  async clean_old_avatar(avatar_url) {
    if (!avatar_url || avatar_url === DEFAULT_AVATAR) {
      return;
    }
    
    // 提取文件名
    const filename = path.basename(avatar_url);
    const filepath = path.join(AVATAR_DIR, filename);
    
    try {
      await fs.access(filepath);
      await fs.unlink(filepath);
    } catch (error) {
      console.error(`无法删除旧头像 ${filepath}:`, error);
    }
  }
};

module.exports = user_avatar_model;