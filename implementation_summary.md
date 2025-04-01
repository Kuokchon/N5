# USERS與ADMIN_USERS表關聯實現總結


## 1. 後端模型與API修改


### 管理員模型 (admin_model.js)
- 支持從 USERS 表中獲取管理員信息
- 提供檢查用戶是否為管理員的功能
- 支持使用 USERS 表中的用戶驗證管理員登錄憑據


### 認證中間件 (authMiddleware.js)
- 同時支持管理員令牌和用戶令牌
- 允許具有管理員權限的普通用戶訪問後台
- 提供統一的權限檢查機制
