export const TAG_COLORS = [
  { id: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: '#3B82F6' },
  { id: 'green',  bg: 'bg-green-100',  text: 'text-green-700',  dot: '#22C55E' },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: '#A855F7' },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: '#F97316' },
  { id: 'pink',   bg: 'bg-pink-100',   text: 'text-pink-700',   dot: '#EC4899' },
  { id: 'teal',   bg: 'bg-teal-light', text: 'text-teal',       dot: '#00B2C0' },
  { id: 'red',    bg: 'bg-red-100',    text: 'text-red-700',    dot: '#EF4444' },
  { id: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: '#EAB308' },
]

export function getTagColor(name: string, tagColors?: Record<string, string>): string {
  if (tagColors && tagColors[name]) {
    const c = TAG_COLORS.find(c => c.id === tagColors[name])
    if (c) return `${c.bg} ${c.text}`
  }
  // fallback: hash-based
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const c = TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
  return `${c.bg} ${c.text}`
}

// TagManageModal is now embedded in SettingsModal — this file only exports utilities
