/**
 * 管理员用户模型
 * 
 * 处理管理员用户的数据库操作，包括创建、验证、查询和权限管理
 * 支持从用户表中获取管理员信息
 */

const db = require('../config/mysql');
const bcrypt = require('bcryptjs');

// 管理员角色枚举
const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',    // 超级管理员（可访问所有功能）
  OPERATION_ADMIN: 'operation',  // 运营管理员（会员管理和内容审核权限）
  DEVELOPER: 'developer'         // 开发者（AI应用和API配置权限）
};

// 获取管理员列表
async function get_admin_list(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;
  let query = 'SELECT id, username, email, admin_role as role, admin_created_at as last_login_time, created_at FROM users WHERE is_admin = TRUE';
  
  // 添加过滤条件
  const conditions = [];
  const params = [];
  
  if (filters.role) {
    conditions.push('admin_role = ?');
    params.push(filters.role);
  }
  
  if (filters.search) {
    conditions.push('(username LIKE ? OR email LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  
  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }
  
  // 添加排序和分页
  query += ' ORDER BY created_at DESC LIMIT ?, ?';
  params.push(offset, limit);
  
  // 计算总数
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_admin = TRUE';
  if (conditions.length > 0) {
    countQuery += ' AND ' + conditions.join(' AND ');
  }
  
  try {
    const [rows] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, params.slice(0, params.length - 2));
    
    return {
      items: rows,
      total: countResult[0].total,
      page: page,
      limit: limit,
      total_pages: Math.ceil(countResult[0].total / limit)
    };
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    throw error;
  }
}

// 通过ID获取管理员
async function get_admin_by_id(id) {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, admin_role as role, admin_created_at as last_login_time, created_at FROM users WHERE id = ? AND is_admin = TRUE',
      [id]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('按ID获取管理员错误:', error);
    throw error;
  }
}

// 通过用户名获取管理员
async function get_admin_by_username(username) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? AND is_admin = TRUE',
      [username]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('按用户名获取管理员错误:', error);
    throw error;
  }
}

// 创建新管理员（或将现有用户提升为管理员）
async function create_admin(adminData) {
  const { username, password, email, role } = adminData;
  
  // 验证角色是否有效
  if (!Object.values(ADMIN_ROLES).includes(role)) {
    throw new Error(`无效的管理员角色: ${role}`);
  }
  
  try {
    // 检查用户是否已存在
    const [userRows] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (userRows.length > 0) {
      // 用户已存在，更新为管理员
      const user = userRows[0];
      
      // 如果提供了新密码，则更新密码
      let passwordUpdate = '';
      let updateParams = [role, user.id];
      
      if (password) {
        // 密码加密
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        passwordUpdate = ', password = ?';
        updateParams = [role, passwordHash, user.id];
      }
      
      // 更新用户为管理员
      await db.query(
        `UPDATE users 
         SET is_admin = TRUE, 
             admin_role = ?, 
             admin_created_at = NOW()
             ${passwordUpdate}
         WHERE id = ?`,
        updateParams
      );
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: role,
        is_new: false
      };
    } else {
      // 创建新用户，并设置为管理员
      // 密码加密
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // 插入新管理员记录
      const [result] = await db.query(
        `INSERT INTO users (username, password, email, is_admin, admin_role, admin_created_at, created_at)
         VALUES (?, ?, ?, TRUE, ?, NOW(), NOW())`,
        [username, passwordHash, email, role]
      );
      
      return {
        id: result.insertId,
        username,
        email,
        role,
        is_new: true
      };
    }
  } catch (error) {
    console.error('创建管理员错误:', error);
    throw error;
  }
}

// 更新管理员信息
async function update_admin(id, updateData) {
  const allowedFields = ['email', 'admin_role'];
  const fieldMapping = {
    'email': 'email',
    'role': 'admin_role'
  };
  
  const updates = [];
  const values = [];
  
  // 构建更新字段
  for (const field in updateData) {
    if (allowedFields.includes(field) || field === 'role') {
      const dbField = fieldMapping[field] || field;
      updates.push(`${dbField} = ?`);
      values.push(updateData[field]);
    }
  }
  
  // 如果提供了新密码，则更新密码
  if (updateData.password) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(updateData.password, saltRounds);
    updates.push('password = ?');
    values.push(passwordHash);
  }
  
  if (updates.length === 0) {
    return false; // 没有要更新的字段
  }
  
  // 添加ID到参数列表
  values.push(id);
  
  try {
    const [result] = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND is_admin = TRUE`,
      values
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('更新管理员错误:', error);
    throw error;
  }
}

// 删除管理员（降级为普通用户）
async function delete_admin(id) {
  try {
    const [result] = await db.query(
      'UPDATE users SET is_admin = FALSE, admin_role = NULL WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('删除管理员错误:', error);
    throw error;
  }
}

// 验证管理员凭据
async function verify_admin_credentials(login_id, password) {
  try {
    console.log(`嘗試驗證管理員憑證: login_id=${login_id}`);
    
    if (!login_id || !password) {
      console.log('驗證失敗: 用戶名或密碼為空');
      return null;
    }
    
    // 構建查詢條件，支持多種登錄方式
    let query = `
      SELECT id, username, email, password, admin_role as role 
      FROM users 
      WHERE is_admin = TRUE AND (username = ? OR email = ?)
    `;
    let params = [login_id, login_id];
    
    // 檢查是否為數字（可能是手機號）
    if (/^\d+$/.test(login_id)) {
      // 如果手機號欄位存在，則添加到查詢條件中
      try {
        // 檢查users表是否有phone欄位
        const [columns] = await db.query('SHOW COLUMNS FROM users LIKE ?', ['phone']);
        if (columns.length > 0) {
          query = `
            SELECT id, username, email, password, admin_role as role 
            FROM users 
            WHERE is_admin = TRUE AND (username = ? OR email = ? OR phone = ?)
          `;
          params = [login_id, login_id, login_id];
          console.log('支持手機號登錄');
        }
      } catch (e) {
        console.log('檢查手機欄位失敗，僅支持用戶名和郵箱登錄', e.message);
      }
    }
    
    console.log('執行查詢:', query.replace(/\s+/g, ' '));
    const [rows] = await db.query(query, params);
    
    if (!rows.length) {
      console.log('驗證失敗: 未找到管理員用戶');
      return null; // 用户不存在或不是管理员
    }
    
    const admin = rows[0];
    console.log(`找到管理員用戶: ${admin.username} (${admin.email}), 角色: ${admin.role}`);
    
    // 驗證密碼是否為空
    if (!admin.password) {
      console.log('驗證失敗: 密碼哈希為空');
      return null;
    }
    
    // 验证密码
    try {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      console.log(`密碼驗證結果: ${passwordMatch ? '成功' : '失敗'}`);
      
      if (!passwordMatch) {
        return null; // 密码不匹配
      }
      
      // 更新最后登录时间
      await db.query(
        'UPDATE users SET admin_created_at = NOW() WHERE id = ?',
        [admin.id]
      );
      
      // 返回管理员信息（不包括密码哈希）
      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      };
    } catch (e) {
      console.error('密碼驗證過程中出錯:', e);
      throw new Error('密碼驗證失敗: ' + e.message);
    }
  } catch (error) {
    console.error('验证管理员凭据错误:', error);
    throw error;
  }
}

// 将普通用户提升为管理员
async function promote_user_to_admin(userId, role) {
  if (!Object.values(ADMIN_ROLES).includes(role)) {
    throw new Error(`无效的管理员角色: ${role}`);
  }
  
  try {
    const [result] = await db.query(
      'UPDATE users SET is_admin = TRUE, admin_role = ?, admin_created_at = NOW() WHERE id = ?',
      [role, userId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('提升用户为管理员错误:', error);
    throw error;
  }
}

// 检查用户是否为管理员
async function is_admin(userId) {
  try {
    const [rows] = await db.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    return rows.length > 0 && rows[0].is_admin === 1;
  } catch (error) {
    console.error('检查用户管理员状态错误:', error);
    return false;
  }
}

// 检查管理员权限
function has_permission(adminRole, requiredRole) {
  // 超级管理员可以访问所有功能
  if (adminRole === ADMIN_ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // 运营管理员可以访问会员管理和内容审核
  if (adminRole === ADMIN_ROLES.OPERATION_ADMIN) {
    const operationPermissions = ['member_management', 'content_review'];
    return operationPermissions.includes(requiredRole);
  }
  
  // 开发者可以访问AI应用和API配置
  if (adminRole === ADMIN_ROLES.DEVELOPER) {
    const developerPermissions = ['ai_app_management', 'api_configuration'];
    return developerPermissions.includes(requiredRole);
  }
  
  return false;
}

module.exports = {
  ADMIN_ROLES,
  get_admin_list,
  get_admin_by_id,
  get_admin_by_username,
  create_admin,
  update_admin,
  delete_admin,
  verify_admin_credentials,
  has_permission,
  promote_user_to_admin,
  is_admin
};