const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const { generateToken, authMiddleware } = require('./middleware/auth');
const bcrypt = require('bcryptjs');

// 基础中间件
server.use(middlewares);
server.use(jsonServer.bodyParser);

// CORS 配置
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// 认证中间件
server.use(authMiddleware);

// 获取验证码
server.post('/auth/captcha', (req, res) => {
  const { phone, type } = req.body;

  // 模拟生成验证码
  const captcha = '123456'; // 固定验证码，方便测试
  console.log(`[模拟验证码] 手机号: ${phone}, 验证码: ${captcha}, 类型: ${type}`);

  res.json({ message: 'Captcha sent successfully' });
});

// 验证码登录
server.post('/auth/login/captcha', async (req, res) => {
  const { phone, captcha, agreeToTerms } = req.body;
  const db = router.db;

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  // 查找用户
  const user = db.get('users').find({ phone }).value();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // 生成token
  const token = generateToken(user);

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token,
  });
});

// 密码登录
server.post('/auth/login/password', async (req, res) => {
  const { phoneOrEmail, password, agreeToTerms } = req.body;
  const db = router.db;

  // 查找用户
  const user = db.get('users').find({ phone: phoneOrEmail }).value();

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // 验证密码
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // 生成token
  const token = generateToken(user);

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token,
  });
});

// 微信扫码登录
server.post('/auth/login/wechat', (req, res) => {
  const { code } = req.body;

  // 模拟微信登录
  const tempToken = generateToken({ code });
  res.json({
    tempToken,
    wechatUserInfo: {
      nickname: '微信用户',
      avatar: 'https://example.com/avatar.png',
    },
  });
});

// 微信扫码登录后绑定手机号
server.post('/auth/wechat/bind-phone', async (req, res) => {
  const { phone, captcha } = req.body;
  const db = router.db;

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  // 查找用户
  const user = db.get('users').find({ phone }).value();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // 生成token
  const token = generateToken(user);

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token,
  });
});

// 忘记密码
server.post('/auth/forgot-password', async (req, res) => {
  const { phone, captcha, newPassword } = req.body;
  const db = router.db;

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  // 查找用户
  const user = db.get('users').find({ phone }).value();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.get('users').find({ phone }).assign({ password: hashedPassword }).write();

  res.json({ message: 'Password reset successfully' });
});

// 用户注册
server.post('/auth/register', async (req, res) => {
  const { phone, captcha, password, confirmPassword, agreeToTerms } = req.body;
  const db = router.db;

  // 检查密码是否匹配
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // 模拟验证码验证
  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  // 检查用户是否已存在
  const existingUser = db.get('users').find({ phone }).value();
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // 密码加密
  const hashedPassword = await bcrypt.hash(password, 10);

  // 创建新用户
  const user = {
    id: Date.now(),
    phone,
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.get('users').push(user).write();

  // 生成token
  const token = generateToken(user);

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({
    user: userWithoutPassword,
    token,
  });
});

// 获取当前用户信息
server.get('/auth/me', (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// 使用路由
server.use(router);

// 错误处理中间件
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});