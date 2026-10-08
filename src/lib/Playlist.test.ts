import { describe, expect, it } from 'vitest'
import { Playlist, type Song } from './Playlist'

const song = (id: string): Song => ({ id, title: id, artist: 'X', duration: 60, color: '#000' })

function playlistOf(...ids: string[]) {
  const playlist = new Playlist()
  for (const id of ids) playlist.add(song(id))
  return playlist
}

const titles = (playlist: Playlist) => playlist.songs.toArray().map((s) => s.title)

describe('Playlist', () => {
  it('la primera canción agregada queda como actual', () => {
    const playlist = playlistOf('A', 'B')
    expect(playlist.current?.value.id).toBe('A')
  })

  it('agrega al inicio, al final y en una posición', () => {
    const playlist = playlistOf('B')
    playlist.add(song('A'), 'start')
    playlist.add(song('D'), 'end')
    playlist.add(song('C'), 2)
    expect(titles(playlist)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('adelanta y retrocede siguiendo next y prev', () => {
    const playlist = playlistOf('A', 'B', 'C')
    playlist.next()
    expect(playlist.current?.value.id).toBe('B')
    playlist.next()
    expect(playlist.current?.value.id).toBe('C')
    playlist.previous()
    expect(playlist.current?.value.id).toBe('B')
  })

  it('con repetir lista da la vuelta en ambos sentidos', () => {
    const playlist = playlistOf('A', 'B')
    playlist.repeat = 'all'
    playlist.previous()
    expect(playlist.current?.value.id).toBe('B')
    playlist.next()
    expect(playlist.current?.value.id).toBe('A')
  })

  it('sin repetir se detiene en los extremos', () => {
    const playlist = playlistOf('A', 'B')
    playlist.repeat = 'off'
    expect(playlist.previous()).toBe(false)
    playlist.next()
    expect(playlist.next()).toBe(false)
    expect(playlist.current?.value.id).toBe('B')
    expect(playlist.onSongEnd()).toBe('stop')
  })

  it('repetir canción reinicia la misma', () => {
    const playlist = playlistOf('A', 'B')
    playlist.repeat = 'one'
    expect(playlist.onSongEnd()).toBe('restart')
    expect(playlist.current?.value.id).toBe('A')
  })

  it('al eliminar la actual pasa a la siguiente, o a la anterior si era la última', () => {
    const playlist = playlistOf('A', 'B', 'C')
    playlist.select('B')
    playlist.remove('B')
    expect(playlist.current?.value.id).toBe('C')
    playlist.remove('C')
    expect(playlist.current?.value.id).toBe('A')
    playlist.remove('A')
    expect(playlist.current).toBeNull()
    expect(playlist.size).toBe(0)
  })

  it('mueve canciones arriba y abajo', () => {
    const playlist = playlistOf('A', 'B', 'C')
    expect(playlist.move('C', -1)).toBe(true)
    expect(titles(playlist)).toEqual(['A', 'C', 'B'])
    expect(playlist.move('A', -1)).toBe(false)
  })

  it('revolver conserva las mismas canciones y la actual', () => {
    const playlist = playlistOf('A', 'B', 'C', 'D')
    const current = playlist.current
    playlist.shuffle(() => 0)
    expect(titles(playlist).sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(playlist.songs.toArrayReverse()).toEqual(playlist.songs.toArray().reverse())
    expect(playlist.current).toBe(current)
  })

  it('invierte el orden', () => {
    const playlist = playlistOf('A', 'B', 'C')
    playlist.reverse()
    expect(titles(playlist)).toEqual(['C', 'B', 'A'])
    expect(playlist.songs.head?.prev).toBeNull()
    expect(playlist.songs.tail?.next).toBeNull()
  })

  it('suma la duración total', () => {
    expect(playlistOf('A', 'B', 'C').totalDuration()).toBe(180)
  })
})
