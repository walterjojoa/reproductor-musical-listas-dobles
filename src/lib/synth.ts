/**
 * Genera audio real (un archivo WAV en memoria) a partir de una melodía.
 * Así las canciones de ejemplo suenan sin incluir archivos con derechos de autor.
 */

/** [nota, duración en tiempos]. Nota en notación inglesa: 'C4', 'D#5'; 'R' = silencio. */
export type Melody = [note: string, beats: number][]

const SAMPLE_RATE = 22050
const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }

export function noteFrequency(note: string): number {
  const match = /^([A-G])(#|b)?(\d)$/.exec(note)
  if (!match) throw new Error(`Nota inválida: ${note}`)
  const [, letter, accidental, octave] = match
  const offset = SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0)
  return 440 * 2 ** ((Number(octave) - 4) + offset / 12)
}

/** Muestras PCM (-1..1) de la melodía repetida `repeats` veces. */
export function renderMelody(melody: Melody, bpm: number, repeats = 1): Float32Array {
  const beat = 60 / bpm
  const totalBeats = melody.reduce((sum, [, beats]) => sum + beats, 0) * repeats
  const samples = new Float32Array(Math.ceil(totalBeats * beat * SAMPLE_RATE) + SAMPLE_RATE / 2)
  let cursor = 0
  for (let r = 0; r < repeats; r++) {
    for (const [note, beats] of melody) {
      const length = Math.round(beats * beat * SAMPLE_RATE)
      if (note !== 'R') {
        const frequency = noteFrequency(note)
        for (let i = 0; i < length; i++) {
          const t = i / SAMPLE_RATE
          // Envolvente tipo piano: ataque corto y caída exponencial.
          const envelope = Math.min(1, i / 200) * Math.exp(-3 * t) * Math.min(1, (length - i) / 400)
          const wave =
            Math.sin(2 * Math.PI * frequency * t) +
            0.5 * Math.sin(4 * Math.PI * frequency * t) +
            0.25 * Math.sin(6 * Math.PI * frequency * t)
          samples[cursor + i] += 0.3 * envelope * wave
        }
      }
      cursor += length
    }
  }
  return samples
}

export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s * 0x7fff, true)
  }
  return buffer
}

/** URL reproducible por <audio> y su duración en segundos. */
export function melodyToAudio(melody: Melody, bpm: number, repeats: number): { src: string; duration: number } {
  const samples = renderMelody(melody, bpm, repeats)
  const blob = new Blob([encodeWav(samples)], { type: 'audio/wav' })
  return { src: URL.createObjectURL(blob), duration: Math.round(samples.length / SAMPLE_RATE) }
}
