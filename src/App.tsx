import { Fragment, useEffect, useReducer, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { createSampleSongs } from './data/sampleSongs'
import { Playlist, type Position, type RepeatMode, type Song } from './lib/Playlist'
import { formatTime, parseTime } from './lib/time'

const COLORS = ['#e0533d', '#d9a03f', '#3fb6d9', '#8c5ad9', '#d94f8c', '#4fd98a', '#5a7bd9']
const REPEAT_LABEL: Record<RepeatMode, string> = {
  off: 'Sin repetir',
  all: 'Repetir lista',
  one: 'Repetir canción',
}
const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' }

let idCounter = 0
const newId = () => `u${Date.now().toString(36)}${idCounter++}`

function createPlaylist(): Playlist {
  const playlist = new Playlist()
  for (const song of createSampleSongs()) playlist.add(song, 'end')
  return playlist
}

/** Lee la duración real de un archivo de audio. */
function readDuration(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null)
    audio.onerror = () => resolve(null)
    audio.src = src
  })
}

type Where = 'start' | 'end' | 'index'

export default function App() {
  // La lista doble vive fuera del estado de React; `refresh` vuelve a pintar tras cada cambio.
  const [playlist] = useState(createPlaylist)
  const [, refresh] = useReducer((n: number) => n + 1, 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Formulario
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [durationText, setDurationText] = useState('3:30')
  const [where, setWhere] = useState<Where>('end')
  const [positionText, setPositionText] = useState('1')
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentNode = playlist.current
  const current = currentNode?.value ?? null
  const nodes = [...playlist.songs.nodes()]

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [message])

  // Reproducción simulada (canciones sin archivo de audio).
  useEffect(() => {
    if (!isPlaying || !current || current.src) return
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000 / speed)
    return () => clearInterval(timer)
  }, [isPlaying, current, speed])

  useEffect(() => {
    if (isPlaying && current && !current.src && elapsed >= current.duration) handleEnd()
  }, [elapsed])

  // Reproducción real (canciones subidas como archivo).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (current?.src) {
      if (audio.src !== current.src) audio.src = current.src
      if (isPlaying) audio.play().catch(() => setIsPlaying(false))
      else audio.pause()
    } else {
      audio.pause()
    }
  }, [current, isPlaying])

  function restartTrack() {
    setElapsed(0)
    if (audioRef.current && current?.src) audioRef.current.currentTime = 0
  }

  function goNext() {
    if (playlist.next()) {
      restartTrack()
      refresh()
    } else {
      setMessage('Es la última canción (activa "Repetir lista" para volver al inicio)')
    }
  }

  function goPrevious() {
    // Como en los reproductores reales: después de 3 s, "anterior" reinicia la canción.
    if (elapsed > 3) {
      restartTrack()
      return
    }
    if (playlist.previous()) {
      restartTrack()
      refresh()
    } else {
      setMessage('Es la primera canción')
    }
  }

  function handleEnd() {
    const action = playlist.onSongEnd()
    if (action === 'restart') {
      restartTrack()
      audioRef.current?.play().catch(() => setIsPlaying(false))
    } else if (action === 'next') {
      restartTrack()
    } else {
      setIsPlaying(false)
      setElapsed(0)
    }
    refresh()
  }

  function togglePlay() {
    if (!current) return
    setIsPlaying((value) => !value)
  }

  function playSong(song: Song) {
    if (song === current) {
      togglePlay()
      return
    }
    playlist.select(song.id)
    restartTrack()
    setIsPlaying(true)
    refresh()
  }

  function removeSong(song: Song) {
    const wasCurrent = song === current
    playlist.remove(song.id)
    if (wasCurrent) {
      setElapsed(0)
      if (!playlist.current) setIsPlaying(false)
    }
    if (song.src) URL.revokeObjectURL(song.src)
    setMessage(`Eliminada: ${song.title}`)
    refresh()
  }

  function moveSong(song: Song, offset: -1 | 1) {
    if (playlist.move(song.id, offset)) refresh()
  }

  function seek(seconds: number) {
    setElapsed(seconds)
    if (audioRef.current && current?.src) audioRef.current.currentTime = seconds
  }

  function cycleRepeat() {
    playlist.repeat = NEXT_REPEAT[playlist.repeat]
    setMessage(REPEAT_LABEL[playlist.repeat])
    refresh()
  }

  function shuffle() {
    playlist.shuffle()
    setMessage('Lista revuelta')
    refresh()
  }

  function reverse() {
    playlist.reverse()
    setMessage('Orden invertido')
    refresh()
  }

  function onFileChange(selected: File | null) {
    setFile(selected)
    if (selected && !title) setTitle(selected.name.replace(/\.[^.]+$/, ''))
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const name = title.trim()
    if (!name) return setFormError('Escribe el nombre de la canción')

    const index = Number(positionText) - 1
    if (where === 'index' && (!Number.isInteger(index) || index < 0 || index > playlist.size)) {
      return setFormError(`La posición debe estar entre 1 y ${playlist.size + 1}`)
    }
    const position: Position = where === 'index' ? index : where

    let duration = parseTime(durationText)
    let src: string | undefined
    if (file) {
      src = URL.createObjectURL(file)
      duration = (await readDuration(src)) ?? duration
    }
    if (!duration) {
      if (src) URL.revokeObjectURL(src)
      return setFormError('Duración inválida: usa minutos:segundos, por ejemplo 3:45')
    }

    const song: Song = {
      id: newId(),
      title: name,
      artist: artist.trim() || 'Artista desconocido',
      duration,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      src,
    }
    playlist.add(song, position)

    const label = where === 'start' ? 'al inicio' : where === 'end' ? 'al final' : `en la posición ${positionText}`
    setMessage(`Agregada ${label}: ${song.title}`)
    setTitle('')
    setArtist('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    refresh()
  }

  const search = query.trim().toLowerCase()
  const rows = nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) =>
      !search || `${node.value.title} ${node.value.artist}`.toLowerCase().includes(search),
    )
  const progress = current ? Math.min(elapsed, current.duration) : 0

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">♫</span>
          <div>
            <strong>Reproductor Doble</strong>
            <small>Listas doblemente enlazadas</small>
          </div>
        </div>

        <form className="card add-form" onSubmit={handleAdd}>
          <h2>Agregar canción</h2>
          <label>
            Nombre
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Yellow" />
          </label>
          <label>
            Artista
            <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ej: Coldplay" />
          </label>
          <label>
            Duración (m:ss)
            <input value={durationText} onChange={(e) => setDurationText(e.target.value)} disabled={!!file} />
          </label>
          <label>
            Archivo de audio (opcional)
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>

          <fieldset>
            <legend>¿Dónde agregarla?</legend>
            <div className="segmented">
              {(['start', 'end', 'index'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={where === option ? 'active' : ''}
                  onClick={() => setWhere(option)}
                >
                  {option === 'start' ? 'Inicio' : option === 'end' ? 'Final' : 'Posición'}
                </button>
              ))}
            </div>
            {where === 'index' && (
              <label>
                Posición (1 a {playlist.size + 1})
                <input
                  type="number"
                  min={1}
                  max={playlist.size + 1}
                  value={positionText}
                  onChange={(e) => setPositionText(e.target.value)}
                />
              </label>
            )}
          </fieldset>

          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary">+ Agregar</button>
        </form>

        <div className="card stats">
          <h2>Resumen</h2>
          <dl>
            <dt>Canciones</dt>
            <dd>{playlist.size}</dd>
            <dt>Duración total</dt>
            <dd>{formatTime(playlist.totalDuration())}</dd>
            <dt>Head (primera)</dt>
            <dd>{playlist.songs.head?.value.title ?? 'null'}</dd>
            <dt>Tail (última)</dt>
            <dd>{playlist.songs.tail?.value.title ?? 'null'}</dd>
          </dl>
        </div>
      </aside>

      <main className="main">
        <header className="hero" style={{ '--cover': current?.color ?? '#333' } as CSSProperties}>
          <div className="cover big">{current ? current.title.charAt(0) : '♪'}</div>
          <div>
            <small>Lista de reproducción</small>
            <h1>Mi Playlist</h1>
            <p>
              {playlist.size} canciones · {formatTime(playlist.totalDuration())}
            </p>
          </div>
        </header>

        <div className="toolbar">
          <input
            className="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar canción o artista…"
          />
          <button onClick={shuffle} disabled={playlist.size < 2}>🔀 Revolver</button>
          <button onClick={reverse} disabled={playlist.size < 2}>⇅ Invertir</button>
        </div>

        {playlist.size === 0 ? (
          <p className="empty">La lista está vacía. Agrega una canción desde el panel izquierdo.</p>
        ) : (
          <ol className="tracks">
            {rows.map(({ node, index }) => {
              const song = node.value
              const isCurrent = node === currentNode
              return (
                <li key={song.id} className={isCurrent ? 'current' : ''}>
                  <button className="track-main" onClick={() => playSong(song)} title="Reproducir">
                    <span className="num">{isCurrent && isPlaying ? '▶' : index + 1}</span>
                    <span className="cover" style={{ background: song.color }}>{song.title.charAt(0)}</span>
                    <span className="meta">
                      <strong>{song.title}</strong>
                      <small>
                        {song.artist}
                        {song.id.startsWith('u') && song.src && <em className="badge">tu archivo</em>}
                      </small>
                    </span>
                    <span className="time">{formatTime(song.duration)}</span>
                  </button>
                  <div className="track-actions">
                    <button onClick={() => moveSong(song, -1)} disabled={index === 0} title="Subir">↑</button>
                    <button onClick={() => moveSong(song, 1)} disabled={index === playlist.size - 1} title="Bajar">↓</button>
                    <button className="danger" onClick={() => removeSong(song)} title="Eliminar">✕</button>
                  </div>
                </li>
              )
            })}
            {rows.length === 0 && <p className="empty">No hay canciones que coincidan con “{query}”.</p>}
          </ol>
        )}

        <section className="card memory">
          <h2>Así está la lista doble en memoria</h2>
          <p className="hint">
            Cada nodo apunta a su anterior (<code>prev</code>) y a su siguiente (<code>next</code>).
            Adelantar sigue <code>next</code>; retroceder sigue <code>prev</code>.
          </p>
          <div className="chain">
            <span className="null">null</span>
            {nodes.map((node, index) => (
              <Fragment key={node.value.id}>
                <span className="arrow">{index === 0 ? '←' : '⇄'}</span>
                <div className={`node${node === currentNode ? ' is-current' : ''}`}>
                  <div className="tags">
                    {node === playlist.songs.head && <span>HEAD</span>}
                    {node === playlist.songs.tail && <span>TAIL</span>}
                    {node === currentNode && <span className="now">ACTUAL</span>}
                  </div>
                  <div className="ptr">prev: {node.prev?.value.title ?? 'null'}</div>
                  <div className="val">{node.value.title}</div>
                  <div className="ptr">next: {node.next?.value.title ?? 'null'}</div>
                </div>
              </Fragment>
            ))}
            {nodes.length > 0 && <span className="arrow">→</span>}
            {nodes.length > 0 && <span className="null">null</span>}
          </div>
          <p className="hint">
            <strong>Recorrido head → tail:</strong> {playlist.songs.toArray().map((s) => s.title).join(' → ') || '—'}
            <br />
            <strong>Recorrido tail → head:</strong>{' '}
            {playlist.songs.toArrayReverse().map((s) => s.title).join(' → ') || '—'}
          </p>
        </section>
      </main>

      <footer className="player">
        <div className="now-playing">
          {current ? (
            <>
              <span className="cover" style={{ background: current.color }}>{current.title.charAt(0)}</span>
              <span className="meta">
                <strong>{current.title}</strong>
                <small>{current.artist}</small>
              </span>
            </>
          ) : (
            <span className="meta"><small>Nada en reproducción</small></span>
          )}
        </div>

        <div className="controls">
          <div className="buttons">
            <button onClick={shuffle} disabled={playlist.size < 2} title="Revolver">🔀</button>
            <button onClick={goPrevious} disabled={!current} title="Retroceder">⏮</button>
            <button className="play" onClick={togglePlay} disabled={!current} title={isPlaying ? 'Pausar' : 'Reproducir'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={goNext} disabled={!current} title="Adelantar">⏭</button>
            <button
              onClick={cycleRepeat}
              className={playlist.repeat !== 'off' ? 'on' : ''}
              title={REPEAT_LABEL[playlist.repeat]}
            >
              {playlist.repeat === 'one' ? '🔂' : '🔁'}
            </button>
          </div>
          <div className="progress">
            <span>{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={current?.duration ?? 0}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!current}
              aria-label="Progreso"
            />
            <span>{formatTime(current?.duration ?? 0)}</span>
          </div>
        </div>

        <div className="extra">
          <small>{REPEAT_LABEL[playlist.repeat]}</small>
          {current && !current.src && (
            <button onClick={() => setSpeed((s) => (s === 1 ? 10 : 1))} title="Velocidad de la simulación">
              x{speed}
            </button>
          )}
        </div>
      </footer>

      {message && <div className="toast">{message}</div>}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setElapsed(Math.floor(e.currentTarget.currentTime))}
        onEnded={handleEnd}
      />
    </div>
  )
}
