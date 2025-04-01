<script setup>
/**
 * ParticlesBackground.vue - 粒子背景效果组件
 * 
 * 该组件封装了particles.js的初始化和配置逻辑，提供可复用的粒子背景效果
 * 可在多个页面中使用，避免代码重复
 */
import { onMounted, onUnmounted, ref } from 'vue'

// 定义props，允许自定义粒子效果参数
const props = defineProps({
  // 粒子数量
  particleCount: {
    type: Number,
    default: 80
  },
  // 粒子颜色
  particleColor: {
    type: String,
    default: '#00F7FF'
  },
  // 粒子透明度
  particleOpacity: {
    type: Number,
    default: 0.5
  },
  // 粒子大小
  particleSize: {
    type: Number,
    default: 3
  },
  // 粒子连线颜色
  lineColor: {
    type: String,
    default: '#00F7FF'
  },
  // 粒子连线透明度
  lineOpacity: {
    type: Number,
    default: 0.4
  },
  // 容器ID
  containerId: {
    type: String,
    default: 'particles-js'
  }
})

// 跟踪脚本是否已加载
const scriptLoaded = ref(false)
let particlesScript = null

onMounted(() => {
  // 加載 particles.js 脚本用于创建交互式粒子背景
  particlesScript = document.createElement('script')
  particlesScript.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
  particlesScript.onload = () => {
    scriptLoaded.value = true
    if (window.particlesJS) {
      // 配置粒子效果参数
      window.particlesJS(props.containerId, {
        particles: {
          number: { value: props.particleCount, density: { enable: true, value_area: 800 } }, // 粒子数量和密度
          color: { value: props.particleColor }, // 粒子颜色
          opacity: { value: props.particleOpacity }, // 粒子透明度
          size: { value: props.particleSize }, // 粒子大小
          line_linked: { enable: true, color: props.lineColor, opacity: props.lineOpacity } // 粒子连线设置
        },
        interactivity: {
          detect_on: "canvas", // 交互检测区域
          events: {
            onhover: { enable: true, mode: "repulse" }, // 鼠标悬停效果 - 排斥
            onclick: { enable: true, mode: "push" } // 点击效果 - 添加粒子
          }
        },
        background: {
          color: "transparent", // 背景透明
          image: "",
          position: "50% 50%",
          repeat: "no-repeat",
          size: "cover"
        }
      })
    }
  }
  document.head.appendChild(particlesScript) // 将脚本添加到文档头部
})

onUnmounted(() => {
  // 清理资源，移除脚本
  if (particlesScript && particlesScript.parentNode) {
    particlesScript.parentNode.removeChild(particlesScript)
  }
  // 如果particles实例有destroy方法，也可以在这里调用
})
</script>

<template>
  <!-- 粒子效果容器 -->
  <div :id="containerId" class="particles-container"></div>
</template>

<style scoped>
/* 粒子容器样式 - 固定定位覆盖整个视口 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* 确保粒子效果可见但在内容后方 */
  pointer-events: auto; /* 确保鼠标事件能够被捕获 */
}
</style>