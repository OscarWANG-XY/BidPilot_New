import { createFileRoute } from '@tanstack/react-router'
import { useToast } from '@/_hooks/use-toast'
// import TestgroundPage from '@/playground/TiptapwithAPI/TiptapPage'
// import TiptapEditor_dev from '@/components/TiptapEditor_Pro/TiptapEditor_dev'
import TiptapEditor from '@/components/TiptapEditor_Pro/TiptapEditor'
import TestSSE from '@/_api/structuring_agent_api/TestSSE'


// import TipTapEditor from '@/components/TiptapEditor_Pro/Example'
// import AgentStateDataBoard from '@/components/projects/Agents/data/agentStateDataBoard'
// import SSEHistoryDataBoard from '@/components/projects/Agents/data/sseHistoryDataBoard'
// import DocumentDataBoard from '@/components/projects/Agents/data/documentDataBoard'
import SSEDataBoard from '@/components/projects/Agents/data/sseDataBoard'

export const Route = createFileRoute('/testground')({
  component: RouteComponent,
})

function RouteComponent() {

  const projectId = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'

  // const sampleContent = {"type": "doc", "content": [{"type": "heading", "attrs": {"textAlign": "left", "level": 1}, "content": [{"type": "text", "text": "🚨 A级：投标决策必需信息"}]}, {"type": "table", "content": [{"type": "tableRow", "content": [{"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "序号"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "信息类别"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "具体内容"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "所在章节"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "分析进展"}]}]}]}, {"type": "tableRow", "content": [{"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "A1"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "⏰ 时间节点"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "投标截止时间/开标时间"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}]}, {"type": "tableRow", "content": [{"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "A2"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "💰 保证金"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "投标保证金金额/缴纳方式"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}]}]}, {"type": "horizontalRule"}]};


  // const { toast } = useToast()

  // return <TipTapEditor />
  return (
    <div>
      <div>
        <br />
        {/* <AgentStateDataBoard projectId={projectId} /> */}
        <br />
        <br />
        {/* <SSEHistoryDataBoard projectId={projectId} /> */}
        <br />
        {/* <DocumentDataBoard projectId={projectId} docType='final-document' /> */}
        <br />
        <TestSSE />
        {/* <SSEDataBoard projectId={projectId} /> */}
        {/* <br />
        <TiptapEditor_dev />        
        <br /> */}
        <br />
        {/* <TiptapEditor 
        initialContent={sampleContent}
        // onContentChange={()=>{console.log('onContentChange')}}
        onSave={()=>{toast({title: '保存成功', description: '内容已保存到服务器'})}}
        readOnly={false}
        showTOC={true}
        /> */}
      </div>
    </div>

  )
}
