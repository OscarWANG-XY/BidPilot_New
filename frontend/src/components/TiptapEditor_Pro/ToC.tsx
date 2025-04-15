import React from 'react';
import { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';

interface ToCItemProps {
  item: {
    id: string;
    level: number;
    itemIndex: string;
    textContent: string;
    isActive: boolean;
    isScrolledOver: boolean;
  };
  onItemClick: (e: React.MouseEvent, id: string) => void;
}

export const ToCItem: React.FC<ToCItemProps> = ({ item, onItemClick }) => {
  return (
    <div 
      className={`${item.isActive && !item.isScrolledOver ? 'is-active' : ''} ${item.isScrolledOver ? 'is-scrolled-over' : ''}`} 
      style={{
        '--level': item.level,
      } as React.CSSProperties}
    >
      <a 
        href={`#${item.id}`} 
        onClick={e => onItemClick(e, item.id)} 
        data-item-index={item.itemIndex}
        className="block pl-4 py-1 hover:bg-gray-100 truncate"
        style={{ paddingLeft: `${item.level * 0.75}rem` }}
      >
        {item.textContent}
      </a>
    </div>
  );
};

export const ToCEmptyState: React.FC = () => {
  return (
    <div className="p-4 text-gray-500 italic">
      <p>开始编辑文档以查看目录</p>
    </div>
  );
};

interface ToCProps {
  items?: any[];
  editor: Editor | null;
}

export const ToC: React.FC<ToCProps> = ({ items = [], editor }) => {
  if (items.length === 0) {
    return <ToCEmptyState />;
  }

  const onItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();

    if (editor) {
      const element = editor.view.dom.querySelector(`[data-toc-id="${id}"]`);
      if (!element) return;
      
      const pos = editor.view.posAtDOM(element, 0);

      // 设置焦点
      const tr = editor.view.state.tr;
      tr.setSelection(new TextSelection(tr.doc.resolve(pos)));
      editor.view.dispatch(tr);
      editor.view.focus();

      if (history.pushState) {
        history.pushState(null, "", `#${id}`);
      }

      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="toc-container">
      {items.map((item) => (
        <ToCItem onItemClick={onItemClick} key={item.id} item={item}/>
      ))}
    </div>
  );
};

// 使用React.memo优化性能
export const MemorizedToC = React.memo(ToC);