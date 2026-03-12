# Skill: Canvas Pan, Zoom & Cluster Drag

Used by @fenster in the main canvas component (`/app` page).

## State (React useRef / useState)

```typescript
const scaleRef = useRef(1)
const panRef = useRef({ x: 0, y: 0 })
const isPanning = useRef(false)
const panStart = useRef({ x: 0, y: 0 })
const innerRef = useRef<HTMLDivElement>(null)
```

## Apply Transform

```typescript
function applyTransform() {
  if (!innerRef.current) return
  const { x, y } = panRef.current
  innerRef.current.style.transform =
    `translate(${x}px, ${y}px) scale(${scaleRef.current})`
  setZoomLabel(Math.round(scaleRef.current * 100) + '%')
}
```

## Pan (drag on empty canvas background)

```typescript
function onCanvasMouseDown(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest('.cluster-card')) return
  isPanning.current = true
  panStart.current = {
    x: e.clientX - panRef.current.x,
    y: e.clientY - panRef.current.y,
  }
}

function onWindowMouseMove(e: MouseEvent) {
  if (!isPanning.current) return
  panRef.current = {
    x: e.clientX - panStart.current.x,
    y: e.clientY - panStart.current.y,
  }
  applyTransform()
}

// Attach on mount:
window.addEventListener('mousemove', onWindowMouseMove)
window.addEventListener('mouseup', () => { isPanning.current = false })
```

## Zoom (scroll wheel, centered on cursor)

```typescript
function onWheel(e: WheelEvent) {
  e.preventDefault()
  const canvas = canvasRef.current!
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const delta = -e.deltaY * 0.001
  const current = scaleRef.current
  const next = Math.min(Math.max(current + delta, 0.25), 3)

  panRef.current = {
    x: mx - (mx - panRef.current.x) * (next / current),
    y: my - (my - panRef.current.y) * (next / current),
  }
  scaleRef.current = next
  applyTransform()
}
```

## Cluster Drag

```typescript
function startClusterDrag(e: React.MouseEvent, clusterId: string) {
  e.preventDefault()
  e.stopPropagation()
  const el = document.getElementById(`cluster-${clusterId}`)!
  const scale = scaleRef.current
  const pan = panRef.current
  const offsetX = e.clientX - (parseFloat(el.style.left) * scale + pan.x)
  const offsetY = e.clientY - (parseFloat(el.style.top) * scale + pan.y)

  const onMove = (e: MouseEvent) => {
    el.style.left = ((e.clientX - offsetX - pan.x) / scale) + 'px'
    el.style.top  = ((e.clientY - offsetY - pan.y) / scale) + 'px'
  }

  const onUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    const x = Math.round((e.clientX - offsetX - pan.x) / scale)
    const y = Math.round((e.clientY - offsetY - pan.y) / scale)
    // Persist position
    api.put(`/api/clusters/${clusterId}/position`, { posX: x, posY: y })
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
```

## Focus on cluster (from sidebar click)

```typescript
function focusCluster(el: HTMLElement) {
  const scale = scaleRef.current
  const canvas = canvasRef.current!
  const cx = parseFloat(el.style.left) + el.offsetWidth / 2
  const cy = parseFloat(el.style.top) + el.offsetHeight / 2
  panRef.current = {
    x: canvas.offsetWidth / 2 - cx * scale,
    y: canvas.offsetHeight / 2 - cy * scale,
  }
  applyTransform()
}
```
