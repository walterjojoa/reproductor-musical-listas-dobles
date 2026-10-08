# Sonora · Reproductor de música con listas dobles

Taller de **listas doblemente enlazadas** en **TypeScript**. Sonora es un reproductor de música
web: buscas canciones reales, armas tu lista y la reproduces. Toda la lista de reproducción
está construida sobre una lista doble hecha a mano.

![Captura](docs/captura.png)

## Requerimientos del taller

| Requerimiento | Cómo se usa en la app | Código |
| --- | --- | --- |
| Frontend para interactuar | Toda la app (React + Vite) | `src/App.tsx`, `src/components/` |
| Agregar canción al **inicio** | ＋ → *Agregar al inicio* | `DoublyLinkedList.addFirst` |
| Agregar canción al **final** | ＋ → *Agregar al final* | `DoublyLinkedList.addLast` |
| Agregar en **cualquier posición** | ＋ → *En la posición [n]* | `DoublyLinkedList.insertAt` |
| **Eliminar** una canción | ✕ en *Tu lista* | `DoublyLinkedList.removeNode` |
| **Adelantar** canción | ⏭ (o Shift + →) | `Playlist.next` → puntero `next` |
| **Retroceder** canción | ⏮ (o Shift + ←) | `Playlist.previous` → puntero `prev` |

### Otras funcionalidades

- **Buscador de música real** (API pública de iTunes): canciones, artistas y álbumes con portada.
- **Canciones completas con YouTube**: al reproducir una canción del buscador, la app busca su video y la reproduce completa con el reproductor oficial de YouTube. Sin clave de YouTube (o si falla), suena la vista previa de 30 s de iTunes.
- **Tus MP3 completos**: en la pestaña *Tus MP3* arrastras o eliges canciones de tu PC y suenan completas. Entran a la misma lista doble (inicio, final o posición). No se suben a ningún servidor; solo existen mientras la página está abierta.
- **Reproducir ahora** y **Reproducir a continuación** (inserta justo después del nodo actual).
- **Play / pausa**, barra de progreso, volumen y paso automático a la siguiente canción.
- **Repetir**: desactivado, toda la lista (recorrido circular: del `tail` vuelve al `head` y viceversa) o una canción.
- **Revolver** (Fisher-Yates reenlazando los mismos nodos), **invertir** (intercambiando `prev` y `next`), **mover** ↑↓ y **vaciar**.
- **Favoritos** ♥.
- La lista, los favoritos y el volumen **se guardan** en el navegador.
- **Diagrama de la lista doble**: cada nodo con sus punteros `prev` y `next`, `HEAD`, `TAIL`, la canción `ACTUAL` y el recorrido en ambos sentidos.
- Atajos de teclado (espacio, Shift + ← / →), controles multimedia del sistema y diseño adaptable al celular.

## La lista doble

```
null <- [Waka Waka] <-> [Loca] <-> [Chantaje] -> null
          head                       tail
```

- `src/lib/DoublyLinkedList.ts`: lista doble genérica. `ListNode<T>` tiene `value`, `prev` y `next`;
  la lista guarda `head`, `tail` y `size`. No usa arrays para guardar los datos.
- `src/lib/Playlist.ts`: la lista de reproducción, una `DoublyLinkedList<Song>` más un puntero
  `current` al nodo que está sonando.

| Operación | Complejidad |
| --- | --- |
| Agregar al inicio / final | O(1) |
| Insertar en posición | O(n), recorre desde el extremo más cercano |
| Eliminar un nodo | O(1) |
| Adelantar / retroceder | O(1) |

## Ejecutarlo en tu PC

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas de la lista doble
npm run build    # versión de producción en dist/
```

## Clave de YouTube (canciones completas)

1. Entra a https://console.cloud.google.com y crea un proyecto.
2. **APIs y servicios → Biblioteca**, busca **YouTube Data API v3** y dale a **Habilitar**.
3. **APIs y servicios → Credenciales → Crear credenciales → Clave de API** y cópiala.
4. (Recomendado) En la clave, **Restricciones de aplicaciones → Sitios web**: `http://localhost:5173/*` y `https://*.vercel.app/*`; **Restricciones de API → YouTube Data API v3**.
5. En el PC: copia `.env.example` como `.env.local` y pega la clave en `VITE_YOUTUBE_API_KEY=`. Reinicia `npm run dev`.

La cuota gratis permite unas 100 búsquedas de video al día; cada canción se busca una sola vez y queda guardada.

## Desplegar en Vercel

1. Entra a https://vercel.com con tu cuenta de GitHub.
2. **Add New → Project** y elige este repositorio.
3. Vercel detecta **Vite** solo (build `npm run build`, carpeta `dist`). Dale a **Deploy**.

4. Para canciones completas: en el proyecto de Vercel, **Settings → Environment Variables**, agrega `VITE_YOUTUBE_API_KEY` con tu clave y vuelve a desplegar (**Deployments → Redeploy**).
