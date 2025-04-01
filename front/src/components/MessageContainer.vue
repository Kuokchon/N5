<template>
  <div class="message-container">
    <transition-group name="message">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="message" 
        :class="[`message-${msg.type}`, { 'message-visible': msg.visible }]"
      >
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
/**
 * 消息容器组件
 * 
 * 显示全局消息提示，如成功/错误/警告提示
 * 通过useMessage组合式函数控制
 */
import { useMessage } from '../composables/message';

const { messages } = useMessage();
</script>

<style scoped>
.message-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

.message {
  margin-bottom: 10px;
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  background-color: white;
  max-width: 300px;
  overflow: hidden;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
  pointer-events: auto;
}

.message-visible {
  transform: translateX(0);
  opacity: 1;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
}

.message-info {
  background-color: #e1f5fe;
  color: #0277bd;
  border-left: 4px solid #0277bd;
}

.message-success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

.message-error {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}

.message-warning {
  background-color: #fff8e1;
  color: #ff8f00;
  border-left: 4px solid #ff8f00;
}

/* 过渡动画 */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style> 