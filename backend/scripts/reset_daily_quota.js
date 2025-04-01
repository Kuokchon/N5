/**
 * 每日免费额度重置定时任务
 * 
 * 此脚本负责在每日凌晨自动重置所有用户的免费额度
 * 推荐在每天凌晨00:01通过cron job运行
 * 
 * crontab 配置示例:
 * 1 0 * * * /usr/bin/node /path/to/reset_daily_quota.js >> /path/to/logs/quota_reset.log 2>&1
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const daily_free_quota_model = require('../models/daily_free_quota_model');

async function reset_daily_quotas() {
  console.log(`[${new Date().toISOString()}] 开始重置每日免费额度...`);
  
  try {
    // 调用模型的重置方法
    const reset_count = await daily_free_quota_model.reset_all_daily_quota();
    
    console.log(`[${new Date().toISOString()}] 重置完成，共处理 ${reset_count} 个用户的免费额度`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 重置免费额度失败:`, error);
    process.exit(1);
  }
}

// 执行重置
reset_daily_quotas(); 