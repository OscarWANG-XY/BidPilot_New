import React from 'react';
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor';
import { Button } from '@/components/ui/button';

interface ReviewPanelProps {
  finalResult: string;
  isUpdating: boolean;
  isEditing: boolean;
  editingResult: string;
  onStartEditing: () => void;
  onEditingResultChange: (value: string) => void;
  onCancelEditing: () => void;
  onSaveEditedResult: () => Promise<void>;
  onCompleteReview?: () => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  finalResult,
  isUpdating,
  isEditing,
  editingResult,
  onStartEditing,
  onEditingResultChange,
  onCancelEditing,
  onSaveEditedResult,
  onCompleteReview
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">分析结果</h2>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={onCancelEditing}
                disabled={isUpdating}
              >
                取消编辑
              </Button>
              <Button 
                onClick={onSaveEditedResult}
                disabled={isUpdating}
              >
                {isUpdating ? '保存中...' : '保存修改'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={onStartEditing}
                disabled={isUpdating}
              >
                开始编辑
              </Button>
              {onCompleteReview && (
                <Button 
                  variant="default"
                  onClick={onCompleteReview}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  完成审核
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* TiptapEditor for viewing/editing the result */}
      <TiptapEditor
        initialContent={isEditing ? editingResult : finalResult}
        onChange={isEditing ? onEditingResultChange : undefined}
        readOnly={!isEditing}
        showToc={true}
        maxHeight={600}
      />
    </div>
  );
};

export default ReviewPanel; 