<template>
  <div class="app-card" @click="handleClick">
    <div class="app-icon">
      <div 
        class="icon-inner" 
        :style="{ backgroundColor: generateColor(app.app_id) }"
      >{{ getAppInitials(app.name) }}</div>
    </div>
    <div class="app-info">
      <h3 class="app-name">{{ app.name }}</h3>
      <p class="app-desc">{{ app.description || '暂无描述' }}</p>
      <div class="app-price">{{ formatCurrency(app.price) }}</div>
    </div>
    <div class="app-action">
      <button 
        class="use-button" 
        :class="{ 'disabled': !canUse }"
        @click.stop="useApp"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * AppCard.vue - AI应用卡片组件
 * 
 * 该组件用于展示单个AI应用的信息，包括名称、描述、价格和使用按钮
 * 支持点击整个卡片查看详情和点击按钮使用应用
 * 根据应用ID自动生成不同的图标颜色
 */
import { computed } from 'vue';
import { formatCurrency } from '../services/utils';
import { useUserStore } from '../stores/user';
import { useApi } from '../services/api';
import { useLoginModal } from '../stores/loginModal';

// 定义组件属性
const props = defineProps({
  // 应用信息对象
  app: {
    type: Object,
    required: true
  },
  // 是否可以使用该应用
  canUse: {
    type: Boolean,
    default: true
  },
  // 不可用原因
  disabledReason: {
    type: String,
    default: '余额不足'
  }
});

// 定义组件事件
const emit = defineEmits(['click', 'use']);

const userStore = useUserStore();
const api = useApi();
const loginModal = useLoginModal();

/**
 * 根据应用ID生成一个固定的颜色
 * 确保同一个应用每次显示相同的颜色
 * @param {string|number} appId - 应用ID
 * @returns {string} 颜色代码
 */
const generateColor = (appId) => {
  const colors = [
    '#3498db', // 蓝色
    '#2ecc71', // 绿色
    '#e74c3c', // 红色
    '#f39c12', // 橙色
    '#9b59b6', // 紫色
    '#1abc9c', // 青色
    '#e67e22', // 暗橙色
    '#16a085', // 深青色
    '#d35400', // 深橙色
    '#8e44ad'  // 深紫色
  ];
  
  // 将应用ID字符串转换为数字
  let sum = 0;
  for (let i = 0; i < appId.length; i++) {
    sum += appId.charCodeAt(i);
  }
  
  // 获取颜色数组的索引
  const index = sum % colors.length;
  return colors[index];
};

// 获取应用名称的首字母
const getAppInitials = (appName) => {
  if (!appName) return '?';
  
  const words = appName.split(' ');
  if (words.length === 1) {
    return appName.substr(0, 2).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

// 按钮文本
const buttonText = computed(() => {
  return props.canUse ? '使用' : props.disabledReason;
});

// 点击整个卡片
const handleClick = () => {
  emit('click', props.app);
};

/**
 * 构建使用应用的确认信息
 * 显示将使用的免费额度和余额信息
 */
const confirmUseMessage = computed(() => {
  // 如果没有价格或用户信息，返回空
  if (!props.app.price || !userStore.freeBalance) {
    return '';
  }
  
  const appPrice = parseFloat(props.app.price);
  const freeBalance = parseFloat(userStore.freeBalance);
  
  // 计算可用的免费额度
  const freeUsed = Math.min(freeBalance, appPrice);
  // 计算需要从余额扣除的金额
  const balanceUsed = appPrice - freeUsed;
  
  let message = '本次将使用：\n';
  
  // 如果有免费额度可用
  if (freeUsed > 0) {
    message += `- 今日免费额度：${formatCurrency(freeUsed)}\n`;
  }
  
  // 如果需要从余额扣除
  if (balanceUsed > 0) {
    message += `- 账户余额：${formatCurrency(balanceUsed)}\n`;
  }
  
  return message;
});

// 使用应用
const useApp = async () => {
  if (!props.canUse) {
    alert(props.disabledReason);
    return;
  }
  
  if (!loginModal.authenticated) {
    loginModal.showLoginModal = true;
    return;
  }
  
  const priceValue = parseFloat(props.app.price);
  const userBalance = parseFloat(userStore.memberCardBalance);
  const freeBalance = parseFloat(userStore.freeBalance || 0);
  
  // 判断是否有足够的余额（账户余额 + 免费额度）
  if (userBalance + freeBalance < priceValue) {
    alert('余额不足，请先充值');
    return;
  }
  
  // 显示确认对话框
  if (confirm(confirmUseMessage.value + '确认使用？')) {
    loginModal.isLoading = true;
    
    try {
      const response = await api.aiApp.useApp(props.app.app_id);
      
      if (response.success) {
        alert('使用成功');
        // 重新获取最新的会员卡信息和免费额度信息
        await userStore.fetchMemberCard();
        await userStore.fetchFreeQuota();
      } else {
        alert(`使用失败: ${response.message}`);
      }
    } catch (error) {
      console.error('使用应用失败:', error);
      alert(`使用失败: ${error.message || '未知错误'}`);
    } finally {
      loginModal.isLoading = false;
    }
  }
};
</script>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.app-icon {
  margin-bottom: 12px;
}

.icon-inner {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.app-info {
  flex: 1;
}

.app-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.app-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.app-price {
  font-weight: 600;
  color: #f39c12;
  margin-bottom: 12px;
}

.app-action {
  margin-top: auto;
}

.use-button {
  width: 100%;
  padding: 8px 0;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.use-button:hover:not(.disabled) {
  background-color: #2980b9;
}

.use-button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>