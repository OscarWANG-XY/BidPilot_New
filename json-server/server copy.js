// server.js
const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
const { generateToken, authMiddleware } = require('./middleware/auth')
const bcrypt = require('bcryptjs')

// 基础中间件
server.use(middlewares)
server.use(jsonServer.bodyParser)

// CORS 配置
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

// 认证中间件
server.use(authMiddleware)

// 注册路由
server.post('/auth/register', async (req, res) => {
  const { email, username, password } = req.body
  const db = router.db

  // 检查用户是否已存在
  const existingUser = db
    .get('users')
    .find({ email })
    .value()

  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' })
  }

  // 密码加密
  const hashedPassword = await bcrypt.hash(password, 10)

  // 创建新用户
  const user = {
    id: Date.now(),
    email,
    username,
    password: hashedPassword,
  }

  db.get('users')
    .push(user)
    .write()

  // 生成token
  const token = generateToken(user)

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user
  res.status(201).json({
    user: userWithoutPassword,
    token
  })
})

// 登录路由
server.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const db = router.db

  const user = db
    .get('users')
    .find({ email })
    .value()

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' })
  }

  // 验证密码
  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) {
    return res.status(400).json({ message: 'Invalid credentials' })
  }

  // 生成token
  const token = generateToken(user)

  // 返回用户信息（不包含密码）
  const { password: _, ...userWithoutPassword } = user
  res.json({
    user: userWithoutPassword,
    token
  })
})

// 获取当前用户信息
server.get('/auth/me', (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user
  res.json(userWithoutPassword)
})

// 使用路由
server.use(router)

// 错误处理中间件
server.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something broke!' })
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`)
})