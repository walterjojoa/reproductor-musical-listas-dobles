import { describe, expect, it } from 'vitest'
import { encodeWav, noteFrequency, renderMelody } from './synth'

describe('synth', () => {
  it('calcula la frecuencia de las notas', () => {
    expect(noteFrequency('A4')).toBeCloseTo(440)
    expect(noteFrequency('A5')).toBeCloseTo(880)
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1)
    expect(noteFrequency('D#5')).toBeCloseTo(622.25, 1)
  })

  it('genera un WAV con la duración de la melodía', () => {
    // 4 tiempos a 120 bpm = 2 s, más medio segundo de cola.
    const samples = renderMelody([['C4', 2], ['R', 1], ['G4', 1]], 120)
    expect(samples.length).toBeCloseTo(22050 * 2.5, -2)
    const wav = encodeWav(samples)
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF')
    expect(wav.byteLength).toBe(44 + samples.length * 2)
  })
})
