import { describe, expect, it } from 'vitest'
import { DoublyLinkedList } from './DoublyLinkedList'

function listOf(...values: string[]) {
  const list = new DoublyLinkedList<string>()
  for (const value of values) list.addLast(value)
  return list
}

/** Comprueba que los punteros prev y next sean coherentes en ambos sentidos. */
function expectConsistent(list: DoublyLinkedList<string>) {
  expect(list.toArrayReverse()).toEqual(list.toArray().reverse())
  expect(list.head?.prev ?? null).toBeNull()
  expect(list.tail?.next ?? null).toBeNull()
  expect(list.toArray()).toHaveLength(list.size)
}

describe('DoublyLinkedList', () => {
  it('empieza vacía', () => {
    const list = new DoublyLinkedList<string>()
    expect(list.isEmpty()).toBe(true)
    expect(list.head).toBeNull()
    expect(list.tail).toBeNull()
  })

  it('agrega al inicio y al final', () => {
    const list = new DoublyLinkedList<string>()
    list.addLast('B')
    list.addFirst('A')
    list.addLast('C')
    expect(list.toArray()).toEqual(['A', 'B', 'C'])
    expect(list.head?.value).toBe('A')
    expect(list.tail?.value).toBe('C')
    expectConsistent(list)
  })

  it('inserta en cualquier posición', () => {
    const list = listOf('A', 'C', 'E')
    list.insertAt(1, 'B')
    list.insertAt(3, 'D')
    list.insertAt(0, 'inicio')
    list.insertAt(list.size, 'fin')
    expect(list.toArray()).toEqual(['inicio', 'A', 'B', 'C', 'D', 'E', 'fin'])
    expectConsistent(list)
  })

  it('rechaza posiciones fuera de rango', () => {
    const list = listOf('A')
    expect(() => list.insertAt(-1, 'X')).toThrow(RangeError)
    expect(() => list.insertAt(3, 'X')).toThrow(RangeError)
    expect(() => list.nodeAt(1)).toThrow(RangeError)
  })

  it('elimina del inicio, del medio y del final', () => {
    const list = listOf('A', 'B', 'C', 'D')
    expect(list.removeAt(1)).toBe('B')
    expect(list.removeFirst()).toBe('A')
    expect(list.removeLast()).toBe('D')
    expect(list.toArray()).toEqual(['C'])
    expect(list.head).toBe(list.tail)
    expectConsistent(list)
    list.removeAt(0)
    expect(list.isEmpty()).toBe(true)
    expect(list.head).toBeNull()
    expect(list.tail).toBeNull()
  })

  it('nodeAt recorre desde el extremo más cercano', () => {
    const list = listOf('A', 'B', 'C', 'D', 'E')
    expect(list.get(0)).toBe('A')
    expect(list.get(3)).toBe('D')
    expect(list.get(4)).toBe('E')
  })

  it('mueve un nodo sin crear uno nuevo', () => {
    const list = listOf('A', 'B', 'C', 'D')
    const node = list.nodeAt(0)
    list.moveNode(node, 2)
    expect(list.toArray()).toEqual(['B', 'C', 'A', 'D'])
    expect(list.nodeAt(2)).toBe(node)
    expectConsistent(list)
  })

  it('busca nodos y su índice', () => {
    const list = listOf('A', 'B', 'C')
    const node = list.findNode((value) => value === 'C')
    expect(node?.value).toBe('C')
    expect(list.indexOfNode(node!)).toBe(2)
    expect(list.findNode((value) => value === 'Z')).toBeNull()
  })
})
