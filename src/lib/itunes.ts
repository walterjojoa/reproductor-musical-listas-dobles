import type { Track } from './Playlist'

/** Respuesta de la API pública de búsqueda de iTunes (no necesita clave y permite CORS). */
interface ItunesResult {
  trackId: number
  trackName: string
  artistName: string
  collectionName?: string
  artworkUrl100?: string
  trackTimeMillis?: number
  previewUrl?: string
}

export async function searchTracks(term: string, signal?: AbortSignal): Promise<Track[]> {
  const params = new URLSearchParams({
    term,
    media: 'music',
    entity: 'song',
    limit: '30',
    country: 'CO',
  })
  const response = await fetch(`https://itunes.apple.com/search?${params}`, { signal })
  if (!response.ok) throw new Error(`La búsqueda falló (HTTP ${response.status})`)
  const data = (await response.json()) as { results: ItunesResult[] }
  return data.results.filter((r) => r.previewUrl).map(toTrack)
}

export function toTrack(result: ItunesResult): Track {
  return {
    trackId: String(result.trackId),
    title: result.trackName,
    artist: result.artistName,
    album: result.collectionName ?? '',
    // La API entrega portadas de 100x100; la misma URL sirve otros tamaños.
    cover: (result.artworkUrl100 ?? '').replace('100x100bb', '300x300bb'),
    duration: Math.round((result.trackTimeMillis ?? 30000) / 1000),
    previewUrl: result.previewUrl ?? '',
  }
}
