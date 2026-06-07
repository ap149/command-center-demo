<script setup>
import { computed } from 'vue'

const props = defineProps({
  agents:            { type: Array,  required: true },
  agentStates:       { type: Object, required: true },
  currentPhaseIndex: { type: Number, default: 0     },
  globalProgress:    { type: Number, default: 0     },
})

// ── Pentagon geometry ─────────────────────────────────────────────────────────
// r=65, center=(100,100), start angle −30° (2 o'clock), step +72° clockwise.
// All adjacent-vertex distances ≈ 76 SVG units (verified regular pentagon).
const PENTA_NODES = {
  research: { x: 156, y: 68  },
  market:   { x: 148, y: 144 },
  product:  { x: 74,  y: 159 },
  creative: { x: 35,  y: 93  },
  finance:  { x: 86,  y: 36  },
}
// Mid-tone per agent — used for ring strokes (matches gradient stop ~28%)
const RING_COLORS = {
  research: '#93C5FD',
  market:   '#A78BFA',
  product:  '#6EE7B7',
  creative: '#FDBA74',
  finance:  '#FDA4AF',
}

// CSS radial-gradient strings that mirror the SVG defs (used for legend dots)
const LEGEND_GRADIENTS = {
  research: 'radial-gradient(circle at 35% 30%, #EFF6FF 0%, #93C5FD 28%, #3B82F6 68%, #1E3A8A 100%)',
  market:   'radial-gradient(circle at 35% 30%, #F5F3FF 0%, #A78BFA 28%, #7C3AED 68%, #2E1065 100%)',
  product:  'radial-gradient(circle at 35% 30%, #ECFDF5 0%, #6EE7B7 28%, #059669 68%, #022C22 100%)',
  creative: 'radial-gradient(circle at 35% 30%, #FFF7ED 0%, #FDBA74 28%, #EA580C 68%, #431407 100%)',
  finance:  'radial-gradient(circle at 35% 30%, #FFF1F2 0%, #FDA4AF 28%, #E11D48 68%, #4C0519 100%)',
}

// ── State helpers ──────────────────────────────────────────────────────────────
function status(id)    { return props.agentStates[id]?.status ?? 'idle' }
function pos(id)       { return PENTA_NODES[id] }
function ringColor(id) { return RING_COLORS[id] ?? '#A5B4FC' }

// ── Inline style per node group ───────────────────────────────────────────────
// Idle     → faded to 25% opacity; no animation.
// Processing → full opacity + breathing scale animation.
// Completed  → full opacity; static (no animation).
function nodeGroupStyle(id) {
  const s    = status(id)
  const base = { transformBox: 'fill-box', transformOrigin: 'center' }
  if (s === 'idle')       return { ...base, opacity: 0.25, transition: 'opacity 0.6s ease' }
  if (s === 'processing') return { ...base, opacity: 1, animation: 'sphere-breathe 1.8s ease-in-out infinite' }
  return { ...base, opacity: 1, transition: 'opacity 0.4s ease' }
}

// Legend dot style — reflects status opacity as a subtle live cue
function legendDotStyle(id) {
  return {
    background:   LEGEND_GRADIENTS[id] ?? '#CBD5E1',
    borderRadius: '50%',
    opacity:      status(id) === 'idle' ? 0.3 : 1,
    transition:   'opacity 0.6s ease',
  }
}

// ── Active topology lines keyed by phase ──────────────────────────────────────
// bidir:true renders a second counter-stream line for the bidirectional loops.
const topologyLines = computed(() => {
  const n   = PENTA_NODES
  const idx = props.currentPhaseIndex
  if (idx === 1) return [
    { id: 'r-m', x1: n.research.x, y1: n.research.y, x2: n.market.x,   y2: n.market.y   },
  ]
  if (idx === 2) return [
    { id: 'm-c', x1: n.market.x,   y1: n.market.y,   x2: n.creative.x, y2: n.creative.y, bidir: true },
  ]
  if (idx === 3) return [
    { id: 'p-f', x1: n.product.x,  y1: n.product.y,  x2: n.finance.x,  y2: n.finance.y,  bidir: true },
  ]
  if (idx === 4) return [
    { id: 'r-p', x1: n.research.x, y1: n.research.y, x2: n.product.x, y2: n.product.y },
    { id: 'm-p', x1: n.market.x,   y1: n.market.y,   x2: n.product.x, y2: n.product.y },
    { id: 'c-p', x1: n.creative.x, y1: n.creative.y, x2: n.product.x, y2: n.product.y },
    { id: 'f-p', x1: n.finance.x,  y1: n.finance.y,  x2: n.product.x, y2: n.product.y },
  ]
  return []
})

// ── Completion CTA ────────────────────────────────────────────────────────────
const showGtmLabel = computed(() => props.globalProgress >= 1.0)
</script>

<template>
  <!--
    Single flex-column root:
    - SVG (flex-1)     → the pentagon constellation, scales to fill height
    - Legend (shrink-0) → HTML row of CSS 3D-gradient dots + agent labels
  -->
  <div class="flex flex-col w-full h-full overflow-hidden">

    <!-- ── Main SVG ──────────────────────────────────────────────────────── -->
    <div class="flex-1 min-h-0 flex items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style="overflow: visible;"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >

        <!-- ================================================================
             DEFS — Radial gradients for 3D sphere lighting.
             Light source: upper-left (cx="35%" cy="30%").
             4 stops per gradient: specular → highlight → base → deep shadow.
        ================================================================ -->
        <defs>

          <!-- Research — blue family -->
          <radialGradient id="rg-research" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#EFF6FF" />
            <stop offset="28%"  stop-color="#93C5FD" />
            <stop offset="68%"  stop-color="#3B82F6" />
            <stop offset="100%" stop-color="#1E3A8A" />
          </radialGradient>

          <!-- Market — violet family -->
          <radialGradient id="rg-market" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#F5F3FF" />
            <stop offset="28%"  stop-color="#A78BFA" />
            <stop offset="68%"  stop-color="#7C3AED" />
            <stop offset="100%" stop-color="#2E1065" />
          </radialGradient>

          <!-- Product — emerald family -->
          <radialGradient id="rg-product" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#ECFDF5" />
            <stop offset="28%"  stop-color="#6EE7B7" />
            <stop offset="68%"  stop-color="#059669" />
            <stop offset="100%" stop-color="#022C22" />
          </radialGradient>

          <!-- Creative — orange family -->
          <radialGradient id="rg-creative" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#FFF7ED" />
            <stop offset="28%"  stop-color="#FDBA74" />
            <stop offset="68%"  stop-color="#EA580C" />
            <stop offset="100%" stop-color="#431407" />
          </radialGradient>

          <!-- Finance — rose family -->
          <radialGradient id="rg-finance" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stop-color="#FFF1F2" />
            <stop offset="28%"  stop-color="#FDA4AF" />
            <stop offset="68%"  stop-color="#E11D48" />
            <stop offset="100%" stop-color="#4C0519" />
          </radialGradient>

        </defs>

        <!-- Permanent structural mesh — all 10 unique edges between the 5 nodes -->
        <!-- Pentagon edges -->
        <line x1="156" y1="68"  x2="148" y2="144" stroke="#64748B" stroke-width="0.9" opacity="0.3" />
        <line x1="148" y1="144" x2="74"  y2="159" stroke="#64748B" stroke-width="0.9" opacity="0.3" />
        <line x1="74"  y1="159" x2="35"  y2="93"  stroke="#64748B" stroke-width="0.9" opacity="0.3" />
        <line x1="35"  y1="93"  x2="86"  y2="36"  stroke="#64748B" stroke-width="0.9" opacity="0.3" />
        <line x1="86"  y1="36"  x2="156" y2="68"  stroke="#64748B" stroke-width="0.9" opacity="0.3" />
        <!-- Pentagram diagonals -->
        <line x1="156" y1="68"  x2="74"  y2="159" stroke="#475569" stroke-width="0.7" opacity="0.2" />
        <line x1="156" y1="68"  x2="35"  y2="93"  stroke="#475569" stroke-width="0.7" opacity="0.2" />
        <line x1="148" y1="144" x2="35"  y2="93"  stroke="#475569" stroke-width="0.7" opacity="0.2" />
        <line x1="148" y1="144" x2="86"  y2="36"  stroke="#475569" stroke-width="0.7" opacity="0.2" />
        <line x1="74"  y1="159" x2="86"  y2="36"  stroke="#475569" stroke-width="0.7" opacity="0.2" />

        <!-- ── Active topology lines ───────────────────────────────────── -->
        <template v-for="line in topologyLines" :key="line.id">

          <!-- Forward particle stream -->
          <line
            :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
            stroke="#818CF8"
            stroke-width="1.5"
            stroke-linecap="round"
            class="animate-dash-flow"
          />

          <!-- Reverse particle stream (bidirectional phases only) -->
          <line
            v-if="line.bidir"
            :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
            stroke="#C4B5FD"
            stroke-width="1"
            stroke-linecap="round"
            class="animate-dash-flow-reverse"
          />

        </template>

        <!-- ================================================================
             AGENT SPHERES — all 5 always rendered (no v-if hiding).
             State is expressed only via opacity, animation, and overlays.
        ================================================================ -->
        <g
          v-for="agent in agents"
          :key="agent.id"
          :style="nodeGroupStyle(agent.id)"
        >

          <!-- COMPLETED: thin elegant outer ring — retains agent color identity -->
          <circle
            v-if="status(agent.id) === 'completed'"
            :cx="pos(agent.id).x"
            :cy="pos(agent.id).y"
            r="18"
            :stroke="ringColor(agent.id)"
            stroke-width="1"
            fill="none"
            opacity="0.5"
          />

          <!-- PROCESSING: two staggered expanding pulse rings -->
          <circle
            v-if="status(agent.id) === 'processing'"
            :cx="pos(agent.id).x"
            :cy="pos(agent.id).y"
            r="13"
            :stroke="ringColor(agent.id)"
            stroke-width="1.5"
            fill="none"
            class="animate-ring-expand"
          />
          <circle
            v-if="status(agent.id) === 'processing'"
            :cx="pos(agent.id).x"
            :cy="pos(agent.id).y"
            r="13"
            :stroke="ringColor(agent.id)"
            stroke-width="1.5"
            fill="none"
            class="animate-ring-expand"
            style="animation-delay: 0.8s"
          />

          <!-- 3D SPHERE — radial gradient fill; always agent's own color (never green on complete) -->
          <circle
            :cx="pos(agent.id).x"
            :cy="pos(agent.id).y"
            r="13"
            :fill="`url(#rg-${agent.id})`"
          />

          <!-- Specular highlight — small white ellipse at upper-left for glass depth -->
          <ellipse
            :cx="pos(agent.id).x - 3.5"
            :cy="pos(agent.id).y - 4"
            rx="3.5" ry="2.2"
            fill="white"
            opacity="0.4"
          />

          <!-- COMPLETED: crisp white checkmark overlay on top of sphere -->
          <path
            v-if="status(agent.id) === 'completed'"
            :d="`M ${pos(agent.id).x - 5} ${pos(agent.id).y + 0.5}
                 L ${pos(agent.id).x - 1.5} ${pos(agent.id).y + 4}
                 L ${pos(agent.id).x + 6} ${pos(agent.id).y - 4.5}`"
            stroke="white"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />

          <!-- IDLE / PROCESSING: emoji icon (suppressed when completed shows checkmark) -->
          <text
            v-if="status(agent.id) !== 'completed'"
            :x="pos(agent.id).x"
            :y="pos(agent.id).y + 4.5"
            text-anchor="middle"
            font-size="11"
            style="pointer-events: none; user-select: none;"
          >{{ agent.icon }}</text>

        </g>


      </svg>
    </div>

    <!-- ── Color key legend ───────────────────────────────────────────────
         Two-column grid. Each item: CSS 3D-gradient dot + agent label.
         Dot opacity mirrors idle/active status for a subtle live cue.
    ─────────────────────────────────────────────────────────────────── -->
    <div class="shrink-0 grid grid-cols-2 gap-x-3 gap-y-[5px] px-2 pt-1 pb-2">
      <div
        v-for="agent in agents"
        :key="'legend-' + agent.id"
        class="flex items-center gap-[5px] min-w-0"
      >
        <!-- Mini 3D sphere via CSS radial-gradient -->
        <div
          class="w-[10px] h-[10px] shrink-0"
          :style="legendDotStyle(agent.id)"
        />
        <span
          class="text-[8px] truncate leading-none capitalize transition-colors duration-500"
          :class="status(agent.id) === 'processing' ? 'text-indigo-300 font-semibold'
                : status(agent.id) === 'completed'  ? 'text-slate-300 font-medium'
                : 'text-slate-500'"
        >{{ agent.id }}</span>
      </div>
    </div>

    <!-- ── Completion CTA — revealed at 100 % ────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-700 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showGtmLabel" class="shrink-0 px-2 pb-2.5 pt-1">
        <div class="h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent mb-2.5" />
        <button
          class="w-full rounded-xl px-3 py-2.5
                 bg-gradient-to-r from-indigo-500 to-violet-600
                 text-white text-[10px] font-bold tracking-wide text-center
                 shadow-lg shadow-indigo-500/40
                 ring-2 ring-indigo-400/50 ring-offset-1 ring-offset-slate-900
                 hover:shadow-indigo-500/60 hover:scale-[1.03]
                 active:scale-[0.97] transition-all duration-200
                 animate-cta-glow"
        >
          📊 Launch Project Deck
        </button>
      </div>
    </Transition>

  </div>
</template>

<style>
/*
  Processing sphere breathing animation.
  transform-box: fill-box + transform-origin: center (set inline via :style)
  ensure the scale happens from the circle's own center in SVG space.
*/
@keyframes sphere-breathe {
  0%, 100% { transform: scale(1);    }
  50%       { transform: scale(1.12); }
}
</style>
