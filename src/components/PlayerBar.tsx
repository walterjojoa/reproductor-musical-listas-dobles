import type { RepeatMode, Song } from '../lib/Playlist'
import { formatTime } from '../lib/time'
import { Cover } from './Cover'

const REPEAT_LABEL: Record<RepeatMode, string> = {
  off: 'Repetir: desactivado',
  all: 'Repetir: toda la lista',
  one: 'Repetir: esta canción',
}

interface Props {
  current: Song | null
  isPlaying: boolean
  elapsed: number
  duration: number
  volume: number
  repeat: RepeatMode
  liked: boolean
  hasSongs: boolean
  /** Suena la canción completa (YouTube o MP3), no la vista previa. */
  fullSong: boolean
  onToggle: () => void
  onNext: () => void
  onPrevious: () => void
  onSeek: (seconds: number) => void
  onVolume: (volume: number) => void
  onShuffle: () => void
  onRepeat: () => void
  onToggleLike: () => void
}

export function PlayerBar(props: Props) {
  const { current, isPlaying, elapsed, duration, volume, repeat, liked, hasSongs, fullSong } = props
  const max = duration || 30

  return (
    <footer className="player">
      <div className="player-song">
        {current ? (
          <>
            <Cover src={current.cover} className="player-cover" />
            <div className="track-meta">
              <strong>{current.title}</strong>
              <small>{current.artist}</small>
            </div>
            <button
              className={`icon-btn like${liked ? ' on' : ''}`}
              onClick={props.onToggleLike}
              title={liked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              {liked ? '♥' : '♡'}
            </button>
          </>
        ) : (
          <small className="muted">Elige una canción para empezar</small>
        )}
      </div>

      <div className="player-center">
        <div className="player-buttons">
          <button className="icon-btn" onClick={props.onShuffle} disabled={!hasSongs} title="Revolver la lista">
            🔀
          </button>
          <button className="icon-btn big" onClick={props.onPrevious} disabled={!hasSongs} title="Retroceder (Shift + ←)">
            ⏮
          </button>
          <button
            className="play-btn"
            onClick={props.onToggle}
            disabled={!hasSongs}
            title={isPlaying ? 'Pausar (espacio)' : 'Reproducir (espacio)'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button className="icon-btn big" onClick={props.onNext} disabled={!hasSongs} title="Adelantar (Shift + →)">
            ⏭
          </button>
          <button
            className={`icon-btn${repeat !== 'off' ? ' on' : ''}`}
            onClick={props.onRepeat}
            title={REPEAT_LABEL[repeat]}
          >
            {repeat === 'one' ? '🔂' : '🔁'}
          </button>
        </div>
        <div className="progress">
          <span>{formatTime(Math.min(elapsed, max))}</span>
          <input
            type="range"
            min={0}
            max={max}
            step={0.5}
            value={Math.min(elapsed, max)}
            onChange={(e) => props.onSeek(Number(e.target.value))}
            disabled={!current}
            aria-label="Progreso de la canción"
          />
          <span>{formatTime(max)}</span>
        </div>
      </div>

      <div className="player-right">
        <small className="muted">{current ? (fullSong ? 'Canción completa' : 'Vista previa 30 s') : ''}</small>
        <span aria-hidden>{volume === 0 ? '🔇' : '🔊'}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => props.onVolume(Number(e.target.value))}
          aria-label="Volumen"
        />
      </div>
    </footer>
  )
}
