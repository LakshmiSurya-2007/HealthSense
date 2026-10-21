import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`markdown-content text-xs sm:text-sm leading-relaxed space-y-2.5 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-black text-white mt-3 mb-1.5 pb-1 border-b border-white/10 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-white mt-3 mb-1.5 flex items-center gap-2 text-primary-200">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-white/95 mt-2.5 mb-1 text-purple-300">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-xs font-semibold text-white/85 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-white/85 leading-relaxed my-1.5 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 my-2 text-white/80 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 my-2 text-white/80 marker:text-secondary font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-white/85 leading-relaxed pl-0.5">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-white/90 italic">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 pl-3.5 py-1.5 border-l-2 border-primary bg-primary/10 rounded-r-xl text-white/90 text-xs italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/08 text-white font-bold border-b border-white/10">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/05 bg-white/02">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/04 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-white font-semibold text-[11px] uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-white/80 text-xs">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-white/10 text-pink-300 font-mono text-[11px]">
                {children}
              </code>
            ) : (
              <pre className="p-3 my-2 rounded-xl bg-black/40 border border-white/10 text-white/90 font-mono text-xs overflow-x-auto">
                <code>{children}</code>
              </pre>
            )
          },
          hr: () => (
            <hr className="my-3 border-white/10" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-secondary underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
