/** Strip markdown / collapse agent lead into plain short prose for the chat bubble. */
export function sanitizeAgentProse(text: string): string {
  if (!text.trim()) return text
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const cleaned: string[] = []
  for (const raw of lines) {
    let line = raw.trim()
    if (!line) continue
    while (line.startsWith('#')) line = line.replace(/^#+\s*/, '')
    if (line.startsWith('- ') || line.startsWith('* ')) line = line.slice(2).trimStart()
    line = line.replace(/\*\*/g, '').replace(/__/g, '').replace(/`/g, '')
    if (line) cleaned.push(line)
  }
  return cleaned.slice(0, 6).join(' ').trim()
}
