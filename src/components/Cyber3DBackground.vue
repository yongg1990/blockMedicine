<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | undefined
let mouseX = 0
let mouseY = 0
let targetRotX = 0
let targetRotY = 0
let currentRotX = 0
let currentRotY = 0

type Node3D = {
  x: number
  y: number
  z: number
  baseRadius: number
  color: string
}

type Particle3D = {
  x: number
  y: number
  z: number
  speedZ: number
  char: string
}

const nodes: Node3D[] = []
const particles: Particle3D[] = []
const NODE_COUNT = 42
const PARTICLE_COUNT = 36
const SPHERE_RADIUS = 380
const HEX_CHARS = ['0xSM2', 'SM3', 'HASH', 'BLOCK', 'TCM', '7FD9', 'B8A1', '0E4C', 'NODE', 'SYNC']

const initNodes = () => {
  nodes.length = 0
  for (let i = 0; i < NODE_COUNT; i++) {
    // Golden spiral on sphere for even distribution
    const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = SPHERE_RADIUS * (0.85 + Math.random() * 0.3)

    const colors = ['#00f0ff', '#38f9d7', '#38bdf8', '#818cf8', '#ffbe0b', '#00f5a0']
    nodes.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta) * 0.65, // Slight flatten for widescreen
      z: r * Math.cos(phi),
      baseRadius: 2.4 + Math.random() * 2.8,
      color: colors[i % colors.length],
    })
  }

  particles.length = 0
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 900,
      z: Math.random() * 800 - 400,
      speedZ: 0.6 + Math.random() * 1.2,
      char: HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)],
    })
  }
}

const handleMouseMove = (e: MouseEvent) => {
  const w = window.innerWidth
  const h = window.innerHeight
  targetRotY = ((e.clientX - w / 2) / w) * 0.45
  targetRotX = -((e.clientY - h / 2) / h) * 0.35
}

const render = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const cx = width / 2
  const cy = height / 2

  ctx.clearRect(0, 0, width, height)

  // Camera smooth rotation
  currentRotX += (targetRotX - currentRotX) * 0.05
  currentRotY += (targetRotY - currentRotY) * 0.05

  // Continual slow planetary spin
  const autoSpin = performance.now() * 0.00025
  const rotY = currentRotY + autoSpin
  const rotX = currentRotX

  const cosY = Math.cos(rotY)
  const sinY = Math.sin(rotY)
  const cosX = Math.cos(rotX)
  const sinX = Math.sin(rotX)

  const fov = 650

  // 1. Draw 3D Blockchain Constellation Nodes
  type ProjectedNode = {
    px: number
    py: number
    pz: number
    scale: number
    alpha: number
    color: string
    radius: number
  }

  const projected: ProjectedNode[] = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    // Rotate around Y
    const x1 = node.x * cosY - node.z * sinY
    const z1 = node.z * cosY + node.x * sinY

    // Rotate around X
    const y2 = node.y * cosX - z1 * sinX
    const z2 = z1 * cosX + node.y * sinX

    const depth = fov + z2
    if (depth <= 10) continue

    const scale = fov / depth
    const px = cx + x1 * scale
    const py = cy + y2 * scale
    const alpha = Math.max(0.12, Math.min(0.85, (z2 + SPHERE_RADIUS) / (2 * SPHERE_RADIUS)))

    projected.push({
      px,
      py,
      pz: z2,
      scale,
      alpha,
      color: node.color,
      radius: node.baseRadius * scale,
    })
  }

  // Draw 3D Connecting Lines between nearest nodes
  const maxDistance = 160
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const p1 = projected[i]
      const p2 = projected[j]

      const dx = p1.px - p2.px
      const dy = p1.py - p2.py
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < maxDistance) {
        const lineAlpha = (1 - dist / maxDistance) * 0.22 * Math.min(p1.alpha, p2.alpha)
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0, 242, 254, ${lineAlpha})`
        ctx.lineWidth = 1
        ctx.moveTo(p1.px, p1.py)
        ctx.lineTo(p2.px, p2.py)
        ctx.stroke()
      }
    }
  }

  // Draw Nodes with luminous 3D halo
  for (let i = 0; i < projected.length; i++) {
    const p = projected[i]
    ctx.save()
    ctx.globalAlpha = p.alpha

    // Glow halo
    const glowRadius = p.radius * 2.8
    const grad = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, glowRadius)
    grad.addColorStop(0, p.color)
    grad.addColorStop(1, 'transparent')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(p.px, p.py, glowRadius, 0, Math.PI * 2)
    ctx.fill()

    // Solid core
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(p.px, p.py, Math.max(1.2, p.radius * 0.7), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 2. Draw Floating 3D Cryptographic Hex Matrix Stream
  ctx.font = '10px Consolas, monospace'
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i]
    pt.z -= pt.speedZ
    if (pt.z < -fov + 50) {
      pt.z = 400
      pt.x = (Math.random() - 0.5) * 1600
      pt.y = (Math.random() - 0.5) * 900
    }

    const depth = fov + pt.z
    if (depth <= 10) continue

    const scale = fov / depth
    const px = cx + pt.x * scale
    const py = cy + pt.y * scale
    const alpha = Math.max(0.04, Math.min(0.4, (400 - pt.z) / 800))

    ctx.fillStyle = `rgba(56, 249, 215, ${alpha})`
    ctx.fillText(pt.char, px, py)
  }

  animId = requestAnimationFrame(render)
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

onMounted(() => {
  resizeCanvas()
  initNodes()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', handleMouseMove)
  animId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  if (animId !== undefined) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="cyber-3d-backdrop" aria-hidden="true">
    <canvas ref="canvasRef" class="cyber-canvas"></canvas>
    <!-- 3D Perspective Cyber Floor -->
    <div class="cyber-3d-floor"></div>
    <div class="cyber-horizon-glow"></div>
  </div>
</template>

<style scoped>
.cyber-3d-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.cyber-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.75;
}

/* 3D Perspective Floor Grid */
.cyber-3d-floor {
  position: absolute;
  left: -50%;
  bottom: -45%;
  width: 200%;
  height: 85%;
  background-image: 
    linear-gradient(rgba(0, 240, 255, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.18) 1px, transparent 1px);
  background-size: 56px 56px;
  transform: perspective(480px) rotateX(77deg);
  transform-origin: 50% 100%;
  mask-image: radial-gradient(ellipse 70% 55% at 50% 50%, #000 25%, transparent 85%);
  opacity: 0.35;
}

/* Digital Horizon Beam & Quantum Aurora Halo */
.cyber-horizon-glow {
  position: absolute;
  bottom: 0;
  left: 5%;
  width: 90%;
  height: 3px;
  background: radial-gradient(ellipse at center, rgba(56, 249, 215, 0.85) 0%, rgba(0, 240, 255, 0.45) 40%, rgba(99, 102, 241, 0.25) 75%, transparent 100%);
  box-shadow: 0 0 32px rgba(0, 240, 255, 0.7), 0 0 12px rgba(56, 249, 215, 0.8);
}
</style>
