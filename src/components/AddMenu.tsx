import { useEffect, useRef, useState } from 'react'

export type AddWhere = 'now' | 'next' | 'start' | 'end' | number

interface Props {
  /** Canciones en la lista (para validar la posición). */
  size: number
  onAdd: (where: AddWhere) => void
}

/** Botón "+" con las formas de agregar una canción a la lista doble. */
export function AddMenu({ size, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState('1')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const index = Number(position) - 1
  const validPosition = Number.isInteger(index) && index >= 0 && index <= size

  function choose(where: AddWhere) {
    onAdd(where)
    setOpen(false)
  }

  return (
    <div className="add-menu" ref={ref}>
      <button
        className="icon-btn"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title="Agregar a la lista"
        aria-expanded={open}
      >
        ＋
      </button>
      {open && (
        <div className="menu" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => choose('now')}>▶ Reproducir ahora</button>
          <button onClick={() => choose('next')}>↪ Reproducir a continuación</button>
          <hr />
          <button onClick={() => choose('start')}>⤒ Agregar al inicio</button>
          <button onClick={() => choose('end')}>⤓ Agregar al final</button>
          <form
            className="menu-position"
            onSubmit={(e) => {
              e.preventDefault()
              if (validPosition) choose(index)
            }}
          >
            <span>En la posición</span>
            <input
              type="number"
              min={1}
              max={size + 1}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              aria-label={`Posición de 1 a ${size + 1}`}
            />
            <button type="submit" disabled={!validPosition}>OK</button>
          </form>
          <small className="menu-hint">Posiciones de 1 a {size + 1}</small>
        </div>
      )}
    </div>
  )
}
