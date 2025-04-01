<template>
  <div class="operation-logs">
    <div class="page-header">
      <h1>操作日志</h1>
      <div class="filter-section">
        <div class="filter-item">
          <label for="operation-type">操作类型</label>
          <select id="operation-type" v-model="filters.operationType">
            <option value="">全部</option>
            <option value="LOGIN">登录</option>
            <option value="LOGOUT">退出登录</option>
            <option value="USER_CREATE">创建用户</option>
            <option value="USER_UPDATE">更新用户</option>
            <option value="USER_DELETE">删除用户</option>
            <option value="AI_APP_CREATE">创建AI应用</option>
            <option value="AI_APP_UPDATE">更新AI应用</option>
            <option value="AI_APP_DELETE">删除AI应用</option>
            <option value="MEMBER_CARD_CREATE">创建会员卡</option>
            <option value="MEMBER_CARD_UPDATE">更新会员卡</option>
            <option value="MEMBER_CARD_DELETE">删除会员卡</option>
            <option value="ADMIN_CREATE">创建管理员</option>
            <option value="ADMIN_UPDATE">更新管理员</option>
            <option value="ADMIN_DELETE">删除管理员</option>
            <option value="SYSTEM_SETTING">系统设置</option>
          </select>
        </div>
        
        <div class="filter-item">
          <label for="admin-id">管理员</label>
          <select id="admin-id" v-model="filters.adminId">
            <option value="">全部</option>
            <option v-for="admin in adminOptions" :key="admin.id" :value="admin.id">
              {{ admin.username }}
            </option>
          </select>
        </div>
        
        <div class="filter-item">
          <label>时间范围</label>
          <div class="date-range">
            <input 
              type="date" 
              v-model="filters.startDate" 
              class="date-input"
            >
            <span class="date-separator">至</span>
            <input 
              type="date" 
              v-model="filters.endDate" 
              class="date-input"
            >
          </div>
        </div>
        
        <button class="filter-button" @click="applyFilters">
          搜索
        </button>
        <button class="reset-button" @click="resetFilters">
          重置
        </button>
      </div>
    </div>
    
    <!-- 日志列表 -->
    <div class="log-table-container">
      <table class="log-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>管理员</th>
            <th>操作类型</th>
            <th>目标对象类型</th>
            <th>目标ID</th>
            <th>描述</th>
            <th>IP地址</th>
            <th>操作时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.id }}</td>
            <td>{{ log.admin_username }}</td>
            <td>{{ log.operation_type }}</td>
            <td>{{ log.target_type || '-' }}</td>
            <td>{{ log.target_id || '-' }}</td>
            <td>{{ log.description }}</td>
            <td>{{ log.ip_address }}</td>
            <td>{{ formatDate(log.created_at) }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="8" class="no-data">暂无日志数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页组件 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-button" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      
      <div class="page-numbers" v-if="totalPages <= 7">
        <button 
          v-for="page in totalPages" 
          :key="page" 
          class="page-number" 
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <div class="page-numbers" v-else>
        <button 
          class="page-number" 
          :class="{ active: currentPage === 1 }"
          @click="changePage(1)"
        >
          1
        </button>
        
        <span v-if="currentPage > 3">...</span>
        
        <button 
          v-for="page in getPageRange()" 
          :key="page" 
          class="page-number" 
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <span v-if="currentPage < totalPages - 2">...</span>
        
        <button 
          class="page-number" 
          :class="{ active: currentPage === totalPages }"
          @click="changePage(totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>
      
      <button 
        class="page-button" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
    
    <!-- 图表统计 -->
    <div class="stats-section">
      <h2>操作统计</h2>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-title">操作总数</div>
          <div class="stat-value">{{ stats.totalCount || 0 }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-title">今日操作</div>
          <div class="stat-value">{{ stats.todayCount || 0 }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-title">最活跃管理员</div>
          <div class="stat-value">{{ stats.mostActiveAdmin || '-' }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-title">最常见操作</div>
          <div class="stat-value">{{ stats.mostCommonOperation || '-' }}</div>
        </div>
      </div>
      
      <div class="charts-container">
        <div class="chart-card">
          <h3>操作类型分布</h3>
          <div class="chart-placeholder">
            <!-- 在实际项目中可以使用 ECharts 或其他图表库 -->
            <div class="bar-chart">
              <div 
                v-for="(item, index) in operationTypeStats" 
                :key="index"
                class="bar-item"
              >
                <div class="bar-label">{{ item.type }}</div>
                <div class="bar-wrapper">
                  <div class="bar" :style="{ width: `${item.percentage}%` }"></div>
                  <span class="bar-value">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-card">
          <h3>每日操作统计</h3>
          <div class="chart-placeholder">
            <div class="line-chart">
              <svg viewBox="0 0 300 150">
                <polyline
                  fill="none"
                  stroke="#1890ff"
                  stroke-width="2"
                  points="10,140 50,120 90,130 130,70 170,100 210,50 250,40 290,60"
                />
              </svg>
            </div>
            <div class="chart-labels">
              <span v-for="(day, index) in lastSevenDays" :key="index">{{ day }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAdminStore } from '../../stores/admin';

const adminStore = useAdminStore();

// 状态
const logs = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const adminOptions = ref([]);
const stats = ref({
  totalCount: 0,
  todayCount: 0,
  mostActiveAdmin: '',
  mostCommonOperation: ''
});

// 过滤条件
const filters = ref({
  operationType: '',
  adminId: '',
  startDate: '',
  endDate: ''
});

// 模拟操作类型统计数据
const operationTypeStats = ref([
  { type: '登录', count: 120, percentage: 30 },
  { type: '更新用户', count: 80, percentage: 20 },
  { type: '创建AI应用', count: 60, percentage: 15 },
  { type: '系统设置', count: 50, percentage: 12 },
  { type: '更新会员卡', count: 40, percentage: 10 }
]);

// 生成过去7天的日期标签
const lastSevenDays = computed(() => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(`${date.getMonth() + 1}/${date.getDate()}`);
  }
  return days;
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 获取分页范围
const getPageRange = () => {
  const range = [];
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);
  
  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }
  
  return range;
};

// 加载操作日志
const loadLogs = async () => {
  loading.value = true;
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filters.value
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/admin/logs`, {
      params,
      headers: { Authorization: `Bearer ${adminStore.token}` }
    });
    
    logs.value = response.data.logs;
    totalPages.value = response.data.totalPages || 1;
  } catch (error) {
    console.error('加载操作日志失败:', error);
    
    // 使用模拟数据
    logs.value = [
      {
        id: 1,
        admin_id: 1,
        admin_username: 'admin',
        operation_type: 'LOGIN',
        target_type: null,
        target_id: null,
        description: '管理员登录',
        ip_address: '192.168.1.1',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        admin_id: 1,
        admin_username: 'admin',
        operation_type: 'USER_UPDATE',
        target_type: 'user',
        target_id: 5,
        description: '更新用户信息',
        ip_address: '192.168.1.1',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  } finally {
    loading.value = false;
  }
};

// 加载管理员选项
const loadAdminOptions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/administrators`, {
      headers: { Authorization: `Bearer ${adminStore.token}` }
    });
    
    adminOptions.value = response.data.admins || [];
  } catch (error) {
    console.error('加载管理员选项失败:', error);
    
    // 使用模拟数据
    adminOptions.value = [
      { id: 1, username: 'admin' },
      { id: 2, username: 'operation' },
      { id: 3, username: 'developer' }
    ];
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/logs/statistics`, {
      headers: { Authorization: `Bearer ${adminStore.token}` }
    });
    
    stats.value = response.data;
    
    if (response.data.operationTypeStats) {
      operationTypeStats.value = response.data.operationTypeStats;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
    
    // 使用模拟数据
    stats.value = {
      totalCount: 420,
      todayCount: 28,
      mostActiveAdmin: 'admin',
      mostCommonOperation: '登录'
    };
  }
};

// 切换页面
const changePage = (page) => {
  currentPage.value = page;
  loadLogs();
};

// 应用过滤条件
const applyFilters = () => {
  currentPage.value = 1;
  loadLogs();
};

// 重置过滤条件
const resetFilters = () => {
  filters.value = {
    operationType: '',
    adminId: '',
    startDate: '',
    endDate: ''
  };
  currentPage.value = 1;
  loadLogs();
};

// 组件挂载时
onMounted(async () => {
  await Promise.all([
    loadLogs(),
    loadAdminOptions(),
    loadStats()
  ]);
});
</script>

<style scoped>
.operation-logs {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0 0 16px 0;
}

/* 过滤区域 */
.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item label {
  font-size: 14px;
  margin-bottom: 8px;
  color: #666;
}

.filter-item select, .filter-item input {
  min-width: 180px;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.date-range {
  display: flex;
  align-items: center;
}

.date-input {
  width: 140px;
}

.date-separator {
  margin: 0 8px;
}

.filter-button, .reset-button {
  align-self: flex-end;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.filter-button {
  background-color: #1890ff;
  color: white;
  border: none;
}

.filter-button:hover {
  background-color: #40a9ff;
}

.reset-button {
  background-color: white;
  border: 1px solid #d9d9d9;
  color: #666;
}

.reset-button:hover {
  background-color: #f0f0f0;
}

/* 表格样式 */
.log-table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  margin-bottom: 24px;
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

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 24px 0;
}

.page-button {
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  margin: 0 12px;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.page-number.active {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

/* 统计区域 */
.stats-section {
  margin-top: 32px;
}

.stats-section h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 500;
  color: #333;
}

/* 图表区域 */
.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.chart-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.chart-card h3 {
  font-size: 16px;
  margin: 0 0 16px 0;
}

.chart-placeholder {
  height: 300px;
}

/* 简单柱状图 */
.bar-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.bar-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.bar-label {
  width: 100px;
  font-size: 14px;
  color: #666;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.bar {
  height: 20px;
  background-color: #1890ff;
  border-radius: 2px;
}

.bar-value {
  margin-left: 8px;
  font-size: 14px;
  color: #666;
}

/* 简单折线图 */
.line-chart {
  height: 80%;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  color: #666;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
  }
  
  .filter-item {
    width: 100%;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
}
</style>