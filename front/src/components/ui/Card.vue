<template>
  <div class="card" :class="{ 'card-no-padding': noPadding }">
    <div v-if="title" class="card-header">
      <h3>{{ title }}</h3>
      <div v-if="$slots.headerExtra" class="card-header-extra">
        <slot name="headerExtra"></slot>
      </div>
    </div>
    <div class="card-body" :class="{ 'card-body-no-padding': noPadding }">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
/**
 * Card.vue - 卡片容器组件
 * 
 * 该组件提供了一个通用的卡片容器，用于展示内容
 * 支持标题、内容区域和底部区域，可以通过插槽自定义各部分内容
 */

// 定义组件属性
defineProps({
  // 卡片标题
  title: {
    type: String,
    default: ''
  },
  // 是否移除内边距
  noPadding: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-body {
  padding: 20px;
}

.card-body-no-padding {
  padding: 0;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
}
</style>