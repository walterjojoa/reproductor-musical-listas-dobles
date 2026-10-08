/**
 * Lista doblemente enlazada genérica.
 *
 * Cada nodo guarda un valor y dos punteros: `prev` (anterior) y `next` (siguiente).
 * La lista guarda `head` (primer nodo), `tail` (último nodo) y su tamaño.
 *
 *   null <- [head] <-> [ ... ] <-> [tail] -> null
 */
export class ListNode<T> {
  value: T
  prev: ListNode<T> | null = null
  next: ListNode<T> | null = null

  constructor(value: T) {
    this.value = value
  }
}

export class DoublyLinkedList<T> implements Iterable<T> {
  head: ListNode<T> | null = null
  tail: ListNode<T> | null = null
  private length = 0

  get size(): number {
    return this.length
  }

  isEmpty(): boolean {
    return this.length === 0
  }

  /** Agrega al inicio. O(1) */
  addFirst(value: T): ListNode<T> {
    return this.linkAt(0, new ListNode(value))
  }

  /** Agrega al final. O(1) */
  addLast(value: T): ListNode<T> {
    return this.linkAt(this.length, new ListNode(value))
  }

  /** Inserta en la posición `index` (0 = inicio, size = final). O(n) */
  insertAt(index: number, value: T): ListNode<T> {
    return this.linkAt(index, new ListNode(value))
  }

  /** Nodo en la posición `index`; recorre desde el extremo más cercano. O(n/2) */
  nodeAt(index: number): ListNode<T> {
    this.checkIndex(index, this.length - 1)
    if (index < this.length / 2) {
      let node = this.head!
      for (let i = 0; i < index; i++) node = node.next!
      return node
    }
    let node = this.tail!
    for (let i = this.length - 1; i > index; i--) node = node.prev!
    return node
  }

  get(index: number): T {
    return this.nodeAt(index).value
  }

  /** Desenlaza un nodo de la lista y devuelve su valor. O(1) */
  removeNode(node: ListNode<T>): T {
    if (node.prev) node.prev.next = node.next
    else this.head = node.next

    if (node.next) node.next.prev = node.prev
    else this.tail = node.prev

    node.prev = null
    node.next = null
    this.length--
    return node.value
  }

  removeAt(index: number): T {
    return this.removeNode(this.nodeAt(index))
  }

  removeFirst(): T | undefined {
    return this.head ? this.removeNode(this.head) : undefined
  }

  removeLast(): T | undefined {
    return this.tail ? this.removeNode(this.tail) : undefined
  }

  /** Mueve un nodo existente a la posición `toIndex`, sin crear nodos nuevos. */
  moveNode(node: ListNode<T>, toIndex: number): void {
    this.checkIndex(toIndex, this.length - 1)
    this.removeNode(node)
    this.linkAt(toIndex, node)
  }

  /** Enlaza al final un nodo suelto (sin prev/next). O(1) */
  appendNode(node: ListNode<T>): ListNode<T> {
    return this.linkAt(this.length, node)
  }

  findNode(predicate: (value: T) => boolean): ListNode<T> | null {
    for (let node = this.head; node; node = node.next) {
      if (predicate(node.value)) return node
    }
    return null
  }

  indexOfNode(target: ListNode<T>): number {
    let index = 0
    for (let node = this.head; node; node = node.next, index++) {
      if (node === target) return index
    }
    return -1
  }

  clear(): void {
    this.head = null
    this.tail = null
    this.length = 0
  }

  /** Recorrido de head a tail usando `next`. */
  *nodes(): Generator<ListNode<T>> {
    for (let node = this.head; node; node = node.next) yield node
  }

  *[Symbol.iterator](): Iterator<T> {
    for (const node of this.nodes()) yield node.value
  }

  toArray(): T[] {
    return [...this]
  }

  /** Recorrido de tail a head usando `prev`. */
  toArrayReverse(): T[] {
    const values: T[] = []
    for (let node = this.tail; node; node = node.prev) values.push(node.value)
    return values
  }

  private linkAt(index: number, node: ListNode<T>): ListNode<T> {
    this.checkIndex(index, this.length)

    if (this.length === 0) {
      this.head = node
      this.tail = node
    } else if (index === 0) {
      node.next = this.head
      this.head!.prev = node
      this.head = node
    } else if (index === this.length) {
      node.prev = this.tail
      this.tail!.next = node
      this.tail = node
    } else {
      const after = this.nodeAt(index)
      const before = after.prev!
      node.prev = before
      node.next = after
      before.next = node
      after.prev = node
    }

    this.length++
    return node
  }

  private checkIndex(index: number, max: number): void {
    if (!Number.isInteger(index) || index < 0 || index > max) {
      throw new RangeError(`Posición ${index} fuera de rango (0..${max})`)
    }
  }
}
