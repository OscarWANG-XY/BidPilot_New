import React, { useState } from 'react';

interface ConfigurationPreviewProps {
  context?: string;
  prompt?: string;
  companyInfo?: any;
}

const ConfigurationPreview: React.FC<ConfigurationPreviewProps> = ({
  context,
  prompt,
  companyInfo
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-gray-50 border-b border-gray-200 p-3">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="text-sm font-medium text-gray-700">配置信息预览</h3>
        <svg 
          className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="mt-3 text-sm">
          {context && (
            <div className="mb-3">
              <h4 className="font-medium text-gray-700 mb-1">上下文</h4>
              <p className="text-gray-600 line-clamp-3">{context}</p>
            </div>
          )}
          
          {prompt && (
            <div className="mb-3">
              <h4 className="font-medium text-gray-700 mb-1">提示词</h4>
              <p className="text-gray-600 line-clamp-3">{prompt}</p>
            </div>
          )}
          
          {companyInfo && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">公司信息</h4>
              <div className="text-gray-600">
                {Object.entries(companyInfo).map(([key, value]) => (
                  <p key={key}><span className="font-medium">{key}:</span> {String(value)}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigurationPreview; 