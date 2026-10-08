import type { Track } from './Playlist'

let fileCounter = 0

/** Las canciones subidas se reproducen desde una URL `blob:` que solo existe mientras la página está abierta. */
export function isLocalTrack(track: Pick<Track, 'previewUrl'>): boolean {
  return track.previewUrl.startsWith('blob:')
}

/** "Shakira - Waka Waka.mp3" -> artista "Shakira", título "Waka Waka". */
export function parseFileName(name: string): { title: string; artist: string } {
  const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim()
  const parts = base.split(/\s+-\s+/)
  if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(' - ') }
  return { artist: 'Archivo local', title: base }
}

function readDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0)
    audio.onerror = () => resolve(0)
    audio.src = src
  })
}

export async function fileToTrack(file: File): Promise<Track> {
  const previewUrl = URL.createObjectURL(file)
  const { title, artist } = parseFileName(file.name)
  return {
    trackId: `file-${Date.now().toString(36)}-${fileCounter++}`,
    title,
    artist,
    album: 'Subida desde tu PC',
    cover: '',
    duration: await readDuration(previewUrl),
    previewUrl,
  }
}
