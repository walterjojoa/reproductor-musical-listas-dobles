/** Portada de la canción; las canciones subidas desde el PC no tienen imagen. */
export function Cover({ src, className }: { src: string; className?: string }) {
  if (!src) {
    return (
      <span className={`cover-placeholder ${className ?? ''}`} aria-hidden>
        ♪
      </span>
    )
  }
  return <img className={className} src={src} alt="" loading="lazy" />
}
