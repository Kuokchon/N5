<template>
  <div>
    <div class="theme-settings-panel" :class="{ 'open': isOpen }">
      <div class="panel-header">
        <h3>主題設置</h3>
        <button class="close-btn" @click="close" aria-label="關閉設置面板">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="panel-content">
        <div class="settings-section">
          <h4>主題模式</h4>
          <div class="theme-options">
            <button 
              class="theme-option" 
              :class="{ 'active': !isDarkTheme && !followsSystem }"
              @click="setLightTheme"
            >
              <div class="theme-icon-container light">
                <i class="fas fa-sun"></i>
              </div>
              <span>淺色</span>
            </button>
            
            <button 
              class="theme-option" 
              :class="{ 'active': isDarkTheme && !followsSystem }"
              @click="setDarkTheme"
            >
              <div class="theme-icon-container dark">
                <i class="fas fa-moon"></i>
              </div>
              <span>深色</span>
            </button>
            
            <button 
              class="theme-option" 
              :class="{ 'active': followsSystem }"
              @click="setSystemPreference"
            >
              <div class="theme-icon-container system">
                <i class="fas fa-laptop"></i>
              </div>
              <span>跟隨系統</span>
              <span class="system-label">{{ systemPrefersDark ? '(深色)' : '(淺色)' }}</span>
            </button>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>快捷鍵</h4>
          <div class="shortcut-info">
            <span class="shortcut-key">Alt + T</span>
            <span class="shortcut-desc">切換主題</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 遮罩層 -->
    <div class="panel-overlay" v-if="isOpen" @click="close"></div>
  </div>
</template>

<script setup>
/**
 * 主題設置面板
 * 
 * 提供主題相關設置的統一管理界面，包括：
 * - 主題模式選擇（淺色/深色/跟隨系統）
 * - 快捷鍵說明
 */
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isDarkTheme: Boolean,
  followsSystem: Boolean,
  systemPrefersDark: Boolean,
  isOpen: Boolean
});

const emit = defineEmits(['update:isOpen', 'setTheme', 'setFollowSystem']);

// 更新打開狀態
const close = () => {
  emit('update:isOpen', false);
};

// 設置淺色主題
const setLightTheme = () => {
  emit('setFollowSystem', false);
  emit('setTheme', false);
};

// 設置深色主題
const setDarkTheme = () => {
  emit('setFollowSystem', false);
  emit('setTheme', true);
};

// 設置跟隨系統
const setSystemPreference = () => {
  emit('setFollowSystem', true);
};
</script>

<style scoped>
.theme-settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background: var(--card-bg, #ffffff);
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.theme-settings-panel.open {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary, #212121);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, #757575);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--text-primary, #212121);
}

.panel-content {
  padding: 1rem;
  flex: 1;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--text-primary, #212121);
  border-left: 3px solid var(--color-primary, #2196f3);
  padding-left: 0.5rem;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.theme-option {
  background: var(--color-bg, #ffffff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.5rem;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option.active {
  border-color: var(--color-primary, #2196f3);
  background: rgba(var(--color-primary-rgb, 33, 150, 243), 0.05);
}

.theme-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.theme-icon-container.light {
  background: #f5f5f5;
  color: #ff9800;
}

.theme-icon-container.dark {
  background: #333;
  color: #90caf9;
}

.theme-icon-container.system {
  background: linear-gradient(135deg, #f5f5f5 50%, #333 50%);
  color: #4caf50;
}

.theme-option:hover .theme-icon-container {
  transform: translateY(-3px);
}

.theme-option span {
  font-size: 0.8rem;
  color: var(--text-primary, #212121);
}

.system-label {
  font-size: 0.7rem;
  color: var(--text-secondary, #757575);
  margin-top: 0.25rem;
}

.shortcut-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.shortcut-key {
  background: var(--color-bg, #f5f5f5);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
}

.shortcut-desc {
  color: var(--text-secondary, #757575);
  font-size: 0.9rem;
}

.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1090;
  backdrop-filter: blur(2px);
}

@media (max-width: 480px) {
  .theme-settings-panel {
    width: 280px;
  }
}
</style> 