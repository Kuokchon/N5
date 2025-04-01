/**
 * 文件上传中间件
 * 
 * 用于处理文件上传，支持内存存储模式
 * 验证文件类型、大小，并提供错误处理
 */

const multer = require('multer');
const path = require('path');

// 内存存储，不直接写入磁盘
const storage = multer.memoryStorage();

// 允许的MIME类型
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('不支持的文件类型，请上传JPG或PNG图片'), false); // 拒绝文件
  }
};

// 创建上传中间件实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: '文件太大，最大支持2MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `上传错误: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = { upload, handleUploadError }; 