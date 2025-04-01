# 管理員系統說明文檔

## 概述

本系統包含一個管理後台，用於管理會員、內容、AI應用等資源。管理後台使用基於角色的權限控制系統，支持不同級別的管理員帳號。

## 管理員角色

系統支持三種不同的管理員角色：

1. **超級管理員 (super_admin)**
   - 權限：所有功能
   - 可以管理其他管理員

2. **運營管理員 (operation)**
   - 權限：會員管理、內容審核
   - 負責日常運營工作

3. **開發者 (developer)**
   - 權限：AI應用管理、API配置
   - 負責技術相關功能

## 預設帳號

系統初始化後，會創建以下預設管理員帳號：

| 用戶名 | 密碼 | 角色 |
|-------|------|------|
| admin | admin123 | super_admin |
| operation | operation123 | operation |
| developer | developer123 | developer |

**重要：** 在生產環境中，請立即更改這些預設密碼！

## 常見問題

### 無法登錄管理後台

如果遇到無法登錄管理後台的問題，可能是以下原因：

1. **數據庫中沒有管理員帳戶**
   - 運行 `node scripts/update_db.js` 確保SQL表已創建
   - 使用 `node scripts/check_admin_users.js` 檢查管理員用戶是否存在

2. **密碼哈希不正確**
   - 運行 `node scripts/reset_admin_password.js` 重置管理員密碼
   - 重置後使用預設密碼登錄 (例如：用戶名 `admin`，密碼 `admin123`)

3. **JWT密鑰問題**
   - 檢查 `.env` 文件中的 `JWT_SECRET` 是否已正確設置

### 修改管理員密碼

可以使用以下方法修改管理員密碼：

1. 登錄管理後台，在用戶設置頁面更改密碼
2. 運行 `node scripts/reset_admin_password.js` 腳本重置為預設密碼
3. 直接在數據庫中更新密碼哈希（不推薦）

## 操作日誌

系統會自動記錄所有管理員操作，包括：

- 登錄/登出
- 資源創建/修改/刪除
- 權限變更

操作日誌存儲在 `operation_logs` 表中，可通過管理後台查看。

## 開發信息

管理員相關的代碼文件：

- 模型：`models/admin_model.js`
- 路由：`routes/adminRoutes.js`
- SQL：`sql/admin_tables.sql`

如需進一步自定義管理員系統，請修改這些文件。 