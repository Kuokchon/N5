<template>
  <div class="member-card">
    <div class="member-card-inner">
      <div class="member-card-header">
        <div class="card-logo">
          <div id="cubeLogo"></div>
          <span>AI会员卡</span>
        </div>
        <div class="card-status" :class="statusClass">
          {{ statusText }}
        </div>
      </div>
      
      <div class="member-card-body">
        <div class="balance-info">
          <div class="balance-label">余额</div>
          <div class="balance-value">{{ formattedBalance }}</div>
        </div>
        
        <div class="free-quota-info" v-if="showFreeQuota">
          <div class="free-quota-label">今日免费额度</div>
          <div class="free-quota-value">
            {{ formattedFreeBalance }}/{{ formattedFreeLimit }}
            <div class="free-quota-progress">
              <div class="free-quota-bar" :style="freeQuotaBarStyle"></div>
            </div>
          </div>
        </div>
        
        <div class="expiry-info">
          <div class="expiry-label">有效期至</div>
          <div class="expiry-value">{{ formattedExpiry }}</div>
          <div class="expiry-days" v-if="remainingDays > 0">
            剩余 {{ remainingDays }} 天
          </div>
          <div class="expiry-days expired" v-else>
            已过期
          </div>
        </div>
      </div>
      
      <div class="member-card-footer">
        <div class="card-holder">{{ username }}</div>
        <div class="card-since">开卡日期：{{ formattedCreateDate }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * MemberCard.vue - 会员卡展示组件
 * 
 * 该组件用于展示用户的会员卡信息，包括余额、状态和有效期
 * 提供了视觉上吸引人的卡片界面，显示会员的关键信息
 */
import { computed } from 'vue';
import { formatCurrency, formatDate, getRemainingDays } from '../services/utils';

// 定义组件属性
const props = defineProps({
  // 会员卡余额
  balance: {
    type: [Number, String],
    default: 0
  },
  // 会员卡状态
  status: {
    type: String,
    default: 'active' // active, frozen
  },
  // 会员卡有效期
  expiryDate: {
    type: String,
    required: true
  },
  // 会员卡创建日期
  createDate: {
    type: String,
    required: true
  },
  // 用户名称
  username: {
    type: String,
    default: '用户'
  },
  // 当日免费额度余额
  freeBalance: {
    type: [Number, String],
    default: 0
  },
  
  // 当日免费额度限额
  freeLimit: {
    type: [Number, String],
    default: 0
  },
  
  // 是否显示免费额度（如果限额为0则不显示）
  showFreeQuota: {
    type: Boolean,
    default: true
  }
});

/**
 * 格式化余额为货币形式
 * 例如：100 -> ¥100.00
 */
const formattedBalance = computed(() => {
  return formatCurrency(props.balance);
});

/**
 * 格式化有效期为易读日期
 * 例如：2023-01-01T00:00:00Z -> 2023-01-01
 */
const formattedExpiry = computed(() => {
  return formatDate(props.expiryDate);
});

/**
 * 格式化开卡日期为易读日期
 */
const formattedCreateDate = computed(() => {
  return formatDate(props.createDate);
});

/**
 * 计算会员卡剩余有效天数
 * 基于当前日期和过期日期计算
 */
const remainingDays = computed(() => {
  return getRemainingDays(props.expiryDate);
});

/**
 * 根据会员卡状态和剩余天数生成状态文本
 * 可能的值：正常、已冻结、已过期
 */
const statusText = computed(() => {
  if (props.status === 'frozen') return '已冻结';
  if (remainingDays.value <= 0) return '已过期';
  return '正常';
});

/**
 * 根据会员卡状态和剩余天数生成CSS类名
 * 用于显示不同的视觉样式
 */
const statusClass = computed(() => {
  if (props.status === 'frozen') return 'status-frozen';
  if (remainingDays.value <= 0) return 'status-expired';
  return 'status-active';
});

/**
 * 格式化免费额度余额为货币形式
 */
const formattedFreeBalance = computed(() => {
  return formatCurrency(props.freeBalance);
});

/**
 * 格式化免费额度限额为货币形式
 */
const formattedFreeLimit = computed(() => {
  return formatCurrency(props.freeLimit);
});

/**
 * 计算免费额度进度条样式
 */
const freeQuotaBarStyle = computed(() => {
  const limit = parseFloat(props.freeLimit) || 1; // 防止除以0
  const balance = parseFloat(props.freeBalance);
  const percentage = (balance / limit) * 100;
  
  return {
    width: `${Math.min(100, percentage)}%`,
    backgroundColor: percentage > 30 ? '#4cd964' : '#ff3b30'
  };
});
</script>

<style scoped>
.member-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  perspective: 1000px;
}

.member-card-inner {
  position: relative;
  width: 100%;
  height: 220px;
  border-radius: 12px;
  background: linear-gradient(135deg, #42adff 0%, #0064e1 100%);
  box-shadow: 0 10px 20px rgba(0, 100, 225, 0.2);
  padding: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.member-card-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/></svg>');
  background-size: 20px 20px;
  opacity: 0.5;
  z-index: 1;
}

.member-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.card-logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.card-logo span {
  margin-left: 8px;
}

.card-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background-color: rgba(46, 204, 113, 0.8);
}

.status-frozen {
  background-color: rgba(52, 73, 94, 0.8);
}

.status-expired {
  background-color: rgba(231, 76, 60, 0.8);
}

.member-card-body {
  position: relative;
  z-index: 2;
}

.balance-info {
  margin-bottom: 16px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.balance-value {
  font-size: 28px;
  font-weight: 700;
}

.free-quota-info {
  margin-bottom: 16px;
}

.free-quota-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.free-quota-value {
  font-size: 16px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
}

.free-quota-progress {
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-top: 4px;
  overflow: hidden;
}

.free-quota-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.expiry-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.expiry-label {
  font-size: 14px;
  opacity: 0.8;
  margin-right: 8px;
}

.expiry-value {
  font-size: 16px;
  font-weight: 500;
  margin-right: 12px;
}

.expiry-days {
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
}

.expired {
  background-color: rgba(231, 76, 60, 0.8);
}

.member-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.card-holder {
  font-size: 16px;
  font-weight: 500;
}

.card-since {
  font-size: 12px;
  opacity: 0.8;
}
</style>