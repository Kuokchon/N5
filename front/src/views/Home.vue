<script setup>
import ParticlesBackground from '../components/ParticlesBackground.vue'
import { ref, onMounted } from 'vue';

// 动画效果
const isVisible = ref(false);
const cards = ref([]);

// 特色卡片数据
const features = [
  {
    id: 1,
    title: 'AI賦能',
    description: '重新定義市場的推廣方式',
    icon: 'chip-icon',
    link: '/ai-empowerment'
  },
  {
    id: 2,
    title: 'AI定制開發',
    description: '網站開發/APP開發/AI Agent開發',
    icon: 'ai-icon',
    link: '/ai-development'
  },
  {
    id: 3,
    title: 'AI創作平台',
    description: '快速生成高質量的內容與設計',
    icon: 'creative-icon',
    link: '/ai-creation'
  },
  {
    id: 4,
    title: '本地化服務',
    description: '專為澳門本地市場打造的AI解決方案',
    icon: 'local-icon',
    link: '/local-service'
  }
];

// 数字统计
const stats = ref([
  { value: 0, target: 150, suffix: '+', text: '合作企業' },
  { value: 0, target: 30, suffix: '+', text: 'AI應用' },
  { value: 0, target: 99, suffix: '%', text: '客戶滿意度' },
  { value: 0, target: 24, suffix: '/7', text: '全天候支持' }
]);

// 滚动检测
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 500);
  
  // 获取所有卡片元素
  cards.value = document.querySelectorAll('.advantage-card');
  
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll);
  
  // 初始检查
  handleScroll();
  
  // 启动数字动画
  animateNumbers();
});

// 处理滚动动画
const handleScroll = () => {
  cards.value.forEach((card, index) => {
    const cardPosition = card.getBoundingClientRect().top;
    const screenPosition = window.innerHeight / 1.3;
    
    if(cardPosition < screenPosition) {
      setTimeout(() => {
        card.classList.add('visible');
      }, index * 150);
    }
  });
};

// 数字动画
const animateNumbers = () => {
  stats.value.forEach((stat, index) => {
    const duration = 2000; // 动画持续时间
    const interval = 50; // 更新间隔
    const steps = duration / interval;
    const increment = stat.target / steps;
    let current = 0;
    let timer;
    
    setTimeout(() => {
      timer = setInterval(() => {
        current += increment;
        if (current >= stat.target) {
          current = stat.target;
          clearInterval(timer);
        }
        stat.value = Math.floor(current);
      }, interval);
    }, index * 300);
  });
};
</script>

<template>
  <div class="home-container">
    <!-- 主視覺區 -->
    <section class="hero">
      <ParticlesBackground />
      <div class="hero-content" :class="{ 'fade-in': isVisible }">
        <h1 class="main-title">澳門人的AI應用平台</h1>
        <h2 class="sub-title">免學習成本 × 打開即用 × 澳門人的品牌</h2>
        <div class="cta-buttons">
          <router-link to="/ai-apps" class="primary-btn pulse">即刻體驗</router-link>
          <router-link to="/admin" class="secondary-btn" >進入後台 →</router-link>
        </div>
      </div>
    </section>

    <!-- 統計數據區 -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-item" v-for="(stat, index) in stats" :key="index">
          <div class="stat-value">{{ stat.value }}<span>{{ stat.suffix }}</span></div>
          <div class="stat-label">{{ stat.text }}</div>
        </div>
      </div>
    </section>

    <!-- 核心優勢模塊 -->
    <section class="advantages-section">
      <h2 class="section-title">為何選擇我們</h2>
      <div class="advantages">
        <router-link 
          v-for="feature in features" 
          :key="feature.id"
          :to="feature.link" 
          class="advantage-card"
        >
          <div class="card-inner">
            <div :class="['icon', feature.icon]"></div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </router-link>
      </div>
    </section>
    
    <!-- 產品介紹 -->
    <section class="products-section">
      <div class="product-container">
        <div class="product-content">
          <h2 class="section-title left">AI賦能您的業務</h2>
          <p class="product-description">
            我們的AI解決方案能夠顯著提升您的業務效率，減少人力成本，並提供更好的客戶體驗。
            從客戶服務到數據分析，我們為您提供全方位的AI支持。
          </p>
          <router-link to="/solutions" class="learn-more-btn">了解更多</router-link>
        </div>
        <div class="product-image">
          <!-- 假设这里有一张产品图片 -->
          <div class="image-placeholder"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  overflow-x: hidden;
}

/* 主視覺區樣式 */
.hero {
  height: 85vh;
  min-height: 600px;
  border-bottom: 1px solid rgba(0, 247, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  text-align: center;
  z-index: 1;
  padding: 2rem;
  opacity: 0;
  transform: translateY(30px);
  transition: all 1s ease;
}

.hero-content.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.main-title {
  font-size: 4.5rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
}

/* 淺色模式下的標題樣式 */
:root .main-title {
  color: var(--text-primary, #212121);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* 深色模式下的標題樣式 */
[data-theme="dark"] .main-title {
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 247, 255, 0.3), 0 2px 5px rgba(0, 0, 0, 0.5);
}

/* 標題下劃線 */
.main-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: var(--color-primary, #2196f3);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
}

[data-theme="dark"] .main-title::after {
  background: var(--neon-blue, #0dcaf0);
  box-shadow: 0 0 15px rgba(13, 202, 240, 0.6);
}

.sub-title {
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  color: var(--text-primary);
  font-weight: 500;
  text-shadow: 0 0 5px rgba(0,0,0,0.3);
  line-height: 1.5;
}

.cta-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.primary-btn, .secondary-btn {
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.primary-btn {
  background: var(--neon-blue);
  color: var(--primary-dark);
  font-weight: 700;
  box-shadow: 0 0 25px rgba(0, 247, 255, 0.6);
  transition: all 0.3s ease, box-shadow 0.3s ease;
}

.primary-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: all 0.6s ease;
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 25px rgba(0, 247, 255, 0.5);
}

.primary-btn:hover::before {
  left: 100%;
}

.primary-btn.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 247, 255, 0.6);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(0, 247, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 247, 255, 0);
  }
}

.secondary-btn {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--neon-blue);
  position: relative;
  overflow: hidden;
}

.secondary-btn:hover {
  background: rgba(0, 247, 255, 0.1);
  color: var(--neon-blue);
  transform: translateY(-3px);
}

.secondary-btn:active {
  transform: translateY(-1px);
}

/* 統計數據區 */
.stats-section {
  padding: 4rem 2rem;
  background: linear-gradient(rgba(10, 20, 35, 0.7), rgba(10, 26, 47, 0.9));
  border-top: 1px solid rgba(0, 247, 255, 0.1);
  border-bottom: 1px solid rgba(0, 247, 255, 0.1);
}

.stats-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  margin: 1rem;
  min-width: 180px;
}

.stat-value {
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--neon-blue);
  margin-bottom: 0.5rem;
  line-height: 1;
}

.stat-value span {
  font-size: 2rem;
}

.stat-label {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 核心優勢模塊樣式 */
.advantages-section {
  padding: 6rem 2rem;
  background: var(--primary-dark);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: var(--text-primary);
  position: relative;
  display: inline-block;
  left: 50%;
  transform: translateX(-50%);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: var(--neon-blue);
  border-radius: 3px;
}

.section-title.left {
  text-align: left;
  left: 0;
  transform: none;
}

.section-title.left::after {
  left: 0;
  transform: none;
}

.advantages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.advantage-card {
  background: rgba(10, 20, 35, 0.5);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: var(--text-primary);
  position: relative;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0;
  transform: translateY(30px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  height: 100%;
  border: 1px solid rgba(0, 247, 255, 0.1);
}

.advantage-card.visible {
  opacity: 1;
  transform: translateY(0);
}

.card-inner {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease;
}

.advantage-card:hover .card-inner {
  transform: translateY(-10px);
}

.advantage-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 247, 255, 0.1),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.advantage-card:hover::before {
  opacity: 1;
}

.advantage-card:hover {
  transform: scale(1.03);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  border-color: rgba(0, 247, 255, 0.3);
}

.advantage-card .icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1.5rem;
  background-color: rgba(0, 247, 255, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.advantage-card:hover .icon {
  background-color: rgba(0, 247, 255, 0.2);
  transform: scale(1.1);
}

.advantage-card h3 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
  color: var(--neon-blue);
  position: relative;
  display: inline-block;
}

.advantage-card p {
  font-size: 1.1rem;
  color: var(--text-primary);
  flex-grow: 1;
  line-height: 1.6;
  margin-top: 0.5rem;
}

/* 产品介绍部分 */
.products-section {
  padding: 3rem 1rem;
  background: linear-gradient(
    rgba(10, 20, 35, 0.9),
    rgba(10, 26, 47, 0.8)
  );
}

.product-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
  gap: 4rem;
}

.product-content {
  flex: 1;
}

.product-description {
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  font-weight: 400;
}

.learn-more-btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  background-color: transparent;
  border: 2px solid var(--neon-blue);
  color: var(--neon-blue);
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.learn-more-btn:hover {
  background-color: var(--neon-blue);
  color: var(--primary-dark);
}

.product-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.image-placeholder {
  width: 100%;
  height: 400px;
  background: rgba(0, 247, 255, 0.05);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.image-placeholder::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 247, 255, 0.1) 0%,
    transparent 50%,
    rgba(0, 247, 255, 0.1) 100%
  );
  top: 0;
  left: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-title {
    font-size: 3.8rem;
  }
  
  .sub-title {
    font-size: 1.4rem;
  }
  
  .product-container {
    padding: 0 2rem;
  }
  
  .advantages {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 992px) {
  .hero {
    height: 75vh;
  }
  
  .main-title {
    font-size: 3.2rem;
  }
  
  .sub-title {
    font-size: 1.2rem;
  }
  
  .stats-container {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat-item {
    min-width: 160px;
  }
  
  .product-container {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
  
  .section-title.left {
    text-align: center;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .section-title.left::after {
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .hero {
    height: 70vh;
  }
  
  .main-title {
    font-size: 2.8rem;
  }
  
  .sub-title {
    font-size: 1.1rem;
  }
  
  .stats-container {
    flex-direction: column;
    align-items: center;
  }
  
  .cta-buttons {
    flex-direction: column;
    gap: 1rem;
  }
  
  .advantages {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 3rem;
  }
}

@media (max-width: 576px) {
  .hero {
    height: 65vh;
    min-height: 500px;
  }
  
  .main-title {
    font-size: 2.4rem;
  }
  
  .sub-title {
    font-size: 1rem;
  }
  
  .primary-btn, .secondary-btn {
    padding: 0.8rem 1.8rem;
    font-size: 1rem;
  }
  
  .stat-item {
    min-width: 140px;
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 2.5rem;
  }
  
  .stat-value span {
    font-size: 1.5rem;
  }
}
</style>