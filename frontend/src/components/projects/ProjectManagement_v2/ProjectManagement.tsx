// ProjectManagement.tsx
import React, { useState } from 'react';
import { NavigationView } from './NavigationView';
import { ScrollView } from './ScrollView';
import { ProjectManagementProps } from '@/components/projects/ProjectManagement_v2/types';
import mockData from './mockData';

const ProjectManagement: React.FC<ProjectManagementProps> = ({ projectData = mockData }) => {
  const [activeTab, setActiveTab] = useState<string>(
    projectData.find(phase => phase.status === 'in-progress')?.id || projectData[0].id
  );
  const [viewMode, setViewMode] = useState<'navigation' | 'scroll'>('navigation');
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品研发项目</h1>
        <div className="flex items-center space-x-4">
          <button 
            className={`px-3 py-1 rounded text-sm ${viewMode === 'navigation' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            onClick={() => setViewMode('navigation')}
          >
            导航视图
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${viewMode === 'scroll' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            onClick={() => setViewMode('scroll')}
          >
            滚动视图
          </button>
        </div>
      </div>
      
      {viewMode === 'navigation' 
        ? <NavigationView phases={projectData} activeTab={activeTab} setActiveTab={setActiveTab} /> 
        : <ScrollView phases={projectData} activeTab={activeTab} />
      }
    </div>
  );
};

export default ProjectManagement;