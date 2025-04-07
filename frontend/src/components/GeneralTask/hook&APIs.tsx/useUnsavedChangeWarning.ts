import { useEffect } from 'react';

/**
 * Hook to warn users about unsaved changes when they try to leave the page
 * @param hasUnsavedChanges Boolean indicating if there are unsaved changes
 * @param message Custom message to show (optional)
 */
export const useUnsavedChangesWarning = (
  hasUnsavedChanges: boolean,
  message: string = '您有未保存的更改，确定要离开吗？'
) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();

        // 虽然 returnValue 被标记为废弃(deprecated)，但目前仍需要设置它
        // 因为大多数浏览器仍然需要它来显示确认对话框
        // @ts-ignore - 忽略 TypeScript 关于 returnValue 废弃的警告
        e.returnValue = message; // Standard for most browsers
        return message; // For some older browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);
};