/**
 * 操作日志模型
 * 
 * 处理管理员操作日志记录、查询和统计等功能
 */

const pool = require('../config/mysql');

// 创建操作日志
async function create_log(logData) {
  const { 
    admin_id, 
    admin_username, 
    action, 
    resource_type, 
    resource_id = null, 
    details = {} 
  } = logData;
  
  try {
    const [result] = await pool.query(
      `INSERT INTO operation_logs (
        admin_id, 
        admin_username, 
        action, 
        resource_type, 
        resource_id, 
        details, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        admin_id, 
        admin_username, 
        action, 
        resource_type, 
        resource_id, 
        JSON.stringify(details)
      ]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('创建操作日志错误:', error);
    throw error;
  }
}

// 获取操作日志列表
async function get_logs(page = 1, limit = 20, filters = {}) {
  const offset = (page - 1) * limit;
  let query = `
    SELECT 
      l.id, 
      l.admin_id, 
      l.admin_username, 
      l.action, 
      l.resource_type, 
      l.resource_id, 
      l.details, 
      l.created_at,
      u.email as admin_email,
      u.admin_role as admin_role
    FROM 
      operation_logs l
    LEFT JOIN 
      users u ON l.admin_id = u.id AND u.is_admin = TRUE
  `;
  
  // 添加过滤条件
  const conditions = [];
  const params = [];
  
  if (filters.admin_id) {
    conditions.push('l.admin_id = ?');
    params.push(filters.admin_id);
  }
  
  if (filters.action) {
    conditions.push('l.action = ?');
    params.push(filters.action);
  }
  
  if (filters.resource_type) {
    conditions.push('l.resource_type = ?');
    params.push(filters.resource_type);
  }
  
  if (filters.resource_id) {
    conditions.push('l.resource_id = ?');
    params.push(filters.resource_id);
  }
  
  if (filters.start_date) {
    conditions.push('l.created_at >= ?');
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    conditions.push('l.created_at <= ?');
    params.push(filters.end_date);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  // 添加排序和分页
  query += ' ORDER BY l.created_at DESC LIMIT ?, ?';
  params.push(offset, limit);
  
  // 计算总数
  let countQuery = 'SELECT COUNT(*) as total FROM operation_logs l';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  
  try {
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params.slice(0, params.length - 2));
    
    // 格式化日志详情（JSON字符串转对象）
    const formattedRows = rows.map(row => {
      try {
        // 如果details是字符串，尝试解析
        if (typeof row.details === 'string') {
          row.details = JSON.parse(row.details);
        }
      } catch (e) {
        // 如果解析失败，保持原样
        console.error('解析日志详情失败:', e);
      }
      return row;
    });
    
    return {
      items: formattedRows,
      total: countResult[0].total,
      page: page,
      limit: limit,
      total_pages: Math.ceil(countResult[0].total / limit)
    };
  } catch (error) {
    console.error('获取操作日志列表错误:', error);
    throw error;
  }
}

// 获取指定ID的操作日志
async function get_log_by_id(id) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        l.id, 
        l.admin_id, 
        l.admin_username, 
        l.action, 
        l.resource_type, 
        l.resource_id, 
        l.details, 
        l.created_at,
        u.email as admin_email,
        u.admin_role as admin_role
      FROM 
        operation_logs l
      LEFT JOIN 
        users u ON l.admin_id = u.id AND u.is_admin = TRUE
      WHERE 
        l.id = ?`,
      [id]
    );
    
    if (!rows.length) {
      return null;
    }
    
    const log = rows[0];
    
    // 格式化日志详情（JSON字符串转对象）
    try {
      if (typeof log.details === 'string') {
        log.details = JSON.parse(log.details);
      }
    } catch (e) {
      console.error('解析日志详情失败:', e);
    }
    
    return log;
  } catch (error) {
    console.error('获取操作日志详情错误:', error);
    throw error;
  }
}

// 获取按操作类型分组的统计信息
async function get_action_statistics(filters = {}) {
  let query = `
    SELECT 
      action, 
      COUNT(*) as count
    FROM 
      operation_logs
  `;
  
  // 添加过滤条件
  const conditions = [];
  const params = [];
  
  if (filters.admin_id) {
    conditions.push('admin_id = ?');
    params.push(filters.admin_id);
  }
  
  if (filters.start_date) {
    conditions.push('created_at >= ?');
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    conditions.push('created_at <= ?');
    params.push(filters.end_date);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' GROUP BY action ORDER BY count DESC';
  
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('获取操作类型统计错误:', error);
    throw error;
  }
}

// 获取管理员操作统计
async function get_admin_statistics(filters = {}) {
  let query = `
    SELECT 
      l.admin_id, 
      l.admin_username, 
      COUNT(*) as operation_count,
      MAX(l.created_at) as last_operation_time,
      u.email as admin_email,
      u.admin_role as admin_role
    FROM 
      operation_logs l
    LEFT JOIN 
      users u ON l.admin_id = u.id AND u.is_admin = TRUE
  `;
  
  // 添加过滤条件
  const conditions = [];
  const params = [];
  
  if (filters.start_date) {
    conditions.push('l.created_at >= ?');
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    conditions.push('l.created_at <= ?');
    params.push(filters.end_date);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' GROUP BY l.admin_id, l.admin_username ORDER BY operation_count DESC';
  
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('获取管理员统计错误:', error);
    throw error;
  }
}

// 获取最近操作日志（用于仪表板）
async function get_recent_logs(limit = 10) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        l.id, 
        l.admin_id, 
        l.admin_username, 
        l.action, 
        l.resource_type, 
        l.resource_id, 
        l.details, 
        l.created_at,
        u.email as admin_email,
        u.admin_role as admin_role
      FROM 
        operation_logs l
      LEFT JOIN 
        users u ON l.admin_id = u.id AND u.is_admin = TRUE
      ORDER BY 
        l.created_at DESC 
      LIMIT ?`,
      [limit]
    );
    
    // 格式化日志详情（JSON字符串转对象）
    const formattedRows = rows.map(row => {
      try {
        if (typeof row.details === 'string') {
          row.details = JSON.parse(row.details);
        }
      } catch (e) {
        console.error('解析日志详情失败:', e);
      }
      return row;
    });
    
    return formattedRows;
  } catch (error) {
    console.error('获取最近操作日志错误:', error);
    throw error;
  }
}

// 删除指定时间前的日志（用于定期清理）
async function delete_old_logs(beforeDate) {
  try {
    const [result] = await pool.query(
      'DELETE FROM operation_logs WHERE created_at < ?',
      [beforeDate]
    );
    
    return result.affectedRows;
  } catch (error) {
    console.error('删除旧日志错误:', error);
    throw error;
  }
}

module.exports = {
  create_log,
  get_logs,
  get_log_by_id,
  get_action_statistics,
  get_admin_statistics,
  get_recent_logs,
  delete_old_logs
};