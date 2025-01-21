src/
├── main.tsx    // 入口文件
├── vite.config.ts // vite配置文件
├── routes/
│   ├── __root.tsx   // 根路由和布局
│   ├── index.tsx    // 首页路由
│   └── about.tsx    // 其他页面路由
├── components/
│   ├── ui/          // shadcn 组件
│   ├── layout/      // 布局相关组件
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── shared/      // 共享组件
├── types/          // 类型定义
├── utils/          // 工具函数
├── hooks/          // 自定义钩子
├── services/       // 服务层
├── contexts/       // 上下文
├── styles/         // 样式文件
├── public/         // 公共资源
├── .env            // 环境变量
├── .gitignore      // git忽略文件
├── README.md       // 项目说明文档
└── /vscode/        // vscode配置文件




用户认证系统目录架构：
src/
├── main.tsx    // 入口文件
├── routes/
│   ├── __root.tsx   // 根路由和布局
│   └── about.tsx    // 其他页面路由
├── contexts/auth-context.tsx  // 用户认证上下文
├── components/
│   ├── ui/          // shadcn 组件
│   ├── auth/      // 用户认证组件
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   └── shared/      // 共享组件
├── api/auth.ts          // 接口
├── utils/          // 工具函数
├── hooks/          // 自定义钩子
