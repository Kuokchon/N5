<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>交易記錄</h1>
      <p>查看您的充值和使用記錄</p>
    </div>
    
    <div class="dashboard-content">
      <div class="transactions-filter">
        <div class="filter-group">
          <label for="type-filter">交易類型</label>
          <select id="type-filter" v-model="filter.type">
            <option value="all">全部</option>
            <option value="topup">充值</option>
            <option value="consumption">消費</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-filter">日期範圍</label>
          <input type="date" id="date-filter" v-model="filter.startDate">
          <span>至</span>
          <input type="date" id="date-filter-end" v-model="filter.endDate">
        </div>
        
        <button @click="applyFilters" class="filter-button">篩選</button>
      </div>
      
      <div class="transactions-list">
        <div v-if="loading" class="loading-spinner-container">
          <div class="loading-spinner"></div>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
          <button @click="fetchTransactions" class="retry-button">重試</button>
        </div>
        
        <div v-else>
          <div v-if="transactions.length === 0" class="empty-message">
            暫無交易記錄
          </div>
          
          <div v-else>
            <div class="transaction-item" v-for="transaction in transactions" :key="transaction.id">
              <div class="transaction-info">
                <div class="transaction-type" :class="transaction.type">
                  {{ transaction.type === 'topup' ? '充值' : '消費' }}
                </div>
                <div class="transaction-amount">
                  {{ transaction.amount }} 元
                </div>
              </div>
              
              <div class="transaction-details">
                <div class="transaction-date">
                  {{ formatDate(transaction.created_at) }}
                </div>
                <div class="transaction-description">
                  {{ transaction.description }}
                </div>
              </div>
            </div>
            
            <div class="pagination">
              <button 
                @click="prevPage" 
                :disabled="currentPage === 1"
                class="pagination-button"
              >
                上一頁
              </button>
              
              <span class="page-info">
                第 {{ currentPage }} 頁 / 共 {{ totalPages }} 頁
              </span>
              
              <button 
                @click="nextPage" 
                :disabled="currentPage === totalPages"
                class="pagination-button"
              >
                下一頁
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const transactions = ref([]);
const loading = ref(false);
const error = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalPages = ref(1);

const filter = ref({
  type: 'all',
  startDate: '',
  endDate: ''
});

const fetchTransactions = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // TODO: 調用API獲取交易記錄
    // 模拟数据
    transactions.value = [
      {
        id: 1,
        type: 'topup',
        amount: 100,
        description: '支付寶充值',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        type: 'consumption',
        amount: 50,
        description: 'AI應用使用',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    totalPages.value = Math.ceil(transactions.value.length / itemsPerPage.value);
  } catch (err) {
    error.value = err.message || '獲取交易記錄失敗';
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  fetchTransactions();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchTransactions();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchTransactions();
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

onMounted(() => {
  fetchTransactions();
});
</script>

<style scoped>
.dashboard-container {
  padding: 30px 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-color);
  transition: var(--theme-transition);
}

.dashboard-header {
  margin-bottom: 40px;
  text-align: center;
  position: relative;
}

.dashboard-header h1 {
  font-size: 2.4rem;
  margin-bottom: 12px;
  background: linear-gradient(45deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.dashboard-header p {
  color: var(--text-secondary, #666);
  font-size: 1.2rem;
  opacity: 0.8;
}

.transactions-filter {
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

.filter-group select,
.filter-group input {
  padding: 12px 16px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 15px;
  background-color: var(--color-bg, white);
  color: var(--text-primary, #333);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.filter-group select:focus,
.filter-group input:focus {
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

.transactions-list {
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
  padding: 50px 0;
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

.transaction-item {
  padding: 20px;
  border-bottom: 1px solid var(--border-color, #eee);
  transition: all 0.3s ease;
  border-radius: 12px;
  margin-bottom: 10px;
}

.transaction-item:hover {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--shadow-color, rgba(0, 0, 0, 0.05));
}

.transaction-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}

.transaction-type {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.transaction-type.topup {
  color: #27ae60;
  background-color: rgba(39, 174, 96, 0.1);
  border: 1px solid rgba(39, 174, 96, 0.2);
}

.transaction-type.consumption {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.transaction-amount {
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary, #333);
}

.transaction-details {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin-top: 5px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
}

.pagination-button {
  padding: 10px 20px;
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.2);
  position: relative;
  overflow: hidden;
}

.pagination-button::before {
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

.pagination-button:hover:not(:disabled)::before {
  opacity: 1;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.pagination-button:disabled {
  background-color: var(--silver-gray, #ccc);
  cursor: not-allowed;
  box-shadow: none;
}

.page-info {
  font-size: 15px;
  color: var(--text-secondary, #555);
  font-weight: 500;
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  padding: 8px 16px;
  border-radius: 8px;
}
</style>