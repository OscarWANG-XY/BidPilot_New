import axios from 'axios';
import jsonServer from 'json-server';
import { Request, Response, NextFunction } from 'express';
import { generateToken, authMiddleware } from './middleware/auth';
import bcrypt from 'bcryptjs';
import { CaptchaClient } from './utils/client';
import { SmsService } from './services/sms';
import { VerificationService } from './services/verification';
import { smsLimiter, loginLimiter } from './middleware/rate-limit';

// 定义接口
interface User {
  id: number;
  phone: string;
  email?: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Database {
  users: User[];
}

// 不需要重复声明 Request 接口扩展，因为已经在 auth.ts 中声明过了

const server = jsonServer.create();
const router = jsonServer.router<Database>('db.json');
const middlewares = jsonServer.defaults();

// ---------------  应用默认中间件 ---------------
server.use(middlewares);
server.use(jsonServer.bodyParser);

// ---------------  配置 CORS（跨域资源共享） ---------------
server.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// ---------------  应用认证中间件 ---------------  
server.use(authMiddleware);

// ---------------  获取验证码 ---------------
server.post('/auth/captcha', async (req: Request, res: Response) => {
  const { phone, type, captchaVerifyParam } = req.body;

  try {
    // 验证阿里云验证码
    const isValid = await CaptchaClient.verifyCaptcha(captchaVerifyParam);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid captcha verification' });
    }

    // 生成短信验证码（这里仍然使用模拟验证码，实际应该对接短信服务）
    const captcha = '123456';
    console.log(`[模拟验证码] 手机号: ${phone}, 验证码: ${captcha}, 类型: ${type}`);

    res.json({ message: 'Captcha sent successfully' });
  } catch (error) {
    console.error('验证码服务错误:', error);
    res.status(500).json({ message: 'Captcha service error' });
  }
});

// ---------------  验证码登录 ---------------
server.post('/auth/login/captcha', loginLimiter, async (req: Request, res: Response) => {
  const { phone, captcha, agreeToTerms } = req.body;
  const db = router.db as any;

  try {
    // 验证短信验证码
    const isValid = await VerificationService.verifyCode(phone, captcha);
    if (!isValid) {
      return res.status(400).json({ message: '验证码无效或已过期' });
    }

    const user = db.get('users').find({ phone }).value();
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// ---------------  密码登录 ---------------  
server.post('/auth/login/password', async (req: Request, res: Response) => {
  const { phoneOrEmail, password, agreeToTerms } = req.body;
  const db = router.db as any;
  console.log('尝试密码登录:', { phoneOrEmail, password });

  const user = db.get('users').find((user: User) => 
    user.phone === phoneOrEmail || user.email === phoneOrEmail
  ).value();

  if (!user) {
    console.log('用户不存在');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  console.log('找到用户:', { 
    phone: user.phone, 
    email: user.email,
    storedPasswordHash: user.password 
  });

  const validPassword = await bcrypt.compare(password, user.password);
  console.log('密码验证:', {
    inputPassword: password,
    storedHash: user.password,
    validPassword: validPassword
  });
  
  if (!validPassword) {
    console.log('密码不正确');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user);

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token,
  });
});

// ---------------  微信扫码登录 ---------------    
server.post('/auth/login/wechat', (req: Request, res: Response) => {
  const { code } = req.body;

  const tempToken = generateToken({ code, role: 'temporary' });
  res.json({
    tempToken,
    wechatUserInfo: {
      nickname: '微信用户',
      avatar: 'https://example.com/avatar.png',
    },
  });
});

// ---------------  微信扫码登录后绑定手机号 ---------------      
server.post('/auth/wechat/bind-phone', async (req: Request, res: Response) => {
  const { phone, captcha } = req.body;
  const db = router.db as any;

  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  const user = db.get('users').find({ phone }).value();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const token = generateToken(user);

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token,
  });
});

// ------------------  忘记密码 ------------------  
server.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { phone, captcha, newPassword } = req.body;
  const db = router.db as any;

  if (captcha !== '123456') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  const user = db.get('users').find({ phone }).value();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.get('users').find({ phone }).assign({ password: hashedPassword }).write();

  res.json({ message: 'Password reset successfully' });
});

// ------------------------  用户注册 --------------------------  
server.post('/auth/register', async (req: Request, res: Response) => {
  const { phone, captcha, password, confirmPassword, agreeToTerms } = req.body;
  const db = router.db as any;
  console.log('准备注册的用户信息：', { phone, captcha, password, confirmPassword, agreeToTerms });

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (captcha !== '123123') {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  const existingUser = db.get('users').find({ phone }).value();
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user: User = {
    id: Date.now(),
    phone,
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.get('users').push(user).write();

  const token = generateToken(user);

  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({
    user: userWithoutPassword,
    token,
  });
});

// ---------------  获取当前用户信息 ---------------    
server.get('/auth/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { password: _, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// ---------------  图形验证码验证 ---------------
server.post('/auth/graphical_captcha/verify', async (req: Request, res: Response) => {
  const { captchaVerifyParam, ...bizParams } = req.body;

  try {
    console.log('收到验证请求，验证参数:', captchaVerifyParam);
    
    // 调用阿里云验证码服务
    const isValid = await CaptchaClient.verifyCaptcha(captchaVerifyParam);
    console.log('阿里云验证结果:', isValid);
    
    if (!isValid) {
      console.log('验证失败');
      return res.status(400).json({ 
        captchaResult: false,
        bizResult: false,
        message: '图形验证码验证失败'
      });
    }

    console.log('验证成功');
    return res.json({
      captchaResult: true,
      bizResult: true
    });
  } catch (error) {
    console.error('图形验证码验证错误:', error);
    res.status(500).json({ 
      captchaResult: false,
      bizResult: false,
      message: '图形验证码服务错误'
    });
  }
});

// ---------------  发送短信验证码 ---------------
server.post('/auth/sms/send', smsLimiter, async (req: Request, res: Response) => {
  const { phone, scene } = req.body;

  try {
    // 检查发送频率
    const canSend = await VerificationService.checkSmsFrequency(phone);
    if (!canSend) {
      return res.status(429).json({ message: '今日短信发送次数已达上限' });
    }

    // 生成验证码
    const code = VerificationService.generateCode();
    
    // 发送短信
    const sent = await SmsService.sendSms(phone, code);
    if (!sent) {
      return res.status(500).json({ message: '短信发送失败' });
    }

    // 存储验证码
    await VerificationService.saveCode(phone, code);

    res.json({ message: '短信验证码发送成功' });
  } catch (error) {
    console.error('短信服务错误:', error);
    res.status(500).json({ message: '短信服务错误' });
  }
});

// ---------------  验证短信验证码 ---------------
server.post('/auth/sms/verify', async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  try {
    if (code !== '123456') {
      return res.status(400).json({ 
        success: false,
        message: '短信验证码错误'
      });
    }

    res.json({
      success: true,
      message: 'SMS code verified successfully'
    });
  } catch (error) {
    console.error('短信验证码验证错误:', error);
    res.status(500).json({ 
      success: false,
      message: 'SMS verification error'
    });
  }
});

// ---------------  使用 json-server 的路由处理器 ---------------    
server.use(router);

// ---------------  错误处理中间件 ---------------      
server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// ---------------  启动服务器 ---------------          
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});