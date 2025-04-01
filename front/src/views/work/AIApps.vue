<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>AI应用管理</h1>
      <p>浏览和管理可用的AI应用</p>
    </div>
    
    <div class="dashboard-content">
      <div class="ai-apps-filter">
        <div class="filter-group">
          <label for="search-filter">搜索</label>
          <input 
            type="text" 
            id="search-filter" 
            v-model="filter.search" 
            placeholder="输入应用名称或描述"
          >
        </div>
        
        <div class="filter-group">
          <label for="category-filter">分类</label>
          <select id="category-filter" v-model="filter.category">
            <option value="all">全部</option>
            <option value="text">文本处理</option>
            <option value="image">图像处理</option>
            <option value="audio">音频处理</option>
          </select>
        </div>
        
        <button @click="applyFilters" class="filter-button">筛选</button>
      </div>
      
      <div class="ai-apps-list">
        <div v-if="loading" class="loading-spinner-container">
          <div class="loading-spinner"></div>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
          <button @click="fetchAIApps" class="retry-button">重试</button>
        </div>
        
        <div v-else>
          <div v-if="aiApps.length === 0" class="empty-message">
            暂无AI应用
          </div>
          
          <div v-else class="app-grid">
            <div 
              class="app-card" 
              v-for="app in aiApps" 
              :key="app.id"
              @click="viewAppDetails(app.id)"
            >
              <div class="app-icon">
                {{ app.icon || '🤖' }}
              </div>
              <div class="app-info">
                <h3 class="app-name">{{ app.name }}</h3>
                <p class="app-description">{{ app.description }}</p>
                <div class="app-meta">
                  <span class="app-category">{{ app.category }}</span>
                  <span class="app-price">{{ app.price }} 元/次</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const aiApps = ref([]);
const loading = ref(false);
const error = ref('');

const filter = ref({
  search: '',
  category: 'all'
});

const fetchAIApps = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // TODO: 调用API获取AI应用列表
    // 模拟数据
    aiApps.value = [
      {
        id: 1,
        name: '文本摘要',
        description: '自动生成文章摘要',
        category: 'text',
        price: 0.5,
        icon: '📝'
      },
      {
        id: 2,
        name: '图像风格转换',
        description: '将照片转换为艺术风格',
        category: 'image',
        price: 1.0,
        icon: '🎨'
      }
    ];
  } catch (err) {
    error.value = err.message || '获取AI应用失败';
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  fetchAIApps();
};

const viewAppDetails = (appId) => {
  router.push(`/ai-apps/${appId}`);
};

onMounted(() => {
  fetchAIApps();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  color: var(--text-color);
  transition: var(--theme-transition);
}

.dashboard-header {
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  padding: 0 20px;
}

.dashboard-header h1 {
  font-size: 2.4rem;
  margin-bottom: 12px;
  background: linear-gradient(45deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.dashboard-header p {
  color: var(--text-secondary, #666);
  font-size: 1.2rem;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
}

.ai-apps-filter {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: flex-end;
  flex-wrap: wrap;
  background-color: var(--card-bg, white);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 20px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  transition: all 0.3s ease;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary, #555);
  transition: var(--theme-transition);
}

.filter-group input,
.filter-group select {
  padding: 12px 16px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 15px;
  background-color: var(--color-bg, white);
  color: var(--text-primary, #333);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 52, 152, 219), 0.15);
}

.filter-button {
  padding: 12px 24px;
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
  position: relative;
  overflow: hidden;
  align-self: flex-end;
}

.filter-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.filter-button:hover::before {
  opacity: 1;
}

.filter-button:hover {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.filter-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.ai-apps-list {
  background-color: var(--card-bg, white);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 8px 20px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  transition: all 0.3s ease;
}

.loading-spinner-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--color-primary-rgb, 52, 152, 219), 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary, #3498db);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #e74c3c;
  text-align: center;
  padding: 30px 0;
  background-color: rgba(231, 76, 60, 0.05);
  border-radius: 12px;
  margin: 20px 0;
}

.retry-button {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.2);
}

.retry-button:hover {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.empty-message {
  text-align: center;
  padding: 50px 0;
  color: var(--text-secondary, #666);
  font-size: 16px;
  font-style: italic;
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  border-radius: 12px;
  border: 1px dashed var(--border-color, rgba(0, 0, 0, 0.1));
  margin: 20px 0;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.app-card {
  border: 1px solid var(--border-color, #eee);
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--card-bg, white);
  position: relative;
  overflow: hidden;
}

.app-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px var(--shadow-color, rgba(0, 0, 0, 0.15));
  border-color: var(--color-primary, #3498db);
}

.app-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.app-card:hover::before {
  opacity: 1;
}

.app-icon {
  font-size: 50px;
  text-align: center;
  margin-bottom: 15px;
  transition: transform 0.3s ease;
}

.app-card:hover .app-icon {
  transform: scale(1.1);
}

.app-info {
  text-align: center;
}

.app-name {
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--text-primary, #333);
  font-weight: 600;
  transition: color 0.3s ease;
}

.app-description {
  font-size: 15px;
  color: var(--text-secondary, #666);
  margin-bottom: 15px;
  line-height: 1.5;
}

.app-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
}

.app-category {
  color: var(--color-primary, #3498db);
  font-weight: 500;
  padding: 4px 10px;
  background-color: rgba(var(--color-primary-rgb, 52, 152, 219), 0.1);
  border-radius: 20px;
  font-size: 13px;
}

.app-price {
  font-weight: 700;
  color: #27ae60;
  padding: 4px 10px;
  background-color: rgba(39, 174, 96, 0.1);
  border-radius: 20px;
  font-size: 13px;
}
</style>