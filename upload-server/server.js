const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// 启用 CORS
app.use(cors());
app.use(express.json());

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 确保文件名使用 UTF-8 编码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

const upload = multer({ storage: storage });

// 文件上传路由
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有文件被上传' });
    }

    const fileData = {
      id: Date.now().toString(),
      fileName: originalName,
      fileSize: req.file.size,
      uploadTime: new Date().toISOString(),
      status: '待审核',
      projectId: req.body.projectId,
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      fileType: path.extname(req.file.originalname).slice(1)
    };

    console.log('File uploaded:', fileData);

    res.status(200).json(fileData);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: '文件上传失败', error: error.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`文件上传服务器运行在 http://localhost:${port}`);
}); 