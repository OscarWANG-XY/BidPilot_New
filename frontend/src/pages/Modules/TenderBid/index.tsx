import { Outlet } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TenderBidManagement() {  
  return (
    <div className="w-full max-w-5xl max-auto">   {/* 这个会宽度max-w-8xl max-auto*/}   
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">招投标管理系统</h1>
      </div>
      <Outlet />
    </div>
  );
} 