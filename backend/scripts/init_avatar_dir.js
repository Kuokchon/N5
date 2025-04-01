/**
 * 头像存储目录初始化脚本
 * 
 * 此脚本用于初始化用户头像存储的目录结构
 * 包括创建必要的文件夹和复制默认头像
 */

const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');

// 头像存储目录
const AVATAR_DIR = path.join(__dirname, '../public/avatars');
// 默认头像路径
const DEFAULT_AVATAR_PATH = path.join(__dirname, '../public/default-avatar.png');

/**
 * 创建头像存储目录
 */
async function createAvatarDirectory() {
  try {
    await fs.access(AVATAR_DIR);
    console.log('头像存储目录已存在:', AVATAR_DIR);
  } catch (error) {
    console.log('创建头像存储目录:', AVATAR_DIR);
    await fs.mkdir(AVATAR_DIR, { recursive: true });
  }
}

/**
 * 检查默认头像是否存在，如果不存在则创建一个简单的占位头像
 */
async function createDefaultAvatar() {
  try {
    await fs.access(DEFAULT_AVATAR_PATH);
    console.log('默认头像已存在:', DEFAULT_AVATAR_PATH);
  } catch (error) {
    console.log('创建默认头像:', DEFAULT_AVATAR_PATH);
    
    // 创建公共目录（如果不存在）
    const publicDir = path.join(__dirname, '../public');
    try {
      await fs.access(publicDir);
    } catch (error) {
      await fs.mkdir(publicDir, { recursive: true });
    }
    
    // 使用canvas创建一个简单的默认头像
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 256, 256);
    
    // 人形图标
    ctx.fillStyle = '#cccccc';
    // 头部
    ctx.beginPath();
    ctx.arc(128, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    // 身体
    ctx.beginPath();
    ctx.moveTo(78, 190);
    ctx.lineTo(178, 190);
    ctx.quadraticCurveTo(138, 120, 78, 190);
    ctx.fill();
    
    // 保存为PNG
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(DEFAULT_AVATAR_PATH, buffer);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 创建头像存储目录
    await createAvatarDirectory();
    
    // 创建默认头像
    await createDefaultAvatar();
    
    console.log('头像系统初始化完成!');
  } catch (error) {
    console.error('头像系统初始化失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 