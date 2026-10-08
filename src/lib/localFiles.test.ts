import { describe, expect, it } from 'vitest'
import { isLocalTrack, parseFileName } from './localFiles'

describe('parseFileName', () => {
  it('separa artista y título con " - "', () => {
    expect(parseFileName('Shakira - Waka Waka.mp3')).toEqual({ artist: 'Shakira', title: 'Waka Waka' })
    expect(parseFileName('Queen - Bohemian Rhapsody - Remaster.mp3')).toEqual({
      artist: 'Queen',
      title: 'Bohemian Rhapsody - Remaster',
    })
  })

  it('sin guion usa el nombre como título', () => {
    expect(parseFileName('mi_cancion_favorita.m4a')).toEqual({
      artist: 'Archivo local',
      title: 'mi cancion favorita',
    })
  })
})

describe('isLocalTrack', () => {
  it('reconoce las canciones subidas', () => {
    expect(isLocalTrack({ previewUrl: 'blob:http://localhost/abc' })).toBe(true)
    expect(isLocalTrack({ previewUrl: 'https://audio.example/p.m4a' })).toBe(false)
  })
})
