# 会员卡系统API服务

## 项目说明

会员卡系统后端API服务，提供用户认证、会员卡管理、交易记录和AI应用管理等功能。

## 目录结构

```
backend/
  ├── config/        # 配置文件
  ├── middleware/    # 中间件
  ├── models/        # 数据模型
  ├── routes/        # API路由
  ├── scripts/       # 脚本工具
  ├── sql/           # SQL文件
  ├── app.js         # 应用入口
  ├── .env           # 环境变量
  └── package.json   # 依赖配置
```

## 快速启动

1. 安装依赖：

```bash
npm install
```

2. 创建并配置`.env`文件：

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=member_card_system

JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

PORT=3000
PAYMENT_SECRET_KEY=payment_secret_for_signature_verification
```

3. 初始化数据库：

```bash
npm run init-db
```

4. 启动服务：

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API端点

### 用户认证

- 注册: `POST /auth/register`
- 登录: `POST /auth/login`
- 获取当前用户: `GET /auth/me`

### 会员卡管理

- 获取会员卡: `GET /member-card`
- 创建充值订单: `POST /member-card/topup`
- 使用AI应用: `POST /member-card/use-app`
- 检查应用使用权限: `GET /member-card/check-app/:app_id`

### 交易记录

- 获取交易列表: `GET /transactions`
- 获取交易详情: `GET /transactions/:id`
- 检查订单状态: `GET /transactions/order/:txid`

### AI应用

- 获取应用列表: `GET /ai-apps`
- 获取应用详情: `GET /ai-apps/:id`
- 检查应用权限: `GET /ai-apps/:id/check`

## API测试工具

本项目提供多种API测试工具：

### 交互式测试工具

交互式命令行测试工具，可以手动选择要测试的API端点并输入参数：

```bash
npm run api-test
```

使用方法：
1. 启动工具后，选择要测试的API类型（数字选项）
2. 根据提示输入测试参数
3. 查看测试结果

### 自动化测试工具

自动运行预定义测试用例的自动化测试工具：

```bash
npm run auto-test
```

自动化测试工具会：
1. 依次执行所有API测试用例
2. 显示每个测试的详细结果
3. 生成测试统计报告（通过、失败、跳过的测试数量）

### 充值与扣费流程测试

专门针对会员卡充值和扣费核心业务流程的综合测试工具：

```bash
# 运行所有测试场景
npm run payment-test:all

# 单独测试特定场景
npm run payment-test:topup    # 正常充值
npm run payment-test:cancel   # 支付取消
npm run payment-test:security # 安全验证
npm run payment-test:deduct   # 正常扣费
npm run payment-test:concurrent # 并发扣费
```

#### 测试场景说明

1. **正常充值流程**：
   - 创建充值订单
   - 模拟支付平台回调
   - 验证订单状态和余额变更

2. **支付取消场景**：
   - 创建充值订单但不完成支付
   - 验证未完成订单状态保持为pending
   - 模拟24小时后系统处理过期订单

3. **支付安全验证**：
   - 测试伪造签名的支付回调请求
   - 测试篡改金额的支付回调请求
   - 验证安全机制的有效性

4. **正常扣费流程**：
   - 检查应用价格和余额
   - 执行扣费操作
   - 验证余额变更和交易记录

5. **余额不足场景**：
   - 设置低余额状态
   - 尝试使用价格较高的应用
   - 验证系统正确拒绝交易

6. **会员卡过期场景**：
   - 设置会员卡为过期状态
   - 尝试使用应用
   - 验证系统正确拒绝交易

7. **并发扣费测试**：
   - 设置精确余额
   - 并发发送多个扣费请求
   - 验证系统正确处理并发事务
   - 检查最终余额和成功交易次数

8. **充值后立即消费**：
   - 设置初始余额为0
   - 完成充值
   - A立即发起多次消费请求
   - 验证所有交易数据一致性
   - 检查操作耗时

### 自定义测试用例

如需添加或修改测试用例，请编辑 `scripts/api_test_cases.js` 文件。测试用例格式如下：

```javascript
{
  description: '测试描述',
  requestData: {
    // 请求数据
  },
  expectedStatus: 200, // 预期HTTP状态码
  expectedResponse: {
    // 预期响应数据（可选）
  },
  beforeTest: async (api) => {
    // 测试前执行的操作（可选）
  },
  afterTest: async (api, responseData) => {
    // 测试后执行的操作（可选）
  }
}
```

## 核心业务逻辑

### 充值流程

1. 前端发起充值请求，后端创建待支付订单
2. 用户跳转至第三方支付平台完成支付
3. 支付平台异步回调通知后端支付结果
4. 后端验证签名、订单金额，并更新会员卡余额
5. 超过24小时未完成的订单会被自动标记为失败

### 扣费流程

1. 前端请求使用AI应用，传递应用ID
2. 后端检查会员卡状态、余额和应用价格
3. 使用数据库事务和行锁保证并发安全
4. 扣减余额并创建消费记录
5. 返回最新余额和交易信息

### 并发控制策略

系统采用多层并发控制策略确保数据一致性：

1. **数据库事务**：所有涉及金额变更的操作均在事务中执行
2. **行级锁**：使用SELECT ... FOR UPDATE锁定相关记录
3. **Redis分布式锁**：支持高并发环境下的额外保护层
4. **幂等性设计**：支付回调接口实现幂等处理，防止重复处理