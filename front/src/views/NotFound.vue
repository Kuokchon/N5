<template>
  <div class="not-found">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <router-link to="/" class="primary-btn">Return to Home</router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  color: var(--text-primary, #333);
  background-color: var(--color-bg, #ffffff);
  transition: var(--theme-transition);
  padding: 20px;
}

h1 {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(45deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  letter-spacing: -1px;
}

p {
  font-size: 1.4rem;
  margin-bottom: 2.5rem;
  color: var(--text-secondary, #666);
  max-width: 500px;
  line-height: 1.6;
}

.primary-btn {
  padding: 1rem 2rem;
  background: var(--color-primary, #3498db);
  color: white;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
  position: relative;
  overflow: hidden;
}

.primary-btn::before {
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

.primary-btn:hover::before {
  opacity: 1;
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.primary-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}
</style>