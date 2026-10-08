import { Fragment } from 'react'
import type { Playlist } from '../lib/Playlist'

/** Dibuja la lista doble: cada nodo con sus punteros prev y next. */
export function ListDiagram({ playlist }: { playlist: Playlist }) {
  const nodes = [...playlist.songs.nodes()]
  if (nodes.length === 0) return <p className="muted">La lista está vacía: head = tail = null.</p>

  return (
    <div className="diagram">
      <div className="chain">
        <span className="null">null</span>
        {nodes.map((node, index) => (
          <Fragment key={node.value.id}>
            <span className="arrow">{index === 0 ? '←' : '⇄'}</span>
            <div className={`node${node === playlist.current ? ' is-current' : ''}`}>
              <div className="tags">
                {node === playlist.songs.head && <span>HEAD</span>}
                {node === playlist.songs.tail && <span>TAIL</span>}
                {node === playlist.current && <span className="now">ACTUAL</span>}
              </div>
              <div className="ptr">prev: {node.prev?.value.title ?? 'null'}</div>
              <div className="val">{node.value.title}</div>
              <div className="ptr">next: {node.next?.value.title ?? 'null'}</div>
            </div>
          </Fragment>
        ))}
        <span className="arrow">→</span>
        <span className="null">null</span>
      </div>
      <p className="muted small">
        <strong>head → tail:</strong> {playlist.songs.toArray().map((s) => s.title).join(' → ')}
        <br />
        <strong>tail → head:</strong> {playlist.songs.toArrayReverse().map((s) => s.title).join(' → ')}
      </p>
    </div>
  )
}
