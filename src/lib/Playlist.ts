import { DoublyLinkedList, ListNode } from './DoublyLinkedList'

/** Canción encontrada en el buscador. */
export interface Track {
  trackId: string
  title: string
  artist: string
  album: string
  cover: string
  /** Duración de la canción completa, en segundos. */
  duration: number
  /** Audio de vista previa (30 s). */
  previewUrl: string
}

/** Canción dentro de la lista; `id` es único aunque la misma canción se agregue dos veces. */
export interface Song extends Track {
  id: string
}

export type RepeatMode = 'off' | 'all' | 'one'
export type Position = 'start' | 'end' | number

/** Lista de reproducción: una lista doble de canciones más un puntero a la canción actual. */
export class Playlist {
  readonly songs = new DoublyLinkedList<Song>()
  current: ListNode<Song> | null = null
  repeat: RepeatMode = 'all'

  get size(): number {
    return this.songs.size
  }

  /** `position` numérica: índice 0-based donde queda la canción. */
  add(song: Song, position: Position = 'end'): ListNode<Song> {
    const node =
      position === 'start'
        ? this.songs.addFirst(song)
        : position === 'end'
          ? this.songs.addLast(song)
          : this.songs.insertAt(position, song)
    this.current ??= node
    return node
  }

  /** "Reproducir a continuación": inserta justo después de la canción actual. */
  addNext(song: Song): ListNode<Song> {
    const index = this.current ? this.songs.indexOfNode(this.current) + 1 : 0
    return this.add(song, index)
  }

  clear(): void {
    this.songs.clear()
    this.current = null
  }

  remove(id: string): Song | null {
    const node = this.find(id)
    if (!node) return null
    if (node === this.current) {
      // La actual pasa a la siguiente; si era la última, a la anterior.
      this.current = node.next ?? node.prev
    }
    return this.songs.removeNode(node)
  }

  select(id: string): boolean {
    const node = this.find(id)
    if (node) this.current = node
    return node !== null
  }

  /** Adelantar: avanza por `next`. Con repetir lista, del final vuelve al inicio. */
  next(): boolean {
    if (!this.current) {
      this.current = this.songs.head
      return this.current !== null
    }
    if (this.current.next) {
      this.current = this.current.next
      return true
    }
    if (this.repeat === 'all' && this.songs.head) {
      this.current = this.songs.head
      return true
    }
    return false
  }

  /** Retroceder: va por `prev`. Con repetir lista, del inicio salta al final. */
  previous(): boolean {
    if (!this.current) {
      this.current = this.songs.tail
      return this.current !== null
    }
    if (this.current.prev) {
      this.current = this.current.prev
      return true
    }
    if (this.repeat === 'all' && this.songs.tail) {
      this.current = this.songs.tail
      return true
    }
    return false
  }

  /** Qué pasa cuando termina la canción: 'restart', 'next' o 'stop'. */
  onSongEnd(): 'restart' | 'next' | 'stop' {
    if (this.repeat === 'one') return 'restart'
    return this.next() ? 'next' : 'stop'
  }

  /** Mueve una canción una posición arriba (-1) o abajo (+1). */
  move(id: string, offset: -1 | 1): boolean {
    const node = this.find(id)
    if (!node) return false
    const target = this.songs.indexOfNode(node) + offset
    if (target < 0 || target >= this.songs.size) return false
    this.songs.moveNode(node, target)
    return true
  }

  /** Revuelve el orden reenlazando los mismos nodos (Fisher-Yates). */
  shuffle(random: () => number = Math.random): void {
    const nodes = [...this.songs.nodes()]
    for (let i = nodes.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[nodes[i], nodes[j]] = [nodes[j], nodes[i]]
    }
    this.songs.clear()
    for (const node of nodes) {
      node.prev = null
      node.next = null
      this.songs.appendNode(node)
    }
  }

  /** Invierte el orden usando los punteros prev/next. */
  reverse(): void {
    let node = this.songs.head
    while (node) {
      const next = node.next
      node.next = node.prev
      node.prev = next
      node = next
    }
    const head = this.songs.head
    this.songs.head = this.songs.tail
    this.songs.tail = head
  }

  find(id: string): ListNode<Song> | null {
    return this.songs.findNode((song) => song.id === id)
  }

  indexOf(id: string): number {
    const node = this.find(id)
    return node ? this.songs.indexOfNode(node) : -1
  }

  totalDuration(): number {
    let total = 0
    for (const song of this.songs) total += song.duration
    return total
  }
}
