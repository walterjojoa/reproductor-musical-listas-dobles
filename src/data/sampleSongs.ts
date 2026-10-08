import type { Song } from '../lib/Playlist'
import { melodyToAudio, type Melody } from '../lib/synth'

// Melodías de dominio público; la app las convierte en audio real al iniciar.
const ODE_TO_JOY: Melody = [
  ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
  ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1.5], ['D4', 0.5], ['D4', 2],
  ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
  ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1.5], ['C4', 0.5], ['C4', 2],
]

const FUR_ELISE: Melody = [
  ['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['B4', 0.5], ['D5', 0.5], ['C5', 0.5],
  ['A4', 1.5], ['C4', 0.5], ['E4', 0.5], ['A4', 0.5], ['B4', 1.5], ['E4', 0.5], ['G#4', 0.5], ['B4', 0.5],
  ['C5', 1.5], ['E4', 0.5], ['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['B4', 0.5],
  ['D5', 0.5], ['C5', 0.5], ['A4', 1.5], ['C4', 0.5], ['E4', 0.5], ['A4', 0.5], ['B4', 1.5], ['E4', 0.5],
  ['C5', 0.5], ['B4', 0.5], ['A4', 2],
]

const TWINKLE: Melody = [
  ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
  ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
  ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
  ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
]

const HAPPY_BIRTHDAY: Melody = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2], ['R', 1],
]

const FRERE_JACQUES: Melody = [
  ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
  ['E4', 1], ['F4', 1], ['G4', 2], ['E4', 1], ['F4', 1], ['G4', 2],
  ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1],
  ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1],
  ['C4', 1], ['G3', 1], ['C4', 2], ['C4', 1], ['G3', 1], ['C4', 2],
]

const SONGS: { id: string; title: string; artist: string; color: string; melody: Melody; bpm: number; repeats: number }[] = [
  { id: 's1', title: 'Himno de la Alegría', artist: 'Ludwig van Beethoven', color: '#e0533d', melody: ODE_TO_JOY, bpm: 120, repeats: 2 },
  { id: 's2', title: 'Para Elisa', artist: 'Ludwig van Beethoven', color: '#8c5ad9', melody: FUR_ELISE, bpm: 100, repeats: 2 },
  { id: 's3', title: 'Estrellita', artist: 'Tradicional', color: '#3fb6d9', melody: TWINKLE, bpm: 110, repeats: 2 },
  { id: 's4', title: 'Cumpleaños Feliz', artist: 'Tradicional', color: '#d9a03f', melody: HAPPY_BIRTHDAY, bpm: 100, repeats: 2 },
  { id: 's5', title: 'Martinillo', artist: 'Tradicional', color: '#4fd98a', melody: FRERE_JACQUES, bpm: 120, repeats: 2 },
]

export function createSampleSongs(): Song[] {
  return SONGS.map(({ melody, bpm, repeats, ...song }) => ({ ...song, ...melodyToAudio(melody, bpm, repeats) }))
}
