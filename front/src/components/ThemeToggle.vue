<template>
  <div class="theme-toggle">
    <button 
      class="theme-btn" 
      @click="toggleTheme" 
      :title="isDarkTheme ? '切換到淺色模式' : '切換到深色模式'"
      :aria-label="isDarkTheme ? '切換到淺色模式' : '切換到深色模式'"
    >
      <!-- 太陽圖標 (淺色模式) -->
      <svg 
        v-if="isDarkTheme" 
        class="theme-icon sun" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      
      <!-- 月亮圖標 (深色模式) -->
      <svg 
        v-else 
        class="theme-icon moon" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      
      <span class="theme-tooltip">{{ isDarkTheme ? '切換到淺色模式' : '切換到深色模式' }}</span>
    </button>
  </div>
</template>

<script setup>
/**
 * ThemeToggle.vue - 主題切換組件
 * 
 * 該組件允許用戶在深色模式和淺色模式之間切換
 * 支持跟隨系統主題或手動設置
 */
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  isDarkTheme: {
    type: Boolean,
    required: true
  },
  followsSystem: {
    type: Boolean,
    default: false
  },
  showSystemIndicator: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle', 'setFollowSystem']);

// 切換主題
const toggleTheme = () => {
  emit('toggle');
};

// 雙擊切換跟隨系統設置
const handleDoubleClick = () => {
  emit('setFollowSystem', !props.followsSystem);
};

// 設置鍵盤快捷鍵
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    // Alt+T 切換主題
    if (e.altKey && e.key === 't') {
      toggleTheme();
    }
  });
});
</script>

<style scoped>
.theme-toggle {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.theme-btn {
  background: rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
  border: 1px solid var(--color-primary, #2196f3);
  color: var(--text-primary, #212121);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.theme-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(var(--color-primary-rgb, 33, 150, 243), 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.theme-btn:hover::before {
  opacity: 1;
}

.theme-btn:active {
  transform: translateY(-1px);
}

.theme-icon {
  width: 20px;
  height: 20px;
  color: var(--text-primary, #212121);
  transition: all 0.3s ease;
}

.theme-icon.sun {
  color: var(--color-primary, #2196f3);
  animation: rotate-in 0.5s ease-out;
}

.theme-icon.moon {
  color: var(--color-primary, #2196f3); /* 與太陽圖標相同的顏色 */
  animation: fade-in 0.5s ease-out;
}

.theme-tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background-color: var(--modal-bg, rgba(0, 0, 0, 0.8));
  color: var(--color-text, #ffffff);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.theme-tooltip::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px 5px 0;
  border-style: solid;
  border-color: var(--modal-bg, rgba(0, 0, 0, 0.8)) transparent transparent;
}

.theme-btn:hover .theme-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.system-theme-indicator {
  margin-top: 5px;
  font-size: 10px;
  color: var(--text-secondary, #757575);
  opacity: 0.7;
}

@keyframes rotate-in {
  from { transform: rotate(-180deg) scale(0.5); opacity: 0; }
  to { transform: rotate(0) scale(1); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 768px) {
  .theme-tooltip {
    display: none;
  }
}
</style>