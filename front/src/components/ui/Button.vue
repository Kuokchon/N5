<template>
  <button 
    class="btn" 
    :class="[
      `btn-${type}`, 
      { 'btn-block': block, 'btn-loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-loading-icon">
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <slot></slot>
  </button>
</template>

<script setup>
/**
 * Button.vue - 通用按钮组件
 * 
 * 该组件提供了一个可定制的按钮，支持不同类型、状态和样式
 * 包含加载状态、禁用状态和块级显示等功能
 */

// 定义组件属性
defineProps({
  // 按钮类型，影响按钮的颜色和样式
  type: {
    type: String,
    default: 'primary', // primary, secondary, danger
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value)
  },
  // 是否为块级按钮（占满容器宽度）
  block: {
    type: Boolean,
    default: false
  },
  // 是否禁用按钮
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

// 定义组件事件
const emit = defineEmits(['click']);

/**
 * 处理按钮点击事件
 * 当按钮被点击时触发click事件
 * @param {Event} event - 点击事件对象
 */
const handleClick = (event) => {
  emit('click', event);
};
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;
  gap: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 5px var(--shadow-color, rgba(0, 0, 0, 0.1));
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

.btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px var(--shadow-color, rgba(0, 0, 0, 0.1));
}

.btn-primary {
  background-color: var(--color-primary, #3498db);
  color: var(--color-bg, white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #2980b9);
  box-shadow: 0 4px 8px var(--shadow-color, rgba(0, 0, 0, 0.15));
}

.btn-secondary {
  background-color: var(--hover-bg, #f4f6f8);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--border-hover, #e2e6ea);
  border-color: var(--border-hover, #bbbbbb);
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #27ae60;
  box-shadow: 0 4px 8px rgba(46, 204, 113, 0.25);
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.25);
}

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #d35400;
  box-shadow: 0 4px 8px rgba(243, 156, 18, 0.25);
}

.btn-info {
  background-color: var(--neon-blue, #00b0f0);
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: #0089bc;
  box-shadow: 0 4px 8px rgba(0, 176, 240, 0.25);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn:disabled::before {
  display: none;
}

.btn-block {
  display: flex;
  width: 100%;
}

.btn-loading {
  position: relative;
}

.btn-loading-icon {
  margin-right: 6px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 深色主题特定样式 */
[data-theme="dark"] .btn-secondary {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-primary, #ffffff);
  border-color: var(--border-color, #444444);
}

[data-theme="dark"] .btn-secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: var(--border-hover, #666666);
}
</style>