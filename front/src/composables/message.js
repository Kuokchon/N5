/**
 * 消息提示组合式函数
 * 
 * 提供简单的消息提示功能，用于显示操作结果反馈
 */

import { ref, computed } from 'vue';

// 消息状态
const messages = ref([]);
let messageId = 0;

/**
 * 使用消息提示功能
 * @returns {Object} 消息提示相关函数和状态
 */
export function useMessage() {
  /**
   * 显示消息
   * @param {string} content - 消息内容
   * @param {string} type - 消息类型 (success/error/info/warning)
   * @param {number} duration - 显示时长(ms)，默认3000ms
   */
  const showMessage = (content, type = 'info', duration = 3000) => {
    const id = messageId++;
    
    // 添加消息
    messages.value.push({
      id,
      content,
      type,
      visible: true
    });
    
    // 设置定时器，自动移除消息
    setTimeout(() => {
      const index = messages.value.findIndex(msg => msg.id === id);
      if (index !== -1) {
        // 标记为不可见（触发淡出动画）
        messages.value[index].visible = false;
        
        // 等待动画完成后移除
        setTimeout(() => {
          messages.value = messages.value.filter(msg => msg.id !== id);
        }, 300);
      }
    }, duration);
  };
  
  /**
   * 成功消息
   * @param {string} content - 消息内容
   * @param {number} duration - 显示时长(ms)
   */
  const showSuccess = (content, duration) => {
    showMessage(content, 'success', duration);
  };
  
  /**
   * 错误消息
   * @param {string} content - 消息内容
   * @param {number} duration - 显示时长(ms)
   */
  const showError = (content, duration) => {
    showMessage(content, 'error', duration);
  };
  
  /**
   * 警告消息
   * @param {string} content - 消息内容
   * @param {number} duration - 显示时长(ms)
   */
  const showWarning = (content, duration) => {
    showMessage(content, 'warning', duration);
  };
  
  return {
    messages: computed(() => messages.value),
    showMessage,
    showSuccess,
    showError,
    showWarning
  };
} 