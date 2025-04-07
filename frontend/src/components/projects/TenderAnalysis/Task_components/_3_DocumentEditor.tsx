import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Save } from 'lucide-react'
import TiptapEditor_lite from '@/components/shared/TiptapEditor_lite'

interface DocumentEditorProps {
    editorContent: string;
    isEditing: boolean; // Changed from lockStatus to a simple boolean
    loading: boolean;
    handleEditorContentChange: (content: string) => void;
    handleSaveContent: () => void;
  }
  
export const DocumentEditor: React.FC<DocumentEditorProps> = ({
    editorContent,
    isEditing,
    loading,
    handleEditorContentChange,
    handleSaveContent
  }) => {
    // Track if content has been modified since last save
    const [isContentModified, setIsContentModified] = useState(false);
    
    // Handle content changes
    const onContentChange = (content: string) => {
      handleEditorContentChange(content);
      setIsContentModified(true);
    };
    
    // Handle save with state update
    const onSaveContent = () => {
      handleSaveContent();
      setIsContentModified(false);
    };
    
    return (
      <>
        <div className="border rounded-md mb-4">
          <TiptapEditor_lite
            initialContent={editorContent}
            onChange={onContentChange}
            maxHeight={500}
            showToc={true}
            readOnly={!isEditing}
          />
        </div>
        
        {/* Save button - only shown when in edit mode and content is modified */}
        {isEditing && (
          <div className="mt-2 mb-4">
            <Button
              variant="outline"
              onClick={onSaveContent}
              disabled={loading || !isContentModified}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存内容
                </>
              )}
            </Button>
          </div>
        )}
      </>
    );
  };