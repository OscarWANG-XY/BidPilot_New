const axios = require('axios');

// 引入所需的库和模块
const jsonServer = require('json-server'); // json-server 是一个快速创建 RESTful API 的工具
const server = jsonServer.create(); // 创建一个 Express 服务器实例
const router = jsonServer.router('db.json'); // 使用 db.json 文件作为数据源，创建路由处理器
const middlewares = jsonServer.defaults(); // 获取 json-server 的默认中间件
const { generateToken, authMiddleware } = require('../middleware/auth'); // 引入自定义的认证中间件和生成 JWT 的函数
const bcrypt = require('bcryptjs'); // 引入 bcrypt 库，用于密码加密和验证




// ---------------  应用默认中间件 ---------------
server.use(middlewares); // 使用 json-server 的默认中间件，例如日志、静态文件服务等
server.use(jsonServer.bodyParser); // 使用 json-server 的请求体解析器，用于解析 JSON 数据



// ---------------  配置 CORS（跨域资源共享） ---------------
server.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 允许所有来源访问
  res.header('Access-Control-Allow-Headers', '*'); // 允许所有请求头
  res.header('Access-Control-Allow-Methods', '*'); // 允许所有 HTTP 方法
  next(); // 继续处理下一个中间件或路由
});



// ---------------  应用认证中间件 ---------------  
server.use(authMiddleware); // 使用自定义的认证中间件，验证请求中的 JWT 令牌




// ---------------  获取验证码 ---------------
server.post('/auth/captcha', (req, res) => {  // req, res 是 express 框架的请求和响应对象
  const { phone, type } = req.body; // 从请求体中获取手机号和验证码类型

  // 模拟生成验证码
  const captcha = '123456'; // 固定验证码，方便测试
  console.log(`[模拟验证码] 手机号: ${phone}, 验证码: ${captcha}, 类型: ${type}`);

  // 返回成功消息
  res.json({ message: 'Captcha sent successfully' });
});



// ---------------  验证码登录 （测试通过） ---------------
server.post('/auth/login/captcha', async (req, res) => {
  const { phone, captcha, agreeToTerms } = req.body; // 从请求体中获取手机号、验证码和同意条款
  const db = router.db; // 获取数据库实例

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' }); // 如果验证码不正确，返回错误消息
  }  //语法：链式调用，设置hTTP 状态码和返回JSON数据 

  // 查找用户； db是json-server的数据库操作对象， get,find,value是json-server的数据库操作方法 
  const user = db.get('users').find({ phone }).value(); // 在数据库中查找匹配的手机号

  if (!user) {
    return res.status(400).json({ message: 'User not found' }); // 如果用户不存在，返回错误消息
  }

  // 生成 JWT 令牌
  const token = generateToken(user); // 使用用户信息生成 JWT 令牌

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user; // 从用户对象中移除密码字段
  res.json({
    user: userWithoutPassword, // 返回不包含密码的用户信息
    token, // 返回 JWT 令牌
  });
});

// ---------------  密码登录 (测试通过) ---------------  
server.post('/auth/login/password', async (req, res) => {
  const { phoneOrEmail, password, agreeToTerms } = req.body; // 从请求体中获取手机号/邮箱、密码和同意条款
  const db = router.db; // 获取数据库实例
  console.log('尝试密码登录:', { phoneOrEmail, password });

  // 查找用户
  const user = db.get('users').find(user => 
    user.phone === phoneOrEmail || user.email === phoneOrEmail
  ).value(); // 在数据库中查找匹配的手机号或邮箱

  if (!user) {
    console.log('用户不存在');
    return res.status(400).json({ message: 'Invalid credentials' }); // 如果用户不存在，返回错误消息
  }

  console.log('找到用户:', { 
    phone: user.phone, 
    email: user.email,
    storedPasswordHash: user.password 
  });


  // 验证密码
  const validPassword = await bcrypt.compare(password, user.password); // 使用 bcrypt 比较用户输入的密码和数据库中的密码
  console.log('密码验证:', {
    inputPassword: password,
    storedHash: user.password,
    validPassword: validPassword
  });
  
  if (!validPassword) {
    console.log('密码不正确');
    return res.status(400).json({ message: 'Invalid credentials' }); // 如果密码不正确，返回错误消息
  }

  // 生成 JWT 令牌
  const token = generateToken(user); // 使用用户信息生成 JWT 令牌

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user; // 从用户对象中移除密码字段
  res.json({
    user: userWithoutPassword, // 返回不包含密码的用户信息
    token, // 返回 JWT 令牌
  });
});



// ---------------  微信扫码登录 ---------------    
server.post('/auth/login/wechat', (req, res) => {
  const { code } = req.body; // 从请求体中获取微信授权码

  // 模拟微信登录
  const tempToken = generateToken({ code }); // 使用授权码生成临时 JWT 令牌
  res.json({
    tempToken, // 返回临时令牌
    wechatUserInfo: {
      nickname: '微信用户', // 模拟微信用户昵称
      avatar: 'https://example.com/avatar.png', // 模拟微信用户头像
    },
  });
});

// ---------------  微信扫码登录后绑定手机号 ---------------      
server.post('/auth/wechat/bind-phone', async (req, res) => {
  const { phone, captcha } = req.body; // 从请求体中获取手机号和验证码
  const db = router.db; // 获取数据库实例

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' }); // 如果验证码不正确，返回错误消息
  }

  // 查找用户
  const user = db.get('users').find({ phone }).value(); // 在数据库中查找匹配的手机号

  if (!user) {
    return res.status(400).json({ message: 'User not found' }); // 如果用户不存在，返回错误消息
  }

  // 生成 JWT 令牌
  const token = generateToken(user); // 使用用户信息生成 JWT 令牌

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user; // 从用户对象中移除密码字段
  res.json({
    user: userWithoutPassword, // 返回不包含密码的用户信息
    token, // 返回 JWT 令牌
  });
});

// ------------------  忘记密码 （测试通过） ------------------  
server.post('/auth/forgot-password', async (req, res) => {
  const { phone, captcha, newPassword } = req.body; // 从请求体中获取手机号、验证码和新密码
  const db = router.db; // 获取数据库实例

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' }); // 如果验证码不正确，返回错误消息
  }

  // 查找用户
  const user = db.get('users').find({ phone }).value(); // 在数据库中查找匹配的手机号

  if (!user) {
    return res.status(400).json({ message: 'User not found' }); // 如果用户不存在，返回错误消息
  }

  // 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10); // 使用 bcrypt 对新密码进行加密
  db.get('users').find({ phone }).assign({ password: hashedPassword }).write(); // 更新数据库中的用户密码

  // 返回成功消息
  res.json({ message: 'Password reset successfully' });
});

// ------------------------  用户注册 （测试通过）--------------------------  
server.post('/auth/register', async (req, res) => {
  const { phone, captcha, password, confirmPassword, agreeToTerms } = req.body; // 从请求体中获取手机号、验证码、密码、确认密码和同意条款
  const db = router.db; // 获取数据库实例
  console.log('准备注册的用户信息：', { phone, captcha, password, confirmPassword, agreeToTerms });

  // 检查密码是否匹配
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' }); // 如果密码不匹配，返回错误消息
  }

  // 模拟验证码验证
  if (captcha !== '123123') {
    return res.status(400).json({ message: 'Invalid captcha' }); // 如果验证码不正确，返回错误消息
  }

  // 检查用户是否已存在
  const existingUser = db.get('users').find({ phone }).value(); // 在数据库中查找匹配的手机号
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' }); // 如果用户已存在，返回错误消息
  }

  // 密码加密
  const hashedPassword = await bcrypt.hash(password, 10); // 使用 bcrypt 对密码进行加密

  // 创建新用户
  const user = {
    id: Date.now(), // 使用当前时间戳作为用户 ID
    phone, // 用户手机号
    password: hashedPassword, // 加密后的密码
    role: 'user', // 用户角色
    createdAt: new Date(), // 用户创建时间
    updatedAt: new Date(), // 用户更新时间
  };

  db.get('users').push(user).write(); // 将新用户添加到数据库

  // 生成 JWT 令牌
  const token = generateToken(user); // 使用用户信息生成 JWT 令牌

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user; // 从用户对象中移除密码字段
  res.status(201).json({
    user: userWithoutPassword, // 返回不包含密码的用户信息
    token, // 返回 JWT 令牌
  });
});

// ---------------  获取当前用户信息 ---------------    
server.get('/auth/me', (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user; // 从请求对象中获取当前用户信息，并移除密码字段
  res.json(userWithoutPassword); // 返回不包含密码的用户信息
});

// ---------------  使用 json-server 的路由处理器 ---------------    
server.use(router);

// ---------------  错误处理中间件 ---------------      
server.use((err, req, res, next) => {
  console.error(err.stack); // 打印错误堆栈信息
  res.status(500).json({ message: 'Something broke!' }); // 返回 500 错误消息
});

// ---------------  启动服务器 ---------------          
const PORT = 3000; // 设置服务器端口
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`); // 打印服务器启动信息
});