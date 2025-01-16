const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001;

// 启用 CORS
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

// 确定文件类型的辅助函数
function determineFileType(mimeType, extension) {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') return 'WORD';
  if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') return 'EXCEL';
  if (mimeType.includes('image')) return 'IMAGE';
  return 'OTHER';
}

// 添加一个全局的日志中间件，记录所有请求
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 注意这里的/upload是app.post定义的上传API端点， 与/uploads是文件服务器端点不同。
// 这个端点需要与前端的调用对齐。
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有文件被上传' });
    }

    // 1. 处理文件上传
    const fileData = {
      id: uuidv4(),
      name: req.file.originalname,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      size: req.file.size,
      type: determineFileType(req.file.mimetype, path.extname(req.file.originalname).slice(1).toLowerCase()),
      mimeType: req.file.mimetype,
    };

    // 2. 返回文件信息
    res.status(200).json(fileData);
    
    // 不需要手动写入 db.json，让 json-server 来处理
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: '文件上传失败', 
      error: error.message 
    });
  }
});

// 添加文件删除路由 
app.delete('/uploads/:filename', (req, res) => {
  try {
    // 通过decodeURIComponent解码文件名，以处理特殊字符
    const filename = decodeURIComponent(req.params.filename);
    console.log('Decoded filename:', filename);
    const filepath = path.join(__dirname, 'uploads', filename);
    
    console.log('Delete request received:', {
      filename: filename,
      fullPath: filepath,
      exists: fs.existsSync(filepath),
      filesInUpload: fs.readdirSync(path.join(__dirname, 'uploads'))
    });

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.status(200).json({ message: '文件删除成功' });
    } else {
      res.status(404).json({ message: '文件不存在' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      message: '文件删除失败', 
      error: error.message 
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`文件上传服务器运行在 http://localhost:${port}`);
}); 