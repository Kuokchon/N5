<template>
  <div class="transaction-list">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载交易记录中...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-button" @click="$emit('retry')">重试</button>
    </div>
    
    <div v-else-if="transactions.length === 0" class="empty-state">
      <p>暂无交易记录</p>
    </div>
    
    <div v-else class="transaction-table-container">
      <table class="transaction-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>类型</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in transactions" :key="transaction.id">
            <td>{{ transaction.id }}</td>
            <td>
              <span 
                class="transaction-type" 
                :class="{'type-topup': transaction.type === 'topup', 'type-deduction': transaction.type === 'deduction'}"
              >
                {{ getTransactionTypeText(transaction.type) }}
              </span>
            </td>
            <td>
              <span 
                class="transaction-amount" 
                :class="{'amount-topup': transaction.type === 'topup', 'amount-deduction': transaction.type === 'deduction'}"
              >
                {{ transaction.type === 'topup' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
              </span>
            </td>
            <td>
              <span 
                class="transaction-status" 
                :class="{
                  'status-completed': transaction.status === 'completed',
                  'status-pending': transaction.status === 'pending',
                  'status-failed': transaction.status === 'failed'
                }"
              >
                {{ getTransactionStatusText(transaction.status) }}
              </span>
            </td>
            <td>{{ formatDateTime(transaction.created_at) }}</td>
            <td>
              <button class="details-button" @click="$emit('view-details', transaction.id)">
                详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="pagination" class="pagination">
        <button 
          class="pagination-button" 
          :disabled="currentPage === 1" 
          @click="$emit('page-change', currentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          class="pagination-button" 
          :disabled="currentPage === totalPages" 
          @click="$emit('page-change', currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatDateTime, getTransactionTypeText, getTransactionStatusText } from '../services/utils';

defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  pagination: {
    type: Object,
    default: null
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
});

defineEmits(['retry', 'view-details', 'page-change']);
</script>

<style scoped>
.transaction-list {
  width: 100%;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 12px;
  padding: 6px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.transaction-table-container {
  overflow-x: auto;
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
}

.transaction-table th {
  background-color: #f5f7fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #ddd;
}

.transaction-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  color: #444;
}

.transaction-type, .transaction-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-topup {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.type-deduction {
  background-color: #fff8e1;
  color: #f57c00;
}

.transaction-amount {
  font-weight: 600;
}

.amount-topup {
  color: #2e7d32;
}

.amount-deduction {
  color: #f57c00;
}

.status-completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-pending {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-failed {
  background-color: #ffebee;
  color: #c62828;
}

.details-button {
  padding: 4px 8px;
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #555;
  cursor: pointer;
  font-size: 12px;
}

.details-button:hover {
  background-color: #3498db;
  border-color: #3498db;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
}

.pagination-button {
  padding: 6px 12px;
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #555;
  cursor: pointer;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button:hover:not(:disabled) {
  background-color: #e8eaed;
}

.page-info {
  margin: 0 12px;
  color: #666;
}
</style> 