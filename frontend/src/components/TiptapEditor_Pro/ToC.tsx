import { TextSelection } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { MouseEvent } from 'react'

export interface ToCItemData {
  id: string
  level: number
  textContent: string
  isActive: boolean
  isScrolledOver: boolean
  itemIndex: number
}

interface ToCItemProps {
  item: ToCItemData
  onItemClick: (e: MouseEvent<HTMLAnchorElement>, id: string) => void
}

export const ToCItem = ({ item, onItemClick }: ToCItemProps) => {
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
      >
        {item.textContent}
      </a>
    </div>
  )
}

export const ToCEmptyState = () => {
  return (
    <div className="empty-state">
      <p>Start editing your document to see the outline.</p>
    </div>
  )
}

interface ToCProps {
  items?: ToCItemData[]
  editor: Editor | null
}

export const ToC = ({
  items = [],
  editor,
}: ToCProps) => {
  if (items.length === 0) {
    return <ToCEmptyState />
  }

  const onItemClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()

    if (editor) {
      const element = editor.view.dom.querySelector(`[data-toc-id="${id}"]`)
      
      if (element) {
        const pos = editor.view.posAtDOM(element, 0)

        // set focus
        const tr = editor.view.state.tr

        tr.setSelection(new TextSelection(tr.doc.resolve(pos)))

        editor.view.dispatch(tr)

        editor.view.focus()

        if (history.pushState) { // eslint-disable-line
          history.pushState(null, '', `#${id}`) // eslint-disable-line
        }

        window.scrollTo({
          top: element.getBoundingClientRect().top + window.scrollY,
          behavior: 'smooth',
        })
      }
    }
  }

  return (
    <>
      {items.map((item) => (
        <ToCItem onItemClick={onItemClick} key={item.id} item={item} />
      ))}
    </>
  )
}