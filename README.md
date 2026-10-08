# Reproductor de Música · Listas Dobles

Taller de **listas doblemente enlazadas** en **TypeScript**: una lista de reproducción de canciones
con frontend en React donde el usuario agrega, elimina, adelanta y retrocede canciones.

![Captura](docs/captura.png)

## Requerimientos del taller

| Requerimiento | Dónde está |
| --- | --- |
| Frontend para interactuar | `src/App.tsx` (React + Vite) |
| Agregar canción al **inicio** | `DoublyLinkedList.addFirst` |
| Agregar canción al **final** | `DoublyLinkedList.addLast` |
| Agregar en **cualquier posición** | `DoublyLinkedList.insertAt` |
| **Eliminar** una canción | `DoublyLinkedList.removeNode` / `Playlist.remove` |
| **Adelantar** canción | `Playlist.next` (sigue el puntero `next`) |
| **Retroceder** canción | `Playlist.previous` (sigue el puntero `prev`) |

### Funcionalidades adicionales

- **Reproducción**: play/pausa, barra de progreso y paso automático a la siguiente canción al terminar.
- **Audio real**: puedes subir un archivo de audio (mp3, wav…) y se reproduce de verdad; las canciones de ejemplo se simulan (con velocidad x1 o x10 para probar rápido).
- **Repetir**: sin repetir, repetir lista (la lista se recorre de forma circular: del final vuelve al inicio y viceversa) o repetir canción.
- **Mover** canciones arriba/abajo reenlazando el mismo nodo.
- **Revolver** (Fisher-Yates reenlazando los nodos) e **invertir** la lista intercambiando `prev` y `next`.
- **Buscar** por nombre o artista.
- **Resumen**: cantidad de canciones, duración total, `head` y `tail`.
- **Diagrama de la lista en memoria**: muestra cada nodo con sus punteros `prev` y `next`, cuál es `HEAD`, `TAIL` y la canción `ACTUAL`, y el recorrido en ambos sentidos.

## La lista doble

```
null <- [Bohemian Rhapsody] <-> [Hotel California] <-> [La Bicicleta] -> null
          head / actual                                   tail
```

- `src/lib/DoublyLinkedList.ts`: lista doble genérica (`ListNode<T>` con `value`, `prev`, `next`;
  la lista guarda `head`, `tail` y `size`). No usa arrays para guardar los datos.
- `src/lib/Playlist.ts`: la lista de reproducción. Es una `DoublyLinkedList<Song>` más un puntero
  `current` al nodo que suena.

| Operación | Complejidad |
| --- | --- |
| Agregar al inicio / final | O(1) |
| Insertar en posición | O(n) (recorre desde el extremo más cercano) |
| Eliminar un nodo conocido | O(1) |
| Adelantar / retroceder | O(1) |

## Cómo ejecutarlo

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev      # abre http://localhost:5173
npm test         # pruebas de la lista doble y la playlist
npm run build    # versión de producción en dist/
```
