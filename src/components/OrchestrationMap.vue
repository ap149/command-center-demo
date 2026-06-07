<script setup>
import { computed } from 'vue'

const props = defineProps({
  agents:            { type: Array,  required: true },
  agentStates:       { type: Object, required: true },
  currentPhaseIndex: { type: Number, default: 0     },
  globalProgress:    { type: Number, default: 0     },
})

// ── Pentagon geometry ─────────────────────────────────────────────────────────
const PENTA_NODES = {
  research: { x: 190, y:  69 },
  market:   { x: 179, y: 171 },
  product:  { x:  79, y: 192 },
  creative: { x:  26, y: 103 },
  finance:  { x:  95, y:  26 },
}

// Mid-tone per agent — used for ring strokes (matches gradient stop ~28%)
const RING_COLORS = {
  research: '#93C5FD',
  market:   '#A78BFA',
  product:  '#6EE7B7',
  creative: '#FDBA74',
  finance:  '#FDA4AF',
}

// ── State helpers ─────────────────────────────────────────────────────────────
function status(id)    { return props.agentStates[id]?.status ?? 'idle' }
function pos(id)       { return PENTA_NODES[id] }
function ringColor(id) { return RING_COLORS[id] ?? '#A5B4FC' }

// ── Inline style per node group ───────────────────────────────────────────────

function nodeGroupStyle(id) {
  const s    = status(id)
  const base = { 
    transformBox: 'fill-box', 
    transformOrigin: 'center',
    // The magic transition line that handles the smooth fade of the blur itself:
    transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), filter 0.8s ease, opacity 0.8s ease'
  }

  // IDLE: Slightly recessed, but dialled back so it isn't too severe
  if (s === 'idle') {
    return { 
      ...base, 
      transform: 'scale(0.92)', // Changed from 0.85 (less acute depth step)
      opacity: 0.45,            // Slightly more visible
      filter: 'blur(1.2px)'     // Smooth inline CSS blur instead of the SVG url filter
    }
  }

  // PROCESSING: Gliding smoothly forward to focus
  if (s === 'processing') {
    return { 
      ...base, 
      transform: 'scale(1.15)', // Changed from 1.25 (keeps it closely bounded)
      opacity: 1,
      filter: 'blur(0px)',      // Animates cleanly to zero blur!
      animation: 'sphere-breathe 2.5s ease-in-out infinite' 
    }
  }

  // COMPLETED: Mid-ground baseline
  return { 
    ...base, 
    transform: 'scale(1)', 
    opacity: 0.85, 
    filter: 'blur(0px)' 
  }
}

// Legend fill keyed by status — readable on dark panel
function legendFill(id) {
  const s = status(id)
  if (s === 'processing') return '#A5B4FC'
  if (s === 'completed')  return '#CBD5E1'
  return '#aaa'
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


// ── Active topology lines keyed by phase ──────────────────────────────────────
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
    { id: 'r-p', x1: n.research.x, y1: n.research.y, x2: n.product.x,  y2: n.product.y  },
    { id: 'm-p', x1: n.market.x,   y1: n.market.y,   x2: n.product.x,  y2: n.product.y  },
    { id: 'c-p', x1: n.creative.x, y1: n.creative.y, x2: n.product.x,  y2: n.product.y  },
    { id: 'f-p', x1: n.finance.x,  y1: n.finance.y,  x2: n.product.x,  y2: n.product.y  },
  ]
  return []
})

const showGtmLabel = computed(() => props.globalProgress >= 1.0)
</script>

<template>
  <div class="w-full px-4 py-2">
    
    <!-- <div class="w-full bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.12] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">    -->
<div class="w-full bg-white/90 rounded-2xl p-4 


              ring-1 ring-inset ring-white/60
              shadow-[inset_4px_8px_60px_rgba(0,0,0,0.3),inset_-12px_-12px_12px_rgba(256,256,256,1)]">

      <div class="flex items-center gap-2 mb-4 px-1 select-none">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <h3 class="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
          Team Status // STANDING BY
        </h3>
      </div>

      <div class="w-full flex items-center justify-center">
        <svg
          viewBox="0 0 220 290"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style="overflow: visible;"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="sphere-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="14" stdDeviation="7" flood-color="#000000" flood-opacity="0.8" />
            </filter>        
            <filter id="dof-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>            
            <radialGradient id="rg-research" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stop-color="#EFF6FF" />
              <stop offset="28%"  stop-color="#93C5FD" />
              <stop offset="68%"  stop-color="#3B82F6" />
              <stop offset="100%" stop-color="#1E3A8A" />
            </radialGradient>
            <radialGradient id="rg-market" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stop-color="#F5F3FF" />
              <stop offset="28%"  stop-color="#A78BFA" />
              <stop offset="68%"  stop-color="#7C3AED" />
              <stop offset="100%" stop-color="#2E1065" />
            </radialGradient>
            <radialGradient id="rg-product" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stop-color="#ECFDF5" />
              <stop offset="28%"  stop-color="#6EE7B7" />
              <stop offset="68%"  stop-color="#059669" />
              <stop offset="100%" stop-color="#022C22" />
            </radialGradient>
            <radialGradient id="rg-creative" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stop-color="#FFF7ED" />
              <stop offset="28%"  stop-color="#FDBA74" />
              <stop offset="68%"  stop-color="#EA580C" />
              <stop offset="100%" stop-color="#431407" />
            </radialGradient>
            <radialGradient id="rg-finance" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stop-color="#FFF1F2" />
              <stop offset="28%"  stop-color="#FDA4AF" />
              <stop offset="68%"  stop-color="#E11D48" />
              <stop offset="100%" stop-color="#4C0519" />
            </radialGradient>
          </defs>

          <line x1="190" y1="69"  x2="179" y2="171" stroke="#334155" stroke-width="0.8" opacity="0.15" />
          <line x1="179" y1="171" x2="79"  y2="192" stroke="#334155" stroke-width="0.8" opacity="0.15" />
          <line x1="79"  y1="192" x2="26"  y2="103" stroke="#334155" stroke-width="0.8" opacity="0.15" />
          <line x1="26"  y1="103" x2="95"  y2="26"  stroke="#334155" stroke-width="0.8" opacity="0.15" />
          <line x1="95"  y1="26"  x2="190" y2="69"  stroke="#334155" stroke-width="0.8" opacity="0.15" />

          <line x1="190" y1="69"  x2="79"  y2="192" stroke="#334155" stroke-width="0.7" opacity="0.12" />
          <line x1="190" y1="69"  x2="26"  y2="103" stroke="#334155" stroke-width="0.7" opacity="0.12" />
          <line x1="179" y1="171" x2="26"  y2="103" stroke="#334155" stroke-width="0.7" opacity="0.12" />
          <line x1="179" y1="171" x2="95"  y2="26"  stroke="#334155" stroke-width="0.7" opacity="0.12" />
          <line x1="79"  y1="192" x2="95"  y2="26"  stroke="#334155" stroke-width="0.7" opacity="0.12" />

          <template v-for="line in topologyLines" :key="line.id">
            <line
              :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
              stroke="#818CF8"
              stroke-width="1.5"
              stroke-linecap="round"
              class="animate-dash-flow"
            />
            <line
              v-if="line.bidir"
              :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2"
              stroke="#C4B5FD"
              stroke-width="1"
              stroke-linecap="round"
              class="animate-dash-flow-reverse"
            />
          </template>

          <g
            v-for="agent in agents"
            :key="agent.id"
            :style="nodeGroupStyle(agent.id)"
          >
            <!-- <circle
              v-if="status(agent.id) === 'completed'"
              :cx="pos(agent.id).x"
              :cy="pos(agent.id).y"
              r="36"
              :stroke="ringColor(agent.id)"
              stroke-width="1"
              fill="none"
              opacity="0.5"
            /> -->
<!-- 
            <circle
              v-if="status(agent.id) === 'processing'"
              :cx="pos(agent.id).x"
              :cy="pos(agent.id).y"
              r="26"
              :stroke="ringColor(agent.id)"
              stroke-width="1.5"
              fill="none"
              class="animate-ring-expand"
            <!-- /> -->
            <!-- <circle
              v-if="status(agent.id) === 'processing'"
              :cx="pos(agent.id).x"
              :cy="pos(agent.id).y"
              r="26"
              :stroke="ringColor(agent.id)"
              stroke-width="1.5"
              fill="none"
              class="animate-ring-expand"
              style="animation-delay: 0.8s"
            /> --> -->

            <circle
              :cx="pos(agent.id).x"
              :cy="pos(agent.id).y"
              r="26"
              :fill="`url(#rg-${agent.id})`"
            />

            <ellipse
              :cx="pos(agent.id).x - 7"
              :cy="pos(agent.id).y - 8"
              rx="7" ry="4.4"
              fill="white"
              opacity="0.4"
            />

            <path
              v-if="status(agent.id) === 'completed'"
              :d="`M ${pos(agent.id).x - 10} ${pos(agent.id).y + 1}
                   L ${pos(agent.id).x - 3}  ${pos(agent.id).y + 8}
                   L ${pos(agent.id).x + 12} ${pos(agent.id).y - 9}`"
              stroke="white"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />

            <text
              v-if="status(agent.id) !== 'completed'"
              :x="pos(agent.id).x"
              :y="pos(agent.id).y + 9"
              text-anchor="middle"
              font-size="22"
              style="pointer-events: none; user-select: none;"
            >
              {{ agent.icon }}
            </text>
          </g>

          <g v-for="(agent, i) in agents" :key="'leg-' + agent.id">
            <circle
              :cx="18 + i * 46"
              cy="255"
              r="7"
              :fill="`url(#rg-${agent.id})`"
              :opacity="status(agent.id) === 'idle' ? 0.28 : 1"
            />
            <text
              :x="18 + i * 46"
              y="276"
              text-anchor="middle"
              font-size="9"
              font-weight="700"
              letter-spacing="0.05em"
              font-family="ui-sans-serif, system-ui, sans-serif"
              :fill="legendFill(agent.id)"
            >
              {{ capitalize(agent.id) }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-700 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showGtmLabel" class="w-full mt-4 pt-2">
        <button
          class="w-full rounded-xl px-3 py-2.5
                 bg-gradient-to-r from-indigo-500 to-violet-600
                 text-white text-[10px] font-bold tracking-wide text-center
                 shadow-lg shadow-indigo-500/30
                 ring-1 ring-indigo-400/30
                 hover:shadow-indigo-500/50 hover:scale-[1.02]
                 active:scale-[0.98] transition-all duration-200"
        >
          📊 Launch Project Deck
        </button>
      </div>
    </Transition>
  </div>
</template>

<style>
@keyframes sphere-breathe {
  0%, 100% { transform: scale(1);    }
  50%       { transform: scale(1.12); }
}
</style>