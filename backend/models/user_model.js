const pool = require('../config/mysql');
const bcrypt = require('bcryptjs');

/**
 * 用户模型 - 处理用户相关的数据库操作
 */
const user_model = {
  // 创建新用户
  async create_user(username, email, password) {
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. 插入用户记录
      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      
      const userId = userResult.insertId;
      
      // 2. 创建会员卡，有效期为1年
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await connection.query(
        'INSERT INTO member_cards (user_id, expired_at) VALUES (?, ?)',
        [userId, expiryDate]
      );
      
      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // 通过邮箱查找用户
  async find_by_email(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },
  
  // 通过用户名查找用户
  async find_by_username(username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  },
  
  // 通过ID查找用户
  async find_by_id(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, bio, phone, wechat, avatar_url, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },
  
  // 验证用户密码
  async verify_password(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  
  /**
   * 更新用户简介
   * 
   * @param {number} userId - 用户ID
   * @param {string} bio - 用户简介
   * @returns {Promise<boolean>} - 更新结果
   */
  async update_bio(userId, bio) {
    const [result] = await pool.query(
      'UPDATE users SET bio = ? WHERE id = ?',
      [bio, userId]
    );
    return result.affectedRows > 0;
  },
  
  /**
   * 更新用户密码
   * 
   * @param {number} userId - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} - 更新结果
   */
  async update_password(userId, newPassword) {
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    return result.affectedRows > 0;
  },
  
  /**
   * 绑定手机号
   * 
   * @param {number} userId - 用户ID
   * @param {string} phone - 手机号
   * @returns {Promise<boolean>} - 绑定结果
   */
  async bind_phone(userId, phone) {
    // 检查手机号是否已被其他用户绑定
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND id != ?',
      [phone, userId]
    );
    
    if (existingRows.length > 0) {
      throw new Error('该手机号已被其他用户绑定');
    }
    
    const [result] = await pool.query(
      'UPDATE users SET phone = ? WHERE id = ?',
      [phone, userId]
    );
    return result.affectedRows > 0;
  },
  
  /**
   * 绑定微信
   * 
   * @param {number} userId - 用户ID
   * @param {string} wechat - 微信账号
   * @returns {Promise<boolean>} - 绑定结果
   */
  async bind_wechat(userId, wechat) {
    // 检查微信账号是否已被其他用户绑定
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE wechat = ? AND id != ?',
      [wechat, userId]
    );
    
    if (existingRows.length > 0) {
      throw new Error('该微信账号已被其他用户绑定');
    }
    
    const [result] = await pool.query(
      'UPDATE users SET wechat = ? WHERE id = ?',
      [wechat, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = user_model;