<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>欢迎使用管理控制台，{{ admin?.username }}</h1>
      <p class="last-login" v-if="admin?.last_login_time">
        上次登录时间: {{ formatDate(admin.last_login_time) }}
      </p>
    </div>
    
    <!-- 数据概览卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon users-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.userCount || 0 }}</div>
          <div class="stat-label">用户总数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon apps-icon">🤖</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.appCount || 0 }}</div>
          <div class="stat-label">AI应用数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon members-icon">💳</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.memberCount || 0 }}</div>
          <div class="stat-label">会员数量</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon revenue-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatNumber(stats.totalRevenue || 0) }}</div>
          <div class="stat-label">总收入</div>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="chart-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>近7天用户活跃度</h3>
        </div>
        <div class="chart-placeholder">
          <div class="chart-mock">
            <div v-for="(value, index) in mockUserActivityData" :key="index" 
                class="chart-bar" 
                :style="{ height: `${value}%` }">
            </div>
          </div>
          <div class="chart-labels">
            <span v-for="(day, index) in lastSevenDays" :key="index">{{ day }}</span>
          </div>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>收入趋势</h3>
        </div>
        <div class="chart-placeholder">
          <div class="chart-mock line-chart">
            <svg viewBox="0 0 300 150">
              <polyline
                fill="none"
                stroke="#1890ff"
                stroke-width="2"
                points="0,120 50,100 100,110 150,90 200,60 250,40 300,30"
              />
            </svg>
          </div>
          <div class="chart-labels">
            <span v-for="(month, index) in lastSixMonths" :key="index">{{ month }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快捷操作区 -->
    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="action-buttons">
        <router-link to="/admin/users" class="action-button" v-if="hasPermission('manage_users')">
          <span class="action-icon">👥</span>
          <span>管理用户</span>
        </router-link>
        
        <router-link to="/admin/ai-apps" class="action-button" v-if="hasPermission('manage_ai_apps')">
          <span class="action-icon">🤖</span>
          <span>管理AI应用</span>
        </router-link>
        
        <router-link to="/admin/member-cards" class="action-button" v-if="hasPermission('manage_member_cards')">
          <span class="action-icon">💳</span>
          <span>管理会员卡</span>
        </router-link>
        
        <router-link to="/admin/transactions" class="action-button" v-if="hasPermission('view_transactions')">
          <span class="action-icon">💰</span>
          <span>查看交易</span>
        </router-link>
        
        <router-link to="/admin/logs" class="action-button" v-if="hasPermission('view_logs')">
          <span class="action-icon">📝</span>
          <span>查看日志</span>
        </router-link>
      </div>
    </div>
    
    <!-- 最近操作日志 -->
    <div class="recent-logs" v-if="hasPermission('view_logs')">
      <h2>最近操作日志</h2>
      <div class="log-table-container">
        <table class="log-table">
          <thead>
            <tr>
              <th>管理员</th>
              <th>操作类型</th>
              <th>描述</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, index) in recentLogs" :key="index">
              <td>{{ log.admin_username }}</td>
              <td>{{ log.operation_type }}</td>
              <td>{{ log.description }}</td>
              <td>{{ formatDate(log.created_at) }}</td>
            </tr>
            <tr v-if="recentLogs.length === 0">
              <td colspan="4" class="no-data">暂无操作日志</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const adminStore = useAdminStore();

// 管理员信息
const admin = computed(() => adminStore.getAdmin);

// 统计数据
const stats = ref({
  userCount: 0,
  appCount: 0,
  memberCount: 0,
  totalRevenue: 0
});

// 最近操作日志
const recentLogs = ref([]);

// 检查权限
const hasPermission = (permission) => {
  return adminStore.hasPermission(permission);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化数字
const formatNumber = (num) => {
  return num.toLocaleString('zh-CN');
};

// 生成过去7天的日期标签
const lastSevenDays = computed(() => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.getDate().toString()); // 只显示日期
  }
  return days;
});

// 生成过去6个月的月份标签
const lastSixMonths = computed(() => {
  const months = [];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    months.push(monthNames[monthIndex]);
  }
  
  return months;
});

// 模拟用户活跃度数据
const mockUserActivityData = [65, 59, 80, 81, 56, 75, 90];

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${adminStore.token}`
      }
    });
    
    stats.value = response.data.stats;
    
    // 如果API可用，使用真实数据，否则使用模拟数据
    if (response.data.recentLogs) {
      recentLogs.value = response.data.recentLogs;
    } else {
      // 模拟数据
      recentLogs.value = [
        {
          admin_username: '管理员',
          operation_type: '登录',
          description: '管理员登录系统',
          created_at: new Date().toISOString()
        },
        {
          admin_username: '管理员',
          operation_type: '更新用户',
          description: '更新用户信息',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    
    // 使用模拟数据
    stats.value = {
      userCount: 1256,
      appCount: 15,
      memberCount: 328,
      totalRevenue: 128600
    };
    
    recentLogs.value = [
      {
        admin_username: '管理员',
        operation_type: '登录',
        description: '管理员登录系统',
        created_at: new Date().toISOString()
      },
      {
        admin_username: '管理员',
        operation_type: '更新用户',
        description: '更新用户信息',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadDashboardData();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.last-login {
  color: #666;
  font-size: 14px;
}

/* 统计卡片样式 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 32px;
  margin-right: 16px;
  padding: 12px;
  border-radius: 50%;
  background-color: rgba(24, 144, 255, 0.1);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 图表区域样式 */
.chart-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-mock {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 10px;
}

.chart-bar {
  width: 30px;
  background-color: #1890ff;
  border-radius: 4px 4px 0 0;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
}

.line-chart {
  flex: 1;
}

/* 快捷操作区样式 */
.quick-actions {
  margin-bottom: 24px;
}

.quick-actions h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.action-button {
  text-decoration: none;
  color: #333;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s;
  width: 120px;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 最近操作日志样式 */
.recent-logs {
  margin-bottom: 24px;
}

.recent-logs h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
}

.log-table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th, .log-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.log-table th {
  background-color: #fafafa;
  font-weight: 500;
}

.log-table tr:last-child td {
  border-bottom: none;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 24px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .chart-section {
    grid-template-columns: 1fr;
  }
}
</style>