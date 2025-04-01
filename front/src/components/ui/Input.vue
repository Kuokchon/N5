<template>
  <div class="input-wrapper">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-container">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="input"
        :class="{ 'input-error': error }"
        @input="updateValue"
        @blur="touched = true"
      />
    </div>
    <div v-if="error && touched" class="input-error-message">
      {{ error }}
    </div>
    <div v-if="$slots.hint" class="input-hint">
      <slot name="hint"></slot>
    </div>
  </div>
</template>

<script setup>
/**
 * Input.vue - 通用输入框组件
 * 
 * 该组件提供了一个可定制的输入框，支持标签、错误提示和提示信息
 * 实现了v-model双向绑定，支持表单验证功能
 */
import { ref } from 'vue';
import { generateRandomId } from '../../services/utils';

// 定义组件属性
const props = defineProps({
  // v-model绑定值
  modelValue: {
    type: [String, Number],
    default: ''
  },
  // 输入框标签
  label: {
    type: String,
    default: ''
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: ''
  },
  // 输入框类型
  type: {
    type: String,
    default: 'text'
  },
  // 是否禁用输入框
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否为必填项
  required: {
    type: Boolean,
    default: false
  },
  // 错误信息
  error: {
    type: String,
    default: ''
  },
  // 输入框ID，默认自动生成
  id: {
    type: String,
    default: () => `input-${generateRandomId()}`
  }
});

// 定义组件事件
const emit = defineEmits(['update:modelValue']);

// 跟踪输入框是否被触碰过，用于错误显示逻辑
const touched = ref(false);

/**
 * 更新输入值并触发v-model更新
 * @param {Event} event - 输入事件对象
 */
const updateValue = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<style scoped>
.input-wrapper {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.input-required {
  color: #e74c3c;
  margin-left: 2px;
}

.input-container {
  position: relative;
}

.input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-error {
  border-color: #e74c3c;
}

.input-error:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.1);
}

.input-error-message {
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
}

.input-hint {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}
</style>