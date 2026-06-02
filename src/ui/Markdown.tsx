import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renders untrusted LLM markdown as React children only (no raw HTML). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
