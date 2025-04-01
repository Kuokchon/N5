<template>
  <div class="topup-container">
    <div class="dashboard-header">
      <h1>賬戶充值</h1>
      <p>為您的賬戶添加餘額</p>
    </div>
    
    <div class="topup-card">
      
      <form @submit.prevent="handleTopUp" class="login-form">
        <div class="form-group">
          <label for="amount">充值金額</label>
          <input 
            type="number" 
            id="amount" 
            v-model="amount" 
            placeholder="請輸入充值金額" 
            required
            :disabled="loading"
            min="1"
          >
        </div>
        
        <div class="form-group">
          <label>支付方式</label>
          <div class="payment-methods">
            <label v-for="method in paymentMethods" :key="method.value">
              <input 
                type="radio" 
                v-model="selectedMethod" 
                :value="method.value"
                :disabled="loading"
                required
              >
              {{ method.label }}
            </label>
          </div>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="loading || !amount || !selectedMethod"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '處理中...' : '立即充值' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const amount = ref('');
const selectedMethod = ref('');
const paymentMethods = ref([
  { value: 'alipay', label: '支付寶' },
  { value: 'wechat', label: '微信支付' },
  { value: 'bank', label: '銀行卡' }
]);
const loading = ref(false);
const error = ref('');
const router = useRouter();

const handleTopUp = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // TODO: 調用充值API
    
    // 充值成功後跳轉到交易記錄頁面
    router.push('/transactions');
  } catch (err) {
    error.value = err.message || '充值失敗，請重試';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.topup-container {
  width: 100%;
}

.dashboard-header {
  margin-bottom: 30px;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 2.2rem;
  margin-bottom: 10px;
  color: var(--text-color);
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.dashboard-header p {
  color: #666;
  font-size: 1.1rem;
  opacity: 0.8;
}

.topup-card {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 30px;
  background-color: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.login-form {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary, #555);
  transition: var(--theme-transition);
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 10px;
  font-size: 15px;
  background-color: var(--color-bg, white);
  color: var(--text-primary, #333);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 52, 152, 219), 0.15);
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 5px 0;
}

.payment-methods label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.payment-methods label:hover {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.03));
  border-color: var(--border-color, #ddd);
}

.payment-methods input[type="radio"] {
  accent-color: var(--color-primary, #3498db);
  width: 18px;
  height: 18px;
}

.error-message {
  margin-bottom: 20px;
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  background-color: rgba(231, 76, 60, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 3px solid #e74c3c;
}

.login-button {
  width: 100%;
  padding: 14px;
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.login-button::before {
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

.login-button:hover:not(:disabled)::before {
  opacity: 1;
}

.login-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.login-button:disabled {
  background-color: var(--silver-gray, #ccc);
  cursor: not-allowed;
  box-shadow: none;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>