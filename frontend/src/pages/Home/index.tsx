import React from 'react';

export const Home: React.FC = () => {
  return (
    <div className="w-full h-full">
      <h1 className="text-2xl font-bold mb-4">欢迎使用智能招投标系统</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 添加一些统计卡片或快捷入口 */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">招投标管理</h2>
          <p className="text-gray-600">查看和管理招投标相关事项</p>
        </div>
        {/* 添加更多卡片... */}
      </div>
    </div>
  );
};
