<script setup>
// 导入SVG图标
import facebookIcon from '../assets/facebook.svg';
import instagramIcon from '../assets/Instagram.svg';
import tiktokIcon from '../assets/tiktok.svg';
import redbookIcon from '../assets/redbook.svg';
import wechatIcon from '../assets/Wechat.svg';
import wechatQrCode from '../assets/wechat-qr.png';

// 从父组件注入的主题状态
import { ref } from 'vue';
import { defineProps } from 'vue';

const props = defineProps({
  isDarkTheme: {
    type: Boolean,
    required: true
  }
});

// 控制微信二维码显示的变量
const showQrCode = ref(false);

// 显示微信二维码的函数
function showWeChatQR() {
  showQrCode.value = true;
}

// 隐藏微信二维码的函数
function hideWeChatQR() {
  showQrCode.value = false;
}

// 年份
const currentYear = new Date().getFullYear();

// 订阅表单
const email = ref('');
const isSubscribing = ref(false);
const subscribeMessage = ref('');

// 处理订阅
const handleSubscribe = (e) => {
  e.preventDefault();
  
  if (!email.value) {
    subscribeMessage.value = '請輸入您的電子郵箱';
    return;
  }
  
  isSubscribing.value = true;
  
  // 模拟API请求
  setTimeout(() => {
    subscribeMessage.value = '訂閱成功！感謝您的關注';
    isSubscribing.value = false;
    email.value = '';
    
    // 清除消息
    setTimeout(() => {
      subscribeMessage.value = '';
    }, 3000);
  }, 1000);
};
</script>

<template>
  <footer class="footer" :class="{ 'dark-theme': isDarkTheme }">
    <div class="footer-wave">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
        <path fill="rgba(10, 26, 47, 0.95)" fill-opacity="1" 
          d="M0,32L48,42.7C96,53,192,75,288,74.7C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
        </path>
      </svg>
    </div>
    
    <div class="footer-content">
      
      <div class="footer-links">
        <div class="product">
          <h4>產品</h4>
          <a href="aigc-matrix.html">AIGC視頻矩陣</a>
          <a href="nfc-matrix.html">NFC矩陣</a>
          <a href="ai-agent-platform.html" >AIGC應用</a>
          <a href="web-dev.html">網站/APP/小程序開發</a>
          <a href="ai-agent-custom.html">AI-Agent定制開發</a>
          <a href="ai-company.html" >AI一人公司</a>
          <a href="ai-assistant.html">AI私人助理</a>
          <a href="ai-employee.html">AI員工</a>
          <a href="#">AI項目超市</a>
        </div>
        <div class="terms">
          <h4>條款</h4>
          <a href="#">服務條款</a>
          <a href="#">隱私條款</a>
          <a href="#">免責聲明</a>
          <a href="#">用戶協議</a>
        </div>
        <div class="contact-info">
          <h4>關於我們</h4>
          <a href="tutorial.html">公司簡介</a>
          <a href="download.html">定價</a>
          <a href="contact.html">聯繫我們</a>
        </div>
        <div class="social-links">
          <h4>關注我們</h4>
          <div class="social-icons">
            <a href="#" class="social-icon facebook" title="Facebook">
              <img :src="facebookIcon" alt="Facebook" class="social-svg-icon" />
            </a>
            <a href="#" class="social-icon instagram" title="Instagram">
              <img :src="instagramIcon" alt="Instagram" class="social-svg-icon" />
            </a>
            <a href="#" class="social-icon tiktok" title="抖音">
              <img :src="tiktokIcon" alt="TikTok" class="social-svg-icon" />
            </a>
            <a href="#" class="social-icon redbook" title="小紅書">
              <img :src="redbookIcon" alt="小紅書" class="social-svg-icon" />
            </a>
            <a href="#" class="social-icon wechat" title="WeChat" 
               @mouseenter="showWeChatQR" 
               @mouseleave="hideWeChatQR">
              <img :src="wechatIcon" alt="WeChat" class="social-svg-icon" />
              <!-- 微信二维码弹出层 -->
              <div class="qr-code-popup" v-if="showQrCode">
                <img :src="wechatQrCode" alt="WeChat QR Code" class="qr-code-image" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="copyright">
      <p>© {{ currentYear }} 澳門國進科技一人有限公司 版權所有</p>
      <div class="footer-nav">
        <a href="/privacy">隱私政策</a>
        <span class="divider">|</span>
        <a href="/terms">使用條款</a>
        <span class="divider">|</span>
        <a href="/sitemap">網站地圖</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* 頁腳樣式 */
.footer {
  position: relative;
  padding: 8rem 2rem 3rem;
  background: var(--footer-bg, #f8f9fa);
  color: var(--footer-text, #212529);
  margin-top: 8rem;
  overflow: hidden;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.footer-wave {
  position: absolute;
  top: -98px;
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
}

:root {
  --footer-bg: #f8f9fa;
  --footer-text: #212529;
  --footer-border: #e5e7eb;
  --footer-link-hover: #0d6efd;
  --footer-button-bg: #212529;
  --footer-button-text: #ffffff;
  --footer-qr-bg: #ffffff;
  --text-primary: #212529;
  --text-secondary: #495057;
  --neon-blue: #0dcaf0;
  --silver-gray: #6c757d;
}

[data-theme="dark"] {
  --footer-bg: rgba(0, 0, 0, 0.98);
  --footer-text: #ffffff;
  --footer-border: #333333;
  --footer-link-hover: #0dcaf0;
  --footer-button-bg: #ffffff;
  --footer-button-text: #212529;
  --footer-qr-bg: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #adb5bd;
  --neon-blue: #0dcaf0;
  --silver-gray: #6c757d;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.footer-links {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;
  text-align: left;
}

.footer-links h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: var(--text-primary);
  position: relative;
  display: inline-block;
}

.footer-links h4::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 40px;
  height: 2px;
  background: var(--neon-blue);
}

.footer-links a {
  display: block;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-links a::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 1px;
  background: var(--neon-blue);
  transition: all 0.3s ease;
  opacity: 0;
}

.footer-links a:hover {
  color: var(--neon-blue);
  padding-left: 10px;
}

.footer-links a:hover::before {
  width: 5px;
  opacity: 1;
}

.footer-links a.active {
  color: var(--neon-blue);
}

.social-icons {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  transition: all 0.3s ease;
  position: relative;
}

.social-svg-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.3s ease;
  filter: var(--icon-filter, brightness(0.8));
}

.social-icon:hover {
  transform: translateY(-3px);
}

.social-icon:hover .social-svg-icon {
  transform: scale(1.1);
  filter: brightness(1);
}

.copyright {
  text-align: center;
  color: var(--silver-gray);
  padding-top: 2.5rem;
  margin-top: 4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  opacity: 0.9;
  font-size: 0.9rem;
}

.footer-nav {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.footer-nav a {
  color: var(--silver-gray);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
}

.footer-nav a:hover {
  color: var(--neon-blue);
}

.divider {
  color: var(--silver-gray);
  opacity: 0.5;
}

/* 微信二维码弹出层样式 */
.social-icon.wechat {
  position: relative;
}

.qr-code-popup {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-bottom: 10px;
  animation: fadeIn 0.3s ease;
}

.qr-code-popup:after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

.qr-code-image {
  width: 120px;
  height: 120px;
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* 响应式设计 */
@media (max-width: 900px) {
  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 5rem 1.5rem 2rem;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 2rem;
  }
  
  .footer-links > div {
    width: 100%;
  }
  
  .social-icons {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 4rem 1rem 2rem;
  }
  
  .subscribe-section {
    padding: 1.5rem 1rem;
  }
  
  .subscribe-form .form-group {
    flex-direction: column;
  }
  
  .subscribe-form input {
    border-radius: 5px 5px 0 0;
  }
  
  .subscribe-form button {
    padding: 0.75rem;
    border-radius: 0 0 5px 5px;
  }
  
  .footer-nav {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .footer-nav .divider {
    display: none;
  }
}
</style>