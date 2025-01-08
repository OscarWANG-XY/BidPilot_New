
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/pages/Layout';
import { TenderBidManagement } from '@/pages/Modules/TenderBid';
import { TenderBidList } from '@/pages/Modules/TenderBid/List';
import { TenderBidParser } from '@/pages/Modules/TenderBid/Parser';
import { CompanyProfile } from '@/pages/Modules/Company';
import { UserManagement } from '@/pages/Modules/User';
import { Home } from '@/pages/Home';

export const router = createBrowserRouter([
  {
    path: "/",                     // 根路径
    element: <Layout />,           // 最外层的布局组件
    children: [                    // Layout组件的子路由
      {
        index: true,    // 默认路由
        element: <Home />,
      },
      // 招投标管理模块
      {
        path: "tender-bid-management",      // 招投标管理模块的路径
        element: <TenderBidManagement />,    // 招投标管理模块的组件
        children: [                         // TenderBidManagement组件的子路由
          {
            index: true,                   // 默认子路由
            element: <TenderBidList />,    // 显示任务列表
          },
          {
            path: "parse",                  // 解析任务的路径
            element: <TenderBidParser />,   // 显示解析器
          },
          {
            path: ":taskId",                // 动态路由，用于查看具体任务
            element: <TenderBidParser />,   // 显示解析器
          },
        ],
      },
      // 企业档案模块
      {
        path: "company",
        element: <CompanyProfile />,
      },
      // 用户管理模块
      {
        path: "users",
        element: <UserManagement />,
      },
    ],
  },
]);
