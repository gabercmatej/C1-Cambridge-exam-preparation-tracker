// A deliberately small markdown renderer: just what the planning documents use.
import { useState, type ReactNode } from 'react'
import { Icon } from './Icon'

export type Refs = Record<string, string>
export const parseRefs = (md: string): Refs => Object.fromEntries([...md.matchAll(/^\[([^\]]+)\]: (\S+)$/gm)].map((m) => [m[1], m[2]]))
export const plain = (md: string) => md.replace(/\[([^\]]+)\](\([^)]+\)|\[[^\]]+\])/g, '$1').replace(/\*\*|`|~~/g, '')

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\[([^\]]+)\]\[([^\]]+)\]|\*\*(.+?)\*\*|`([^`]+)`|~~(.+?)~~/g

export function Inline({ text, refs }: { text: string; refs?: Refs }): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    out.push(text.slice(last, m.index))
    last = m.index + m[0].length
    const url = m[2] ?? (m[4] ? refs?.[m[4]] : undefined)
    const linkText = m[1] ?? m[3]
    if (linkText !== undefined)
      out.push(url?.startsWith('http') ? <a key={m.index} href={url} target="_blank" rel="noopener noreferrer">{linkText}<Icon name="ext" className="ext" /></a> : linkText)
    else if (m[5] !== undefined) out.push(<strong key={m.index} className="font-semibold"><Inline text={m[5]} refs={refs} /></strong>)
    else if (m[6] !== undefined) out.push(<code key={m.index}>{m[6]}</code>)
    else out.push(<s key={m.index}>{m[7]}</s>)
  }
  out.push(text.slice(last))
  return <>{out}</>
}

export function Copy({ text, label = 'Copy', className = 'btn sm' }: { text: string; label?: string; className?: string }) {
  const [msg, setMsg] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setMsg('Copied')
    } catch {
      // Clipboard API unavailable: fall back to a selected off-screen textarea.
      const ta = Object.assign(document.createElement('textarea'), { value: text })
      document.body.append(ta)
      ta.select()
      setMsg(document.execCommand('copy') ? 'Copied' : 'Copy failed')
      ta.remove()
    }
    setTimeout(() => setMsg(''), 1500)
  }
  return <button type="button" className={className} onClick={copy}><Icon name={msg === 'Copied' ? 'check' : 'copy'} /><span aria-live="polite">{msg || label}</span></button>
}

export function Md({ text, refs }: { text: string; refs?: Refs }) {
  const lines = text.split('\n')
  const out: ReactNode[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line === '---' || /^\[[^\]]+\]: /.test(line)) continue
    if (line.startsWith('```')) {
      const start = ++i
      while (i < lines.length && !lines[i].startsWith('```')) i++
      // Copy for prompts sits on the row header (Library), so the block is just the verbatim text.
      out.push(<pre key={i} className="prompt">{lines.slice(start, i).join('\n')}</pre>)
    } else if (line.startsWith('|')) {
      const rows: string[][] = []
      for (; i < lines.length && lines[i].trim().startsWith('|'); i++) {
        const l = lines[i].trim()
        if (!/^\|[\s:|-]+\|$/.test(l)) rows.push(l.slice(1, -1).split('|').map((c) => c.trim()))
      }
      i--
      out.push(
        <div key={i} className="tbl">
          <table>
            <thead><tr>{rows[0].map((c, j) => <th key={j}><Inline text={c} refs={refs} /></th>)}</tr></thead>
            <tbody>{rows.slice(1).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}><Inline text={c} refs={refs} /></td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
    } else if (/^#{2,4} /.test(line)) {
      out.push(<h3 key={i}><Inline text={line.replace(/^#+ /, '')} refs={refs} /></h3>)
    } else if (/^(-|\d+\.) /.test(line)) {
      const indent = lines[i].search(/\S/)
      const bullet = line.match(/^(-|\d+\.)/)![0]
      out.push(<p key={i} className="li" style={{ marginLeft: indent * 6 }}><span aria-hidden={bullet === '-'}>{bullet === '-' ? '•' : bullet}</span><span><Inline text={line.replace(/^(-|\d+\.) /, '')} refs={refs} /></span></p>)
    } else if (line.startsWith('>')) {
      out.push(<blockquote key={i}><Inline text={line.replace(/^> ?/, '')} refs={refs} /></blockquote>)
    } else {
      out.push(<p key={i}><Inline text={line} refs={refs} /></p>)
    }
  }
  return <div className="md">{out}</div>
}
