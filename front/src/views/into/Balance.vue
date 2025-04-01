<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>賬戶餘額</h1>
      <p>查看您的賬戶信息和餘額</p>
    </div>
    
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加載中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <i class="error-icon">!</i>
      <p>{{ error }}</p>
    </div>
    <div v-else class="dashboard-content">
      <div class="member-card-section">
        <h2><i class="section-icon card-icon"></i>會員卡信息</h2>
        <MemberCard 
          :balance="memberCard?.balance" 
          :status="memberCard?.status"
          :expiryDate="memberCard?.expired_at"
          :createDate="memberCard?.created_at"
          :username="user?.username"
          :freeBalance="freeBalance"
          :freeLimit="dailyFreeLimit"
          :showFreeQuota="hasFreeQuota"
        />
        
        <div class="card-actions">
          <router-link to="/topup" class="btn btn-primary">
            <i class="btn-icon topup-icon"></i>充值
          </router-link>
        </div>
      </div>
      
      <div class="free-quota-settings" v-if="hasFreeQuota">
        <h2><i class="section-icon quota-icon"></i>每日免費額度設置</h2>
        <div class="setting-form">
          <div class="form-group">
            <label for="dailyFreeLimit">每日免費額度 (元)</label>
            <input 
              type="number" 
              id="dailyFreeLimit"
              v-model="newFreeLimit"
              :min="0" 
              :max="maxFreeLimit"
              step="0.1"
              class="form-control"
            />
            <small>設置每日可用的免費額度上限，0 表示不啟用</small>
          </div>
          
          <button 
            class="btn btn-secondary" 
            @click="updateFreeQuota"
            :disabled="isUpdating"
          >
            <i class="btn-icon update-icon"></i>{{ isUpdating ? '更新中...' : '更新設置' }}
          </button>
        </div>
        
        <div class="free-quota-info">
          <div class="quota-stat">
            <span class="quota-label">今日已使用:</span>
            <span class="quota-value">{{ formatCurrency(freeQuotaUsed) }}</span>
          </div>
          <div class="quota-stat">
            <span class="quota-label">今日剩餘:</span>
            <span class="quota-value highlight">{{ formatCurrency(freeBalance) }}</span>
          </div>
          <div class="quota-progress">
            <div class="progress-bar" :style="{width: quotaUsedPercentage + '%'}"></div>
          </div>
          <p class="note">* 免費額度每日凌晨自動重置</p>
        </div>
      </div>
      
      <div class="recent-transactions">
        <h2><i class="section-icon transaction-icon"></i>最近交易</h2>
        <TransactionList :limit="5" />
        <div class="view-all">
          <transactions/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import MemberCard from '../../components/MemberCard.vue';
import TransactionList from '../../components/TransactionList.vue';
import { formatCurrency, saveUserToLocalStorage } from '../../services/utils';
import { useRouter } from 'vue-router';
import store from '../../services/store'; // 直接導入store模塊
import { useUserStore } from '../../stores/user';
import transactions from '../into/Transactions.vue'

const vuexStore = useStore();
const router = useRouter();
const isUpdating = ref(false);
const newFreeLimit = ref(0);
const maxFreeLimit = ref(50); // 最大可設置的免費額度
const isLoading = ref(true);
const error = ref(null);

// 從store中獲取用戶和會員卡信息
const user = computed(() => {
  try {
    return vuexStore.state ? vuexStore.state.user : store.state().user;
  } catch (e) {
    console.error('獲取用戶信息異常:', e);
    return null;
  }
});

const memberCard = computed(() => {
  try {
    return vuexStore.state ? vuexStore.state.memberCard : store.state().memberCard;
  } catch (e) {
    console.error('獲取會員卡信息異常:', e);
    return null;
  }
});

const dailyFreeLimit = computed(() => vuexStore.getters ? vuexStore.getters.dailyFreeLimit : 0);
const freeBalance = computed(() => vuexStore.getters ? vuexStore.getters.freeBalance : 0);
const freeQuotaUsed = computed(() => vuexStore.getters ? vuexStore.getters.freeQuotaUsed : 0);
const hasFreeQuota = computed(() => vuexStore.getters ? vuexStore.getters.hasFreeQuota : false);

// 计算免费额度使用百分比
const quotaUsedPercentage = computed(() => {
  if (!dailyFreeLimit.value || dailyFreeLimit.value <= 0) return 0;
  const percentage = (freeQuotaUsed.value / dailyFreeLimit.value) * 100;
  return Math.min(percentage, 100); // 确保不超过100%
});

// 頁面加載時獲取數據
onMounted(async () => {
  try {
    console.log('Balance頁面初始化...');
    isLoading.value = true;
    
    // 使用Pinia獲取用戶信息
    const userStore = useUserStore();
    
    // 檢查登錄狀態
    if (localStorage.getItem('token')) {
      console.log('Balance: 檢測到token，嘗試加載用戶信息');
      
      // 同時從多個來源嘗試獲取用戶數據
      const piniaLoadPromise = userStore.loadUser();
      const vuexLoadPromise = vuexStore.dispatch('fetchUser').catch(err => {
        console.log('Vuex加載用戶失敗:', err);
        return null;
      });
      
      // 等待任意一個加載完成
      await Promise.race([piniaLoadPromise, vuexLoadPromise]);
      
      console.log('用戶數據加載狀態:');
      console.log('- Pinia用戶:', userStore.user);
      console.log('- Vuex用戶:', vuexStore.state ? vuexStore.state.user : null);
      console.log('- Store用戶:', store.getUser());
      
      // 檢查是否有用戶數據
      const hasUserData = userStore.user || 
                          (vuexStore.state && vuexStore.state.user) || 
                          store.getUser();
      
      if (!hasUserData) {
        console.error('所有數據源均無法獲取用戶數據');
        error.value = '無法加載用戶數據，請嘗試重新登錄';
        isLoading.value = false;
        return;
      }
    } else {
      console.log('Balance: 未檢測到token，可能未登錄');
      error.value = '請先登錄';
      router.push('/login?redirect=/balance');
      isLoading.value = false;
      return;
    }
    
    // 繼續加載會員卡等信息
    try {
      console.log('正在加載會員卡信息...');
      if (!vuexStore.state.memberCard) {
        await vuexStore.dispatch('fetchMemberCard');
      }
      console.log('會員卡信息加載完成:', memberCard.value);
    } catch (cardErr) {
      console.error('加載會員卡信息錯誤:', cardErr);
      // 非阻止性錯誤，繼續執行
    }
    
    // 获取每日免费额度信息
    try {
      console.log('正在加載每日免費額度信息...');
      await vuexStore.dispatch('fetchFreeQuota');
      console.log('免費額度信息加載完成');
    } catch (quotaErr) {
      console.error('加載免費額度信息錯誤:', quotaErr);
      // 非阻止性錯誤，繼續執行
    }
    
    // 初始化表单值
    newFreeLimit.value = dailyFreeLimit.value || 0;
    console.log('Balance初始化完成');
    isLoading.value = false;
  } catch (err) {
    console.error('Balance初始化失敗:', err);
    error.value = '加載數據失敗: ' + (err.message || '未知錯誤');
    isLoading.value = false;
  }
});

// 更新免费额度设置
async function updateFreeQuota() {
  if (isUpdating.value) return;
  
  try {
    isUpdating.value = true;
    
    // 使用store action更新免费额度
    const response = await vuexStore.dispatch('updateMyFreeQuota', newFreeLimit.value);
    
    if (response.success) {
      alert('免费额度设置已更新');
    }
  } catch (error) {
    console.error('更新免费额度失败:', error);
    alert(`更新失败: ${error.message || '未知错误'}`);
  } finally {
    isUpdating.value = false;
  }
}
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
  margin-bottom: 50px;
  text-align: center;
  position: relative;
  padding: 0 20px;
}

.dashboard-header h1 {
  font-size: 2.6rem;
  margin-bottom: 15px;
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

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  transition: var(--theme-transition);
}

@media (min-width: 992px) {
  .dashboard-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .member-card-section {
    grid-column: 1 / 3;
  }
}

.member-card-section,
.free-quota-settings,
.recent-transactions {
  background-color: var(--card-bg, white);
  border-radius: 20px;
  padding: 35px;
  box-shadow: 0 10px 30px var(--shadow-color, rgba(0,0,0,0.1));
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, rgba(0,0,0,0.05));
}

.member-card-section:hover,
.free-quota-settings:hover,
.recent-transactions:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px var(--shadow-color, rgba(0,0,0,0.15));
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 28px;
  color: var(--text-primary, #333);
  display: flex;
  align-items: center;
  font-weight: 600;
  position: relative;
}

.section-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.8;
}

.card-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23007bff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'%3E%3C/path%3E%3C/svg%3E");
}

.quota-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23007bff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'%3E%3C/path%3E%3C/svg%3E");
}

.transaction-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23007bff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'%3E%3C/path%3E%3C/svg%3E");
}

.card-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 14px 30px;
  border-radius: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.btn-icon {
  width: 18px;
  height: 18px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.topup-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'%3E%3C/path%3E%3C/svg%3E");
}

.update-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'%3E%3C/path%3E%3C/svg%3E");
}

.arrow-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23007bff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M14 5l7 7m0 0l-7 7m7-7H3'%3E%3C/path%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-left: 4px;
  vertical-align: middle;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  color: white;
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.btn::before {
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

.btn:hover::before {
  opacity: 1;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--color-primary-dark, #2980b9), #1a5c8f);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--color-primary-light, #64b5f6), var(--color-primary, #3498db));
  color: white;
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.25);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(var(--color-primary-rgb, 52, 152, 219), 0.35);
}

.btn-text {
  background: none;
  color: var(--primary-color);
  text-decoration: none;
  position: relative;
  padding: 8px 0;
}

.btn-text:hover {
  color: #0056b3;
}

.btn-text::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 0;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

.btn-text:hover::after {
  width: 100%;
}

.view-all {
  margin-top: 25px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 1.05rem;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(0,0,0,0.1));
  background-color: var(--color-bg, white);
  color: var(--text-primary, #333);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 52, 152, 219), 0.25);
}

small {
  display: block;
  margin-top: 8px;
  color: #666;
  font-size: 0.9rem;
}

.free-quota-info {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.05);
}

.quota-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quota-label {
  color: #666;
}

.quota-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.quota-value.highlight {
  color: var(--primary-color);
}

.quota-progress {
  height: 8px;
  background-color: rgba(0,0,0,0.05);
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
  border-radius: 4px;
  transition: width 0.5s ease;
}

.note {
  font-size: 0.9rem;
  color: #888;
  margin-top: 15px;
  font-style: italic;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 50px;
  border-radius: 20px;
  background-color: var(--card-bg, white);
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  box-shadow: 0 10px 30px var(--shadow-color, rgba(0,0,0,0.1));
  border: 1px solid var(--border-color, rgba(0,0,0,0.05));
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(var(--color-primary-rgb, 52, 152, 219), 0.1);
  border-left-color: var(--color-primary, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 25px;
}

.error-icon {
  width: 60px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  background-color: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
  border-radius: 50%;
  font-size: 32px;
  font-style: normal;
  font-weight: bold;
  margin-bottom: 25px;
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.2);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>