/**
 * main.js - 应用程序入口文件
 * 
 * 该文件是Vue应用的主入口点，负责初始化Vue应用实例、配置全局插件和挂载应用
 * 同时包含3D立方体Logo的实现和一些DOM交互功能
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/router'
import * as THREE from 'three'
import { createPinia } from 'pinia'
import store from './store/index' // 导入Vuex store

// 创建Vue应用实例
const app = createApp(App)

// 全局API健康檢查狀態
window.apiHealthState = {
  lastChecked: 0,
  isHealthy: null,
  pendingCheck: null
};

// 全局API健康檢查函數
window.checkApiHealth = async () => {
  // 如果已有檢查中，直接返回之前的Promise
  if (window.apiHealthState.pendingCheck) {
    return window.apiHealthState.pendingCheck;
  }
  
  // 如果30秒內已檢查過且結果正常，直接返回
  const now = Date.now();
  if (window.apiHealthState.isHealthy && 
      (now - window.apiHealthState.lastChecked) < 30000) {
    return { success: true, fromCache: true };
  }
  
  // 創建新檢查
  window.apiHealthState.pendingCheck = new Promise(async (resolve) => {
    try {
      // 使用根端點進行健康檢查，而不是/health端點
      const response = await fetch('http://localhost:3000', {
        method: 'HEAD',
        headers: { 'Accept': '*/*' },
        cache: 'no-cache'
      });
      
      const result = { 
        success: response.ok, 
        status: response.status,
        message: response.ok ? 'API服務器可達' : '伺服器返回非成功狀態碼'
      };
      
      // 更新狀態
      window.apiHealthState.isHealthy = result.success;
      window.apiHealthState.lastChecked = now;
      
      resolve(result);
    } catch (error) {
      console.error('API健康檢查失敗:', error);
      window.apiHealthState.isHealthy = false;
      window.apiHealthState.lastChecked = now;
      resolve({ 
        success: false, 
        error: error.message,
        message: '無法連接到API服務器'
      });
    } finally {
      window.apiHealthState.pendingCheck = null;
    }
  });
  
  return window.apiHealthState.pendingCheck;
};

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 錯誤:', err);
  console.log('錯誤信息:', info);
  
  // 可以在這裡添加錯誤報告邏輯或顯示友好的錯誤消息
  if (err.message && err.message.includes('Receiving end does not exist')) {
    console.log('忽略瀏覽器擴展相關錯誤');
    return; // 忽略特定錯誤
  }
  
  // 如果是認證相關錯誤，可以重定向到登錄頁
  if (err.message && err.message.toLowerCase().includes('unauthorized')) {
    console.log('認證錯誤，清除狀態');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 不立即跳轉，避免循環重定向
  }
};

// 全局Promise錯誤處理
window.addEventListener('unhandledrejection', event => {
  console.error('未處理的Promise拒絕:', event.reason);
  
  // 忽略特定錯誤
  if (event.reason && 
      (event.reason.message && event.reason.message.includes('Receiving end does not exist') ||
       typeof event.reason === 'string' && event.reason.includes('videoInWhiteList'))) {
    event.preventDefault();
    console.log('忽略特定Promise錯誤');
  }
});

// 创建Pinia状态管理实例
const pinia = createPinia()

// 注册插件
app.use(router)
app.use(pinia)
app.use(store) // 注册Vuex
// 挂载应用到DOM
app.mount('#app')

/**
 * 3D立方體Logo类
 * 使用Three.js创建一个3D立方体作为网站Logo的动画效果
 */
class CubeLogo {
    constructor() {
        // 初始化Three.js核心组件
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.cube = null;
        
        this.init();
    }
    
    /**
     * 初始化3D场景、相机、渲染器和立方体
     */
    init() {
        const container = document.getElementById('cubeLogo');
        this.renderer.setSize(40, 40);
        container.appendChild(this.renderer.domElement);
        
        // 創建立方體
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00F7FF,
            transparent: true,
            opacity: 0.8,
            emissive: 0x00F7FF,
            emissiveIntensity: 0.5
        });
        
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
        
        // 添加光源
        const light = new THREE.PointLight(0xFFFFFF, 1, 100);
        light.position.set(5, 5, 5);
        this.scene.add(light);
        
        this.camera.position.z = 2;
        
        this.animate();
    }
    
    /**
     * 动画循环函数，使立方体持续旋转
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// DOM加载完成后初始化交互功能
document.addEventListener('DOMContentLoaded', () => {
    // 使用Vue组件，不需要在这里初始化ParticlesBackground
    // 只有在cubeLogo元素存在时才初始化CubeLogo
    const cubeLogoElement = document.getElementById('cubeLogo');
    if (cubeLogoElement) {
        new CubeLogo();
    }
    
    // 創建API測試按鈕
    const createApiTestButton = () => {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'fixed bottom-4 right-4 z-50';
      
      const btn = document.createElement('button');
      btn.className = 'bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg';
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>`;
      
      const resultPanel = document.createElement('div');
      resultPanel.className = 'absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-72 transition-all duration-300 hidden';
      resultPanel.innerHTML = `
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">API連接測試結果</h3>
        <div class="space-y-2 max-h-60 overflow-auto" id="api-test-results">
          <div class="text-sm text-gray-600 dark:text-gray-300">點擊測試按鈕開始檢測</div>
        </div>
        <div class="mt-4">
          <button id="run-api-test" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 flex items-center justify-center">
            <span>測試API</span>
          </button>
        </div>
      `;
      
      btnContainer.appendChild(btn);
      btnContainer.appendChild(resultPanel);
      document.body.appendChild(btnContainer);
      
      let isOpen = false;
      
      // 開關面板功能
      btn.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
          resultPanel.classList.remove('hidden');
        } else {
          resultPanel.classList.add('hidden');
        }
      };
      
      // 測試API功能
      document.getElementById('run-api-test').onclick = async () => {
        const resultsDiv = document.getElementById('api-test-results');
        resultsDiv.innerHTML = `<div class="text-sm text-gray-600 dark:text-gray-300">測試中...</div>`;
        
        // 測試地址列表
        const endpoints = [
          'http://localhost:3000/',
          'http://localhost:3000/api'
        ];
        
        let results = '';
        
        for (const url of endpoints) {
          results += `<div class="p-2 rounded-md mb-2">測試 ${url}...<br/>`;
          
          try {
            const startTime = Date.now();
            const response = await fetch(url, { 
              method: 'HEAD',
              cache: 'no-cache',
              headers: { 'Accept': '*/*' }
            });
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            if (response.ok) {
              results += `<span class="text-xs font-bold px-2 py-1 rounded bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                ${response.status} OK
              </span><br/>`;
              results += `<span class="text-xs text-green-700 dark:text-green-300">響應時間: ${latency}ms</span><br/>`;
              results += `<button class="text-xs mt-1 px-2 py-1 bg-blue-500 text-white rounded">使用此API</button>`;
            } else {
              results += `<span class="text-xs font-bold px-2 py-1 rounded bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
                ${response.status} Error
              </span>`;
            }
          } catch (error) {
            results += `<span class="text-xs font-bold px-2 py-1 rounded bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
              Failed to fetch
            </span>`;
          }
          
          results += `</div>`;
        }
        
        resultsDiv.innerHTML = results;
      };
    };
    
    // 只在開發模式顯示API測試按鈕
    if (process.env.NODE_ENV === 'development') {
      createApiTestButton();
    }
    
    /**
     * Logo點擊次數計數器（彩蛋功能）
     * 当用户连续点击Logo 5次时触发彩蛋效果
     */
    let logoClicks = 0;
    document.querySelector('.logo-container')?.addEventListener('click', () => {
        logoClicks++;
        if(logoClicks === 5) {
            alert('🎉 發現彩蛋！AR虛擬展間即將開啟...');
            logoClicks = 0;
        }
    });
});