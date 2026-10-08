import type { Track } from '../lib/Playlist'
import { formatTime } from '../lib/time'
import { Cover } from './Cover'
import { AddMenu, type AddWhere } from './AddMenu'

interface Props {
  track: Track
  queueSize: number
  liked: boolean
  playing: boolean
  onAdd: (where: AddWhere) => void
  onToggleLike: () => void
}

/** Fila de un resultado de búsqueda o de favoritos. */
export function TrackRow({ track, queueSize, liked, playing, onAdd, onToggleLike }: Props) {
  return (
    <li className={`track-row${playing ? ' playing' : ''}`}>
      <button className="track-play" onClick={() => onAdd('now')} title="Reproducir ahora">
        <Cover src={track.cover} />
        <span className="play-overlay">▶</span>
      </button>
      <div className="track-meta">
        <strong>{track.title}</strong>
        <small>
          {track.artist}
          {track.album && <> · {track.album}</>}
        </small>
      </div>
      <span className="track-time">{formatTime(track.duration)}</span>
      <button
        className={`icon-btn like${liked ? ' on' : ''}`}
        onClick={onToggleLike}
        title={liked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {liked ? '♥' : '♡'}
      </button>
      <AddMenu size={queueSize} onAdd={onAdd} />
    </li>
  )
}
