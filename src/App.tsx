import { useEffect, useReducer, useRef, useState } from 'react'
import type { AddWhere } from './components/AddMenu'
import { ListDiagram } from './components/ListDiagram'
import { PlayerBar } from './components/PlayerBar'
import { TrackRow } from './components/TrackRow'
import { searchTracks } from './lib/itunes'
import { Playlist, type RepeatMode, type Song, type Track } from './lib/Playlist'
import { load, save } from './lib/storage'
import { formatTime } from './lib/time'

const SUGGESTIONS = ['Shakira', 'Karol G', 'Bad Bunny', 'Carlos Vives', 'Queen', 'Coldplay', 'Feid', 'Taylor Swift']
const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' }
const QUEUE_KEY = 'sonora:queue'
const LIKED_KEY = 'sonora:liked'
const VOLUME_KEY = 'sonora:volume'

interface SavedQueue {
  songs: Song[]
  currentId: string | null
  repeat: RepeatMode
}

let idCounter = 0
const newId = () => `${Date.now().toString(36)}-${idCounter++}`

/** Reconstruye la lista doble con lo que quedó guardado en el navegador. */
function restorePlaylist(): Playlist {
  const playlist = new Playlist()
  const saved = load<SavedQueue | null>(QUEUE_KEY, null)
  if (saved && Array.isArray(saved.songs)) {
    for (const song of saved.songs) playlist.add(song, 'end')
    if (saved.currentId) playlist.select(saved.currentId)
    if (saved.repeat) playlist.repeat = saved.repeat
  }
  return playlist
}

type Tab = 'search' | 'liked'

export default function App() {
  // La lista doble vive fuera del estado de React; `changed` vuelve a pintar y guarda.
  const [playlist] = useState(restorePlaylist)
  const [version, changed] = useReducer((n: number) => n + 1, 0)

  const [tab, setTab] = useState<Tab>('search')
  // ?q=artista en la URL abre la app con esa búsqueda.
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') ?? '')
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [liked, setLiked] = useState<Record<string, Track>>(() => load(LIKED_KEY, {}))

  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => load(VOLUME_KEY, 0.8))
  const [showDiagram, setShowDiagram] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentNode = playlist.current
  const current = currentNode?.value ?? null
  const queue = [...playlist.songs.nodes()]

  // ---------- Guardado ----------
  useEffect(() => {
    save(QUEUE_KEY, {
      songs: playlist.songs.toArray(),
      currentId: playlist.current?.value.id ?? null,
      repeat: playlist.repeat,
    } satisfies SavedQueue)
  }, [version, playlist])

  useEffect(() => save(LIKED_KEY, liked), [liked])

  useEffect(() => {
    save(VOLUME_KEY, volume)
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  // ---------- Búsqueda (espera 350 ms mientras se escribe) ----------
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setSearchError(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    const timer = setTimeout(() => {
      searchTracks(term, controller.signal)
        .then((tracks) => {
          setResults(tracks)
          setSearchError(null)
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearchError('No se pudo buscar. Revisa tu conexión a internet.')
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // ---------- Audio ----------
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!current) {
      audio.pause()
      audio.removeAttribute('src')
      return
    }
    if (audio.src !== current.previewUrl) audio.src = current.previewUrl
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [current, isPlaying])

  // Título, artista y portada en los controles del sistema (teclado multimedia, celular).
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album,
      artwork: [{ src: current.cover, sizes: '300x300', type: 'image/jpeg' }],
    })
  }, [current])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.setActionHandler('nexttrack', goNext)
    navigator.mediaSession.setActionHandler('previoustrack', goPrevious)
  })

  // Atajos: espacio = play/pausa, Shift + → / ← = adelantar / retroceder.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA') return
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      } else if (event.shiftKey && event.key === 'ArrowRight') goNext()
      else if (event.shiftKey && event.key === 'ArrowLeft') goPrevious()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function restart() {
    setElapsed(0)
    if (audioRef.current) audioRef.current.currentTime = 0
  }

  // ---------- Controles ----------
  function togglePlay() {
    if (!current) {
      if (playlist.next()) {
        setIsPlaying(true)
        changed()
      }
      return
    }
    setIsPlaying((value) => !value)
  }

  function goNext() {
    if (playlist.next()) {
      restart()
      changed()
    } else {
      setToast('Es la última canción · activa 🔁 para volver al inicio')
    }
  }

  function goPrevious() {
    // Como en los reproductores reales: después de 3 s, "anterior" reinicia la canción.
    if (elapsed > 3) return restart()
    if (playlist.previous()) {
      restart()
      changed()
    } else {
      setToast('Es la primera canción')
    }
  }

  function handleEnded() {
    const action = playlist.onSongEnd()
    if (action === 'restart') {
      restart()
      audioRef.current?.play().catch(() => setIsPlaying(false))
    } else if (action === 'next') {
      restart()
    } else {
      setIsPlaying(false)
      restart()
    }
    changed()
  }

  function seek(seconds: number) {
    setElapsed(seconds)
    if (audioRef.current) audioRef.current.currentTime = seconds
  }

  function cycleRepeat() {
    playlist.repeat = NEXT_REPEAT[playlist.repeat]
    setToast(
      playlist.repeat === 'off'
        ? 'Repetir desactivado'
        : playlist.repeat === 'all'
          ? 'Repetir toda la lista'
          : 'Repetir esta canción',
    )
    changed()
  }

  // ---------- Lista doble ----------
  function addTrack(track: Track, where: AddWhere) {
    const song: Song = { ...track, id: newId() }
    if (where === 'now' || where === 'next') playlist.addNext(song)
    else playlist.add(song, where)

    if (where === 'now') {
      playlist.select(song.id)
      restart()
      setIsPlaying(true)
    }
    const label =
      where === 'now'
        ? 'Reproduciendo'
        : where === 'next'
          ? 'Sonará a continuación'
          : where === 'start'
            ? 'Agregada al inicio'
            : where === 'end'
              ? 'Agregada al final'
              : `Agregada en la posición ${where + 1}`
    setToast(`${label}: ${track.title}`)
    changed()
  }

  function playSong(song: Song) {
    if (song === current) return togglePlay()
    playlist.select(song.id)
    restart()
    setIsPlaying(true)
    changed()
  }

  function removeSong(song: Song) {
    playlist.remove(song.id)
    if (song === current) {
      restart()
      if (!playlist.current) setIsPlaying(false)
    }
    setToast(`Eliminada: ${song.title}`)
    changed()
  }

  function moveSong(song: Song, offset: -1 | 1) {
    if (playlist.move(song.id, offset)) changed()
  }

  function shuffle() {
    playlist.shuffle()
    setToast('Lista revuelta')
    changed()
  }

  function reverse() {
    playlist.reverse()
    setToast('Orden invertido')
    changed()
  }

  function clearQueue() {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    playlist.clear()
    setIsPlaying(false)
    restart()
    setConfirmClear(false)
    setToast('Lista vaciada')
    changed()
  }

  function toggleLike(track: Track) {
    setLiked((prev) => {
      const next = { ...prev }
      if (next[track.trackId]) delete next[track.trackId]
      else next[track.trackId] = track
      return next
    })
  }

  const likedTracks = Object.values(liked)
  const listed = tab === 'search' ? results : likedTracks

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">♪</span>
          <div>
            <strong>Sonora</strong>
            <small>Reproductor con listas dobles</small>
          </div>
        </div>
        <label className="search-box">
          <span aria-hidden>⌕</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setTab('search')
            }}
            placeholder="¿Qué quieres escuchar? Canción, artista o álbum"
            aria-label="Buscar música"
          />
          {query && (
            <button type="button" className="icon-btn" onClick={() => setQuery('')} title="Borrar búsqueda">
              ✕
            </button>
          )}
        </label>
      </header>

      <main className="content">
        <section className="panel browse">
          <nav className="tabs">
            <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>
              Buscar
            </button>
            <button className={tab === 'liked' ? 'active' : ''} onClick={() => setTab('liked')}>
              Favoritos {likedTracks.length > 0 && <span className="count">{likedTracks.length}</span>}
            </button>
          </nav>

          {tab === 'search' && query.trim().length < 2 && (
            <div className="welcome">
              <h1>Encuentra tu música</h1>
              <p className="muted">
                Busca cualquier canción y agrégala a tu lista al inicio, al final o en la posición que quieras.
              </p>
              <div className="chips">
                {SUGGESTIONS.map((term) => (
                  <button key={term} className="chip" onClick={() => setQuery(term)}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'search' && loading && <p className="muted pad">Buscando “{query.trim()}”…</p>}
          {tab === 'search' && searchError && <p className="error pad">{searchError}</p>}
          {tab === 'search' && !loading && !searchError && query.trim().length >= 2 && results.length === 0 && (
            <p className="muted pad">No encontramos canciones para “{query.trim()}”.</p>
          )}
          {tab === 'liked' && likedTracks.length === 0 && (
            <p className="muted pad">Aún no tienes favoritos. Toca ♡ en cualquier canción.</p>
          )}

          {!(tab === 'search' && loading) && listed.length > 0 && (
            <ul className="track-list">
              {listed.map((track) => (
                <TrackRow
                  key={track.trackId}
                  track={track}
                  queueSize={playlist.size}
                  liked={!!liked[track.trackId]}
                  playing={current?.trackId === track.trackId}
                  onAdd={(where) => addTrack(track, where)}
                  onToggleLike={() => toggleLike(track)}
                />
              ))}
            </ul>
          )}
        </section>

        <aside className="panel queue">
          <div className="queue-head">
            <div>
              <h2>Tu lista</h2>
              <small className="muted">
                {playlist.size} {playlist.size === 1 ? 'canción' : 'canciones'} · {formatTime(playlist.totalDuration())}
              </small>
            </div>
            <div className="queue-tools">
              <button onClick={shuffle} disabled={playlist.size < 2} title="Revolver">🔀</button>
              <button onClick={reverse} disabled={playlist.size < 2} title="Invertir el orden">⇅</button>
              <button onClick={clearQueue} disabled={playlist.size === 0} className={confirmClear ? 'danger' : ''}>
                {confirmClear ? '¿Vaciar?' : 'Vaciar'}
              </button>
            </div>
          </div>

          {playlist.size === 0 ? (
            <div className="queue-empty">
              <span>♫</span>
              <p>Tu lista está vacía</p>
              <small className="muted">Busca una canción y toca ＋ para agregarla.</small>
            </div>
          ) : (
            <ol className="queue-list">
              {queue.map((node, index) => {
                const song = node.value
                const isCurrent = node === currentNode
                return (
                  <li key={song.id} className={isCurrent ? 'current' : ''}>
                    <button className="queue-main" onClick={() => playSong(song)} title="Reproducir">
                      <span className="num">
                        {isCurrent && isPlaying ? (
                          <span className="eq">
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <img src={song.cover} alt="" loading="lazy" />
                      <span className="track-meta">
                        <strong>{song.title}</strong>
                        <small>{song.artist}</small>
                      </span>
                    </button>
                    <div className="queue-actions">
                      <button onClick={() => moveSong(song, -1)} disabled={index === 0} title="Subir">↑</button>
                      <button onClick={() => moveSong(song, 1)} disabled={index === playlist.size - 1} title="Bajar">
                        ↓
                      </button>
                      <button className="remove" onClick={() => removeSong(song)} title="Eliminar">✕</button>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          <div className="structure">
            <button className="link-btn" onClick={() => setShowDiagram((v) => !v)}>
              {showDiagram ? '▾' : '▸'} Estructura: lista doblemente enlazada
            </button>
            {showDiagram && <ListDiagram playlist={playlist} />}
          </div>
        </aside>
      </main>

      <PlayerBar
        current={current}
        isPlaying={isPlaying}
        elapsed={elapsed}
        duration={duration}
        volume={volume}
        repeat={playlist.repeat}
        liked={!!(current && liked[current.trackId])}
        hasSongs={playlist.size > 0}
        onToggle={togglePlay}
        onNext={goNext}
        onPrevious={goPrevious}
        onSeek={seek}
        onVolume={setVolume}
        onShuffle={shuffle}
        onRepeat={cycleRepeat}
        onToggleLike={() => current && toggleLike(current)}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onError={() => current && setToast('No se pudo cargar el audio de esta canción')}
      />
    </div>
  )
}
