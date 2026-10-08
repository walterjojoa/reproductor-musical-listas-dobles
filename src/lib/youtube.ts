import type { Track } from './Playlist'
import { load, save } from './storage'

/**
 * Canciones completas con el reproductor oficial de YouTube.
 * La clave va en VITE_YOUTUBE_API_KEY (.env.local en el PC, Environment Variables en Vercel).
 */
export const YOUTUBE_KEY: string | undefined = import.meta.env.VITE_YOUTUBE_API_KEY || undefined

/** Lo que usamos del reproductor de YouTube (IFrame Player API). */
export interface YTPlayer {
  loadVideoById(videoId: string): void
  cueVideoById(videoId: string): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  setVolume(volume: number): void
  destroy(): void
}

export interface YTEvents {
  onReady: () => void
  onStateChange: (event: { data: number }) => void
  onError: (event: { data: number }) => void
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: { width: string; height: string; playerVars: Record<string, number>; events: YTEvents },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

export const YT_ENDED = 0
export const YT_PLAYING = 1
export const YT_PAUSED = 2

let apiPromise: Promise<YTNamespace> | null = null

export function loadYouTubeApi(): Promise<YTNamespace> {
  apiPromise ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => {
      apiPromise = null
      reject(new Error('No se pudo cargar YouTube'))
    }
    document.head.append(script)
  })
  return apiPromise
}

// Cada búsqueda gasta cuota de la API, así que se recuerda el video de cada canción.
const CACHE_KEY = 'sonora:youtube-ids'
const cache = load<Record<string, string>>(CACHE_KEY, {})

export async function findVideoId(track: Track): Promise<string | null> {
  if (!YOUTUBE_KEY) return null
  if (cache[track.trackId]) return cache[track.trackId]

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '1',
    videoEmbeddable: 'true',
    videoCategoryId: '10', // Música
    q: `${track.artist} ${track.title} audio`,
    key: YOUTUBE_KEY,
  })
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
  if (!response.ok) throw new Error(`YouTube respondió HTTP ${response.status}`)
  const data = (await response.json()) as { items?: { id: { videoId?: string } }[] }
  const videoId = data.items?.[0]?.id.videoId ?? null
  if (videoId) {
    cache[track.trackId] = videoId
    save(CACHE_KEY, cache)
  }
  return videoId
}
