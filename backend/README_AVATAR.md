# 用户头像功能

## 默认头像文件

需要在以下位置创建默认头像文件：
```
backend/public/default-avatar.png
```

您可以使用任何通用的默认头像图片，建议使用256x256像素的PNG格式图片。

## 数据库迁移

运行以下SQL脚本更新数据库结构：
```
backend/sql/user_avatar.sql
```

## 如何测试头像功能

1. 启动后端服务
2. 使用以下API测试：

### 上传头像
```
PUT /users/{userId}/avatar
Content-Type: multipart/form-data

Form数据:
- avatar: [图片文件]
```

### 获取头像信息
```
GET /users/{userId}/avatar
```

### 获取头像图片
```
GET /users/{userId}/avatar/image
```

### 获取头像历史
```
GET /users/{userId}/avatar/history
```

## 注意事项

- 上传图片格式限制为JPG/PNG/WebP
- 图片大小限制为2MB
- 所有图片将被处理为256x256像素的JPG格式
- 旧头像文件会自动清理 