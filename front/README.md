# T9 项目

## 项目介绍

这是一个基于Vue 3和Vite构建的现代化Web应用程序。项目采用了组件化的开发方式，包含了完整的页面布局结构和路由系统。

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite 6
- **路由管理**: Vue Router 4
- **组件设计**: 使用Vue 3的`<script setup>`语法

## 项目结构

```
├── public/             # 静态资源目录
├── src/                # 源代码目录
│   ├── assets/         # 资源文件(图片、SVG等)
│   ├── components/     # 公共组件
│   ├── router/         # 路由配置
│   ├── views/          # 页面组件
│   ├── App.vue         # 根组件
│   ├── main.js         # 入口文件
│   └── style.css       # 全局样式
├── index.html          # HTML模板
└── vite.config.js      # Vite配置文件
```

## 安装与运行

### 前提条件

- Node.js (推荐使用最新的LTS版本)
- npm或yarn包管理器

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式运行

```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

### 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

## 项目特点

- 使用Vue 3的Composition API和`<script setup>`语法，提高代码可读性和维护性
- 基于Vite构建，享受快速的开发体验和热更新
- 组件化设计，包含header和footer等可复用组件
- 集成Vue Router进行页面路由管理
- 支持多种社交媒体平台的图标和链接

## 更多资源

- [Vue 3文档](https://v3.vuejs.org/)
- [Vite文档](https://vitejs.dev/)
- [Vue Router文档](https://router.vuejs.org/)
- [Vue 3 `<script setup>` 文档](https://v3.vuejs.org/sfc-script-setup.html)
- [Vue IDE支持](https://vuejs.org/guide/scaling-up/tooling.html#ide-support)
