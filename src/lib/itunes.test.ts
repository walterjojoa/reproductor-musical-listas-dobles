import { describe, expect, it } from 'vitest'
import { toTrack } from './itunes'

describe('toTrack', () => {
  it('convierte un resultado de iTunes en canción', () => {
    const track = toTrack({
      trackId: 123,
      trackName: 'Waka Waka',
      artistName: 'Shakira',
      collectionName: 'Sale el Sol',
      artworkUrl100: 'https://img.example/a/100x100bb.jpg',
      trackTimeMillis: 202653,
      previewUrl: 'https://audio.example/p.m4a',
    })
    expect(track).toEqual({
      trackId: '123',
      title: 'Waka Waka',
      artist: 'Shakira',
      album: 'Sale el Sol',
      cover: 'https://img.example/a/300x300bb.jpg',
      duration: 203,
      previewUrl: 'https://audio.example/p.m4a',
    })
  })
})
