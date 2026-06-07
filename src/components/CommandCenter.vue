<script setup>
import { computed, ref } from 'vue'
import { useDemoEngine } from '../composables/useDemoEngine.js'
import OrchestrationMap from './OrchestrationMap.vue'

const {
  startDemo, pauseDemo, resetDemo,
  isPlaying, globalProgress, agentStates,
  currentPhase, currentPhaseIndex, phaseProgress, AGENT_CONTENT,
} = useDemoEngine()

const progressPct = computed(() => Math.round(globalProgress.value * 100))
const phaseLabel  = computed(() => currentPhase.value?.label ?? '')

// ── Pre-flight state machine ──────────────────────────────────────────────────
const uiStage         = ref('initial') // 'initial' | 'sliding' | 'active'
const typedText       = ref('')
const showWave        = ref(false)
const isPreflighting  = ref(false)
const spawnedAgentIds = ref([])

const TASK_TEXT = 'Create a go-to-market plan for a new gaming chair'

// Transform-origins mapped to each agent's pentagon node position (cellular mitosis effect)
const PANEL_ORIGINS = {
  research: 'top right',
  market:   'bottom right',
  product:  'bottom left',
  creative: 'center left',
  finance:  'top center',
}

// Override all agent states to idle until pipeline is released in 'active' stage
const effectiveAgentStates = computed(() => {
  if (uiStage.value !== 'active') {
    return Object.fromEntries(
      Object.keys(agentStates.value).map(id => [id, { status: 'idle', depthState: 'normal' }])
    )
  }
  return agentStates.value
})

function delay(ms) { return new Promise(res => setTimeout(res, ms)) }

async function runPreFlight() {
  if (isPreflighting.value || uiStage.value !== 'initial') return
  isPreflighting.value = true
  typedText.value = ''
  spawnedAgentIds.value = []

  // Start wave and typing loop simultaneously
  showWave.value = true
  for (let i = 1; i <= TASK_TEXT.length; i++) {
    typedText.value = TASK_TEXT.slice(0, i)
    await delay(44)
  }

  // Hold 500ms after typing completes — panel stays static
  await delay(500)

  // Commander panel glides from center to its grid position
  uiStage.value = 'sliding'

  // Fire-and-forget staggered spawn — panels burst outward along the commander's line of flight
  const SPAWN_DELAYS = [300, 450, 600, 750, 900]
  AGENTS.forEach((agent, i) => {
    setTimeout(() => {
      spawnedAgentIds.value = [...spawnedAgentIds.value, agent.id]
    }, SPAWN_DELAYS[i])
  })

  // Wait for slide (1400ms) + last spawn (1000ms) + settle, then release the pipeline
  await delay(1600)
  uiStage.value = 'active'
  showWave.value = false
  isPreflighting.value = false
  startDemo()
}

function handlePlayPause() {
  if (uiStage.value === 'initial') { runPreFlight(); return }
  if (isPlaying.value) { pauseDemo() } else { startDemo() }
}

function handleReset() {
  uiStage.value         = 'initial'
  typedText.value       = ''
  showWave.value        = false
  isPreflighting.value  = false
  spawnedAgentIds.value = []
  resetDemo()
}

// ── Depth-state → panel class map ────────────────────────────────────────────
const DEPTH_CLASSES = {
  foreground: 'scale-[1.05] z-20 bg-white/75 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.35)] opacity-100',
  normal:     'scale-[1.0]    z-10 bg-white/85 backdrop-blur-xl border border-white/30 shadow-[0_12px_35px_rgba(0,0,0,0.25)] opacity-90',
  background: 'scale-[0.92] z-0  bg-white/50 backdrop-blur-md  border border-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.20)] opacity-75',
}

function getAgentState(id) {
  return effectiveAgentStates.value[id] ?? { status: 'idle', depthState: 'normal' }
}
function depthClasses(id) {
  return DEPTH_CLASSES[getAgentState(id).depthState] ?? DEPTH_CLASSES.normal
}
function getContent(id) {
  return AGENT_CONTENT[id] ?? { terminalLogs: [], summaryData: {} }
}

// ── Terminal stack ────────────────────────────────────────────────────────────
const STACK_DEPTH = [
  'bottom-6  scale-100    opacity-100 z-30 font-semibold text-slate-900 border-blue-200/80  shadow-md',
  'bottom-24 scale-95     opacity-60  z-20 text-slate-500 border-slate-200/60 shadow-sm',
  'bottom-40 scale-90     opacity-30  z-10 text-slate-400 border-slate-200/40',
  'bottom-56 scale-[0.85] opacity-10  z-0  text-slate-300 border-slate-200/20',
]

function stackLines(agentId) {
  const logs  = getContent(agentId).terminalLogs
  const count = Math.min(
    Math.floor(phaseProgress.value * (logs.length + 1)),
    logs.length,
  )
  const start = Math.max(0, count - 4)
  const items = []
  for (let i = count - 1; i >= start; i--) {
    items.push({ text: logs[i], originalIndex: i, stackIndex: count - 1 - i })
  }
  return items
}

function agentIsStreaming(agentId) {
  const logs  = getContent(agentId).terminalLogs
  const count = Math.min(
    Math.floor(phaseProgress.value * (logs.length + 1)),
    logs.length,
  )
  return count < logs.length
}

// ── Processing sub-states ─────────────────────────────────────────────────────
const SYNTH_LABELS = {
  research: '✍  Drafting strategic artifacts...',
  market:   '⚙  Synthesizing market matrix...',
  product:  '⚙  Compiling GTM blueprint...',
  creative: '✍  Rendering creative concepts...',
  finance:  '⚙  Finalizing financial projections...',
}

function processingSubState() {
  const pp = phaseProgress.value
  if (pp < 0.55) return 'terminal'
  if (pp < 0.85) return 'synthesizing'
  return 'summary'
}

function panelKey(agentId) {
  const { status } = getAgentState(agentId)
  if (status === 'idle')      return 'idle'
  if (status === 'completed') return 'summary'
  return processingSubState()
}


// ── Summary data ──────────────────────────────────────────────────────────────
const MARKET_SEGMENTS = [
  { label: 'Core Gamers',    pct: 45, color: 'bg-violet-400' },
  { label: 'Streamers',      pct: 20, color: 'bg-purple-400' },
  { label: 'Remote Workers', pct: 20, color: 'bg-slate-400'  },
  { label: 'Enthusiasts',    pct: 15, color: 'bg-slate-300'  },
]
const FINANCE_COSTS = [
  { key: 'Materials', val: 180 },
  { key: 'Mfg',       val:  70 },
  { key: 'Packaging', val:  15 },
  { key: 'Logistics', val:  25 },
]
const TOTAL_COGS = FINANCE_COSTS.reduce((sum, c) => sum + c.val, 0)

// ── Agent definitions ─────────────────────────────────────────────────────────
// svgColor: hex used for the topology SVG node dot + ring
const AGENTS = [
  { id: 'research', role: 'Research Analyst',   icon: '🔍', accentGradient: 'from-blue-400 to-sky-300',      svgColor: '#60A5FA', tools: ['web_search', 'scraper', 'pdf_reader']     },
  { id: 'market',   role: 'Market Strategist',  icon: '📈', accentGradient: 'from-violet-500 to-purple-400', svgColor: '#8B5CF6', tools: ['analytics', 'crm_data', 'survey_tool']    },
  { id: 'product',  role: 'Product Strategist', icon: '🧩', accentGradient: 'from-emerald-500 to-teal-400',  svgColor: '#10B981', tools: ['notion', 'figma', 'jira']                 },
  { id: 'creative', role: 'Creative Director',  icon: '🎨', accentGradient: 'from-orange-400 to-amber-300',  svgColor: '#FB923C', tools: ['dalle_3', 'copywriter', 'brand_kit']      },
  { id: 'finance',  role: 'Financial Analyst',  icon: '💹', accentGradient: 'from-rose-500 to-pink-400',     svgColor: '#F43F5E', tools: ['excel_mcp', 'forecasting', 'market_data'] },
]

// Pentagon logic, topology lines, node state rendering, and CTA live in OrchestrationMap.vue.
</script>

<template>
  <div
    class="relative w-screen h-screen overflow-hidden flex flex-col
           bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200
           "
  >

    <!-- Ambient orbs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div class="absolute -top-48 -left-48 w-[580px] h-[580px] rounded-full bg-teal-500/[0.07] blur-3xl" />
      <div class="absolute top-50 -right-48 w-[880px] h-[880px] rounded-full bg-indigo-500/[0.06] blur-3xl" />
      <div class="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[1020px] h-[820px] rounded-full bg-slate-500/[0.09] blur-3xl" />
    </div>

    <!-- ====================================================================
         HEADER — simplified; voice input moved to Commander Panel
    ===================================================================== -->
    <!-- <header
      class="relative z-20 shrink-0 flex items-center justify-between
             h-14 px-6
             bg-slate-900/80 backdrop-blur-md
             border-b border-slate-700/50 shadow-sm shadow-black/30"
    >
      <div class="flex items-center gap-2.5 w-48 shrink-0">
        <div class="w-6 h-6 rounded-md shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600
                    flex items-center justify-center shadow-md shadow-indigo-500/25">
          <span class="text-white text-[9px] font-black tracking-tighter select-none">AI</span>
        </div>
        <span class="text-[11px] font-semibold text-slate-300 uppercase tracking-[0.15em]">
          Command Center
        </span>
      </div>


      <div class="flex-1 flex justify-center">
        <div
          class="flex items-center gap-2 rounded-full px-4 py-1.5
                 bg-slate-800/70 border border-slate-600/50 shadow-sm"
        >
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300"
            :class="isPlaying ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'"
          />
          <span class="text-[10px] font-semibold text-slate-300 uppercase tracking-wider truncate max-w-[260px]">
            {{ phaseLabel || 'Ready' }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-4 w-48 shrink-0 justify-end">
        <span
          class="text-xs font-semibold rounded-full px-2.5 py-0.5
                 transition-colors duration-300"
          :class="isPlaying
            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-700/50'
            : 'text-slate-500  bg-slate-800/60  border border-slate-700/50'"
        >
          {{ isPlaying ? 'Running' : 'Paused' }}
        </span>
        <span class="text-xs text-slate-400 font-mono tabular-nums">{{ progressPct }}%</span>
        <button
          class="w-6 h-6 rounded-md bg-slate-800/60 border border-slate-700/50
                 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Settings"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2"
               viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3
                     6h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9 6h3.75m-3.75
                     0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </div>
    </header> -->

    <!-- ====================================================================
         MAIN — 6-column flex row
    ===================================================================== -->
    <main class="relative z-10 flex-1 flex items-stretch px-8 pt-8 pb-20 gap-8 overflow-hidden">

      <!-- ==================================================================
           COLUMN 0 — COMMANDER NODE
           Pentagon constellation map, animated data lines, completion CTA
      =================================================================== -->

      <div
        class="w-[360px] flex-none flex flex-col overflow-hidden
               rounded-2xl border border-slate-700/60
               bg-slate-900/95 backdrop-blur-2xl
               shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.5)]"
        :style="uiStage === 'initial'
? { transform: 'translateX(calc(50vw - 50% - 24px))' }
          : { transform: 'translateX(0)', transition: 'transform 1.4s cubic-bezier(0.25, 1, 0.3, 1)' }"
      >
        <!-- Indigo accent stripe -->
        <div class="h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-400 shrink-0" />

        <!-- Commander header -->
        <div class="px-3 pt-2.5 pb-2 shrink-0 bg-slate-800/60 border-b border-slate-700/40">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600
                        flex items-center justify-center shadow shadow-indigo-400/30">
              <span class="text-[11px] leading-none select-none">⚡</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[7px] font-bold text-indigo-400 uppercase tracking-[0.15em] leading-none">Orchestrator</p>
              <p class="text-[11px] font-black text-slate-100 leading-tight">Commander Node</p>
            </div>
            <span
              class="text-[8px] font-bold rounded-full px-1.5 py-0.5 shrink-0 transition-colors duration-300"
              :class="isPlaying
                ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-700/50'
                : 'text-slate-500  bg-slate-800/60  border border-slate-700/50'"
            >{{ isPlaying ? '▶' : '⏸' }}</span>
          </div>
        </div>

        <!-- Pre-flight: prompt typing area -->
        <div
          v-if="uiStage === 'initial' || uiStage === 'sliding'"
          class="px-3 pt-2.5 pb-2.5 shrink-0 border-b border-slate-700/40 flex"
        >
          <div class="flex-grow rounded-lg bg-slate-800/70 border border-slate-600/40 ring-1 ring-inset ring-white/5
                      px-2.5 py-2 flex items-start gap-1.5">
            <svg class="w-2.5 h-2.5 text-indigo-400 shrink-0 mt-[1px]" fill="none"
                 stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <p class="text-[11px] font-mono text-slate-200 leading-snug flex-1 min-w-0 break-words">
              {{ typedText }}<span
                v-if="typedText.length < TASK_TEXT.length"
                class="inline-block w-[7px] h-[11px] bg-indigo-400 animate-pulse rounded-[1px] ml-px align-middle"
              />
            </p>
          </div>
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="showWave && (uiStage === 'initial' || uiStage === 'sliding')"
            class="px-3 pt-2.5 pb-2.5 shrink-0 border-b border-slate-700/40"
          >
            <!-- <p class="text-[7px] font-bold text-indigo-400/50 uppercase tracking-[0.18em] mb-2 font-mono">
              ◎ Processing prompt...
            </p> -->
            <div class="flex items-end justify-center gap-[2px] h-8">
              <div
                v-for="n in 8" :key="n"
                class="w-[3px] bg-indigo-400/70 rounded-full shrink-0"
                :style="{
                  animationName: 'bar-eq',
                  animationDuration: `${240 + ((n * 97) % 440)}ms`,
                  animationDelay: `${(n * 67) % 500}ms`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                }"
              />
            </div>
          </div>
        </Transition>          
        </div>

        <!-- Pre-flight: listening wave -->


        <!-- Post-flight: active task -->
        <div
          v-if="uiStage !== 'initial' && uiStage !== 'sliding'"
          class="px-3 pt-2 pb-2 shrink-0 border-b border-slate-700/40"
        >
          <div class="rounded-lg bg-slate-800/70 border border-slate-600/40 ring-1 ring-inset ring-white/5
                      px-2.5 py-2 flex items-start gap-1.5">
            <svg class="w-2.5 h-2.5 text-indigo-400 shrink-0 mt-[1px]" fill="none"
                 stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <p class="text-[9px] font-medium text-slate-300 leading-snug">
              Create a go-to-market plan for a new gaming chair
            </p>
          </div>
        </div>

        <!-- ── Pentagon Constellation Map → OrchestrationMap component ──── -->
        <!-- <div class="flex-1 min-h-0 overflow-hidden px-4 pt-1 pb-0 ">
          <OrchestrationMap
            :agents="AGENTS"
            :agent-states="effectiveAgentStates"
            :current-phase-index="currentPhaseIndex"
            :global-progress="globalProgress"
          />
        </div> -->
<OrchestrationMap
  :agents="AGENTS"
  :agent-states="uiStage === 'active' ? agentStates : Object.fromEntries(spawnedAgentIds.map(id => [id, { status: 'idle' }]))"
  :current-phase-index="currentPhaseIndex"
  :global-progress="globalProgress"
  :ui-stage="uiStage" />      

      </div>
      <!-- /Commander Node -->

      <!-- ==================================================================
           COLUMNS 1-5 — AGENT PANELS
      =================================================================== -->
      <div
        v-for="(agent, idx) in AGENTS"
        :key="agent.id"
        class="flex-1 flex flex-col min-w-0 overflow-hidden
               rounded-xl backdrop-blur-md border
               transition-all duration-500 ease-in-out mx-2"
        :class="depthClasses(agent.id)"
        :style="{
          transformOrigin: 'center center',
          ...(uiStage === 'active'
            ? {}
            : spawnedAgentIds.includes(agent.id)
              ? { transform: 'scale(1)', opacity: '1', transition: 'all 650ms cubic-bezier(0.25, 1, 0.5, 1)' }
              : { transform: 'scale(0.75)', opacity: '0', transition: 'none', pointerEvents: 'none' }
          ),
        }"
      >

        <!-- Accent strip -->
        <div :class="`h-[3px] w-full bg-gradient-to-r shrink-0 ${agent.accentGradient}`" />

        <!-- ── Panel Header ───────────────────────────────────────────── -->
        <div class="px-4 pt-3.5 pb-3 shrink-0 border-b border-slate-100/80 bg-white/30">
          <div class="flex items-start gap-2.5">

            <div :class="`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center
                           bg-gradient-to-br ${agent.accentGradient} shadow`">
              <span class="text-sm leading-none select-none">{{ agent.icon }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Agent</p>
              <p class="text-[13px] font-bold text-slate-700 truncate leading-tight">{{ agent.role }}</p>
            </div>

            <!-- idle -->
            <div v-if="getAgentState(agent.id).status === 'idle'"
                 class="flex items-center gap-1 mt-1 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span class="text-[9px] font-semibold text-slate-300 uppercase tracking-wide">Waiting</span>
            </div>

            <!-- processing — badge colour follows sub-state -->
            <div v-else-if="getAgentState(agent.id).status === 'processing'"
                 class="flex items-center gap-1 mt-1 shrink-0">
              <span
                class="w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-300"
                :class="processingSubState() === 'synthesizing' ? 'bg-amber-400' : 'bg-emerald-400'"
              />
              <span
                class="text-[9px] font-semibold uppercase tracking-wide transition-colors duration-300"
                :class="processingSubState() === 'synthesizing' ? 'text-amber-500' : 'text-emerald-500'"
              >{{ processingSubState() === 'synthesizing' ? 'Synth' : 'Live' }}</span>
            </div>

            <!-- completed -->
            <div v-else class="flex flex-col items-end gap-[3px] mt-1 shrink-0">
              <div class="flex items-center gap-[5px] bg-emerald-50/80 border border-emerald-200/40
                          rounded-full px-2 py-[3px]">
                <span class="text-[8px] font-bold text-emerald-500 leading-none">✓</span>
                <span class="text-[8px] font-semibold text-emerald-600/80 uppercase tracking-wide leading-none">
                  Complete
                </span>
              </div>
              <span class="text-[7px] font-medium text-slate-300 tracking-widest leading-none uppercase">
                Data Pipe Active
              </span>
            </div>

          </div>
        </div>

        <!-- ── Panel Body ─────────────────────────────────────────────────── -->
        <div class="flex-1 min-h-0 relative overflow-hidden">
          <Transition
            mode="out-in"
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0"
          >

            <!-- ══════════════════════════════════════════════════
                 IDLE
            ═════════════════════════════════════════════════════ -->
            <div
              v-if="panelKey(agent.id) === 'idle'"
              key="idle"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
            >
              <div class="w-10 h-10 rounded-full bg-slate-100/80 border border-slate-300/60
                          flex items-center justify-center">
                <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor"
                     stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
              </div>
              <p class="text-sm text-slate-300 font-medium text-center leading-relaxed">
                Waiting...
              </p>
            </div>

            <!-- ══════════════════════════════════════════════════
                 TERMINAL — 3D log stack (0–55 % of phase)
            ═════════════════════════════════════════════════════ -->
            <div
              v-else-if="panelKey(agent.id) === 'terminal'"
              key="terminal"
              class="absolute inset-0 overflow-hidden"
            >

              <div class="absolute inset-0 flex items-center justify-center
                          pointer-events-none select-none" aria-hidden="true">
                <svg
                  class="w-4/5 h-4/5 text-slate-400 transition-opacity duration-700"
                  :class="agentIsStreaming(agent.id) ? 'opacity-100' : 'opacity-0'"
                  viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="0.6"
                >
                  <circle cx="100" cy="100" r="18" opacity="0.55" />
                  <circle cx="100" cy="100" r="45" opacity="0.32" />
                  <circle cx="100" cy="100" r="72" opacity="0.18" />
                  <circle cx="100" cy="100" r="95" opacity="0.10" />
                  <line x1="100" y1="5"   x2="100" y2="195" opacity="0.22" />
                  <line x1="5"   y1="100" x2="195" y2="100" opacity="0.22" />
                  <line x1="87"  y1="87"  x2="82"  y2="82"  opacity="0.40" />
                  <line x1="113" y1="87"  x2="118" y2="82"  opacity="0.40" />
                  <line x1="113" y1="113" x2="118" y2="118" opacity="0.40" />
                  <line x1="87"  y1="113" x2="82"  y2="118" opacity="0.40" />
                </svg>
              </div>

              <div class="absolute top-3 left-4 right-4 z-40 flex items-center gap-2">
                <span class="relative flex w-2.5 h-2.5 shrink-0">
                  <span class="absolute inset-0 rounded-full bg-emerald-400"
                        :class="agentIsStreaming(agent.id) ? 'animate-ping opacity-70' : 'opacity-20'" />
                  <span class="relative rounded-full w-2.5 h-2.5 transition-colors duration-500"
                        :class="agentIsStreaming(agent.id) ? 'bg-emerald-500' : 'bg-slate-300'" />
                </span>
                <span class="text-[9px] font-bold uppercase tracking-[0.12em] transition-colors duration-500"
                      :class="agentIsStreaming(agent.id) ? 'text-emerald-600' : 'text-slate-400'">
                  Active Agent Execution
                </span>
              </div>

              <!-- Log stack cards -->
              <div
                v-for="item in stackLines(agent.id)"
                :key="item.originalIndex"
                class="absolute left-4 right-4 p-3
                       border rounded-xl
                       flex items-start gap-2
                       transition-all duration-700 ease-in-out text-white"
  :style="{
    backgroundColor: `${agent.svgColor}E6`
  }"                       
                :class="STACK_DEPTH[item.stackIndex] ?? 'opacity-0 pointer-events-none bottom-56 z-[-1]'"
              >
                <span class=" font-mono leading-snug shrink-0">›</span>
                <span class=" break-words min-w-0 leading-snug text-sm">{{ item.text }}<span
                  v-if="item.stackIndex === 0 && agentIsStreaming(agent.id)"
                  class="inline-block w-[6px] h-[10px] bg-white animate-pulse rounded-[1px] ml-1 align-middle"
                /></span>
              </div>

            </div>
            <!-- /terminal -->

            <!-- ══════════════════════════════════════════════════
                 SYNTHESIZING — skeleton loader (55–85 % of phase)
            ═════════════════════════════════════════════════════ -->
            <div
              v-else-if="panelKey(agent.id) === 'synthesizing'"
              key="synthesizing"
              class="absolute inset-0 flex flex-col gap-3.5 p-5
                     bg-gradient-to-b from-white/70 to-slate-50/60"
            >

              <div class="flex items-center gap-2.5 shrink-0">
                <div class="w-[18px] h-[18px] relative shrink-0">
                  <div class="absolute inset-0 rounded-full border-[1.5px]
                               border-slate-200 border-t-blue-400 animate-spin"
                       style="animation-duration: 1.4s" />
                  <div class="absolute inset-[3px] rounded-full border-[1.5px]
                               border-slate-100 border-b-blue-300 animate-spin"
                       style="animation-duration: 0.9s; animation-direction: reverse" />
                </div>
                <span class="text-[10px] font-semibold text-slate-500 tracking-wide animate-pulse">
                  {{ SYNTH_LABELS[agent.id] }}
                </span>
              </div>

              <div class="flex flex-col gap-2 shrink-0">
                <div class="h-2 bg-slate-200/80 rounded-full animate-pulse" style="width: 52%; animation-delay: 0ms" />
                <div class="h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="width: 88%; animation-delay: 80ms" />
                <div class="h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="width: 74%; animation-delay: 140ms" />
                <div class="h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="width: 82%; animation-delay: 200ms" />
              </div>

              <div class="h-px bg-slate-100/80 shrink-0" />

              <div class="flex flex-col gap-2 shrink-0">
                <div class="h-2 bg-slate-200/80 rounded-full animate-pulse" style="width: 44%; animation-delay: 60ms" />
                <div class="flex gap-2">
                  <div class="flex-1 h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="animation-delay: 120ms" />
                  <div class="w-10 h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="animation-delay: 160ms" />
                </div>
                <div class="flex gap-2">
                  <div class="flex-1 h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="animation-delay: 180ms" />
                  <div class="w-10 h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="animation-delay: 220ms" />
                </div>
                <div class="flex gap-2">
                  <div class="flex-1 h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="animation-delay: 240ms" />
                  <div class="w-10 h-1.5 bg-slate-100/90 rounded-full animate-pulse" style="animation-delay: 280ms" />
                </div>
              </div>

              <div class="mt-auto h-10 rounded-lg bg-blue-50/50 border border-blue-200/30 animate-pulse"
                   style="animation-delay: 300ms" />

            </div>
            <!-- /synthesizing -->

            <!-- ══════════════════════════════════════════════════
                 SUMMARY — final data panels (≥85 % OR completed)
                 key="summary" is shared so processing→completed
                 transition is visually silent (stable standby).
            ═════════════════════════════════════════════════════ -->
            <div
              v-else
              key="summary"
              class="absolute inset-0 overflow-y-auto"
            >

              <!-- RESEARCH -->
              <div v-if="agent.id === 'research'" class="flex flex-col gap-3 p-4">

                <div class="stagger-item rounded-xl border border-white/50 bg-white/40 overflow-hidden shrink-0
                             transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-md cursor-default"
                     style="animation-delay: 0ms">
                  <div class="px-3 py-2 bg-white/60 border-b border-white/50">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Top Competitors</p>
                  </div>
                  <div v-for="(name, i) in getContent(agent.id).summaryData.competitors" :key="name"
                       class="flex items-center gap-3 px-3 py-2 border-b border-white/40 last:border-0
                              hover:bg-white/30 transition-colors duration-150">
                    <span class="w-[18px] h-[18px] rounded-md bg-white/60 shrink-0 flex items-center justify-center
                                 text-[9px] font-bold text-slate-400">{{ i + 1 }}</span>
                    <span class="text-[12px] font-semibold text-slate-700">{{ name }}</span>
                  </div>
                </div>

                <div class="stagger-item flex flex-col gap-1.5 shrink-0 rounded-xl bg-white/30 border border-white/50 p-3"
                     style="animation-delay: 120ms">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Key Insights</p>
                  <div v-for="insight in getContent(agent.id).summaryData.insights" :key="insight"
                       class="flex items-start gap-2">
                    <span class="w-1 h-1 rounded-full bg-blue-400 mt-[5px] shrink-0" />
                    <p class="text-[11px] text-slate-600 leading-snug">{{ insight }}</p>
                  </div>
                </div>

                <div class="stagger-item rounded-xl bg-blue-50/80 border border-blue-200/60 p-3 shrink-0
                             transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-100/90 cursor-default"
                     style="animation-delay: 240ms">
                  <p class="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">
                    Positioning Opportunity
                  </p>
                  <p class="text-[11px] text-slate-700 leading-snug">
                    {{ getContent(agent.id).summaryData.opportunity }}
                  </p>
                </div>

              </div>
              <!-- /research -->

              <!-- MARKET -->
              <div v-else-if="agent.id === 'market'" class="flex flex-col gap-3 p-4">

                <div class="stagger-item shrink-0 rounded-xl bg-white/30 border border-white/50 p-3"
                     style="animation-delay: 0ms">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Market Trends</p>
                  <div v-for="trend in getContent(agent.id).summaryData.trends" :key="trend"
                       class="flex items-start gap-2 mb-1.5 last:mb-0">
                    <span class="w-1 h-1 rounded-full bg-violet-400 mt-[5px] shrink-0" />
                    <p class="text-[11px] text-slate-600 leading-snug">{{ trend }}</p>
                  </div>
                </div>

                <div class="stagger-item border-t border-white/40 shrink-0" style="animation-delay: 100ms" />

                <div class="stagger-item shrink-0 rounded-xl bg-white/30 border border-white/50 p-3"
                     style="animation-delay: 150ms">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Target Audience</p>
                  <div class="flex flex-col gap-2">
                    <div v-for="seg in MARKET_SEGMENTS" :key="seg.label" class="flex items-center gap-2.5">
                      <span class="text-[9px] text-slate-500 w-[90px] shrink-0 truncate">{{ seg.label }}</span>
                      <div class="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-1000 ease-out"
                             :class="seg.color" :style="{ width: seg.pct + '%' }" />
                      </div>
                      <span class="text-[9px] font-bold text-slate-500 w-7 text-right shrink-0">{{ seg.pct }}%</span>
                    </div>
                  </div>
                </div>

              </div>
              <!-- /market -->

              <!-- PRODUCT -->
              <div v-else-if="agent.id === 'product'" class="flex flex-col gap-3 p-4">

                <div class="stagger-item rounded-xl h-[68px] shrink-0 relative overflow-hidden
                             bg-gradient-to-br from-emerald-50/60 to-teal-50/40
                             border border-emerald-200/40 flex flex-col items-center justify-center gap-1"
                     style="animation-delay: 0ms">
                  <div class="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-emerald-100/50" />
                  <div class="absolute -left-2 -top-2 w-10 h-10 rounded-full bg-teal-100/40" />
                  <span class="relative text-xl select-none">🪑</span>
                  <span class="relative text-[9px] font-semibold text-emerald-700/60 tracking-wide">[ 3D Product Render ]</span>
                </div>

                <div class="stagger-item shrink-0 rounded-xl bg-white/30 border border-white/50 p-3"
                     style="animation-delay: 120ms">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">GTM Blueprint</p>
                  <div class="flex flex-col">
                    <div v-for="(step, i) in getContent(agent.id).summaryData.steps" :key="step"
                         class="flex items-center gap-2.5 py-2 px-1.5 border-b border-white/40 last:border-0
                                rounded-md hover:bg-white/30 hover:-translate-y-px transition-all duration-150 cursor-default">
                      <span class="w-[18px] h-[18px] rounded-md shrink-0 bg-emerald-100 border border-emerald-200/60
                                   flex items-center justify-center text-[8px] font-bold text-emerald-600">{{ i + 1 }}</span>
                      <span class="text-[11px] font-medium text-slate-700 leading-snug">{{ step }}</span>
                    </div>
                  </div>
                </div>

              </div>
              <!-- /product -->

              <!-- CREATIVE -->
              <div v-else-if="agent.id === 'creative'" class="flex flex-col gap-2.5 p-4">

                <p class="stagger-item text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0"
                   style="animation-delay: 0ms">Ad Concepts</p>

                <div v-for="(concept, i) in getContent(agent.id).summaryData.concepts" :key="concept.title"
                     class="stagger-item rounded-xl border border-white/50 bg-white/35 overflow-hidden shrink-0
                            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/60 cursor-default"
                     :style="{ animationDelay: (80 + i * 110) + 'ms' }">
                  <div class="h-9 flex items-center justify-center border-b border-white/40
                               bg-gradient-to-r from-orange-50/80 to-amber-50/60">
                    <span class="text-[9px] font-medium text-amber-500/70 tracking-wide select-none">[ Campaign Visual ]</span>
                  </div>
                  <div class="px-3 py-2.5">
                    <p class="text-[13px] font-black text-slate-800 tracking-tighter leading-none mb-1.5">{{ concept.title }}</p>
                    <p class="text-[10px] text-slate-500 leading-snug">{{ concept.desc }}</p>
                  </div>
                </div>

              </div>
              <!-- /creative -->

              <!-- FINANCE -->
              <div v-else-if="agent.id === 'finance'" class="flex flex-col gap-3 p-4">

                <div class="stagger-item rounded-xl bg-rose-50/80 border border-rose-200/60 px-4 py-2.5 text-center shrink-0
                             transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-rose-50 cursor-default"
                     style="animation-delay: 0ms">
                  <p class="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Pricing Strategy</p>
                  <p class="text-[17px] font-black text-slate-800 leading-none">
                    {{ getContent(agent.id).summaryData.pricing }}
                  </p>
                </div>

                <div class="stagger-item rounded-xl border border-white/50 bg-white/40 overflow-hidden shrink-0
                             transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/60 cursor-default"
                     style="animation-delay: 120ms">
                  <div class="px-3 py-2 bg-white/60 border-b border-white/50">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cost Structure / Unit</p>
                  </div>
                  <div v-for="cost in FINANCE_COSTS" :key="cost.key"
                       class="flex items-center gap-3 px-3 py-1.5 border-b border-white/40 last:border-0
                              hover:bg-white/30 transition-colors duration-150">
                    <span class="text-[11px] text-slate-500 capitalize w-20 shrink-0">{{ cost.key }}</span>
                    <div class="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-rose-300 rounded-full transition-all duration-1000 ease-out"
                           :style="{ width: (cost.val / TOTAL_COGS * 100) + '%' }" />
                    </div>
                    <span class="text-[11px] font-semibold text-slate-700 w-8 text-right shrink-0">${{ cost.val }}</span>
                  </div>
                  <div class="flex items-center justify-between px-3 py-2 bg-white/50">
                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Total COGS</span>
                    <span class="text-[11px] font-bold text-slate-700">${{ TOTAL_COGS }}</span>
                  </div>
                </div>

                <div class="stagger-item rounded-xl bg-white/50 border border-white/70 p-3 shrink-0
                             transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/80 cursor-default"
                     style="animation-delay: 240ms">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Y1 Financial Outlook</p>
                  <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="flex flex-col gap-0.5">
                      <p class="text-[9px] text-slate-400 leading-none">Units Sold</p>
                      <p class="text-[12px] font-black text-slate-700 leading-tight">
                        {{ getContent(agent.id).summaryData.outlook?.sold }}
                      </p>
                    </div>
                    <div class="flex flex-col gap-0.5 border-x border-slate-200/60">
                      <p class="text-[9px] text-slate-400 leading-none">Revenue</p>
                      <p class="text-[12px] font-black text-emerald-600 leading-tight">
                        {{ getContent(agent.id).summaryData.outlook?.revenue }}
                      </p>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <p class="text-[9px] text-slate-400 leading-none">Gross Profit</p>
                      <p class="text-[12px] font-black text-emerald-600 leading-tight">
                        {{ getContent(agent.id).summaryData.outlook?.profit }}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              <!-- /finance -->

              <div v-else class="flex items-center justify-center p-6">
                <p class="text-xs text-slate-300">No summary available.</p>
              </div>

            </div>
            <!-- /summary -->

          </Transition>
        </div>
        <!-- /panel body -->

        <!-- ── Panel Footer: Tool Chips ─────────────────────────────── -->
        <div class="px-4 pb-3.5 pt-2.5 shrink-0 border-t border-slate-100/80 bg-white/20">
          <div class="flex flex-wrap gap-1.5">
            <span class="text-[9px] font-semibold text-slate-500 py-1">Skills:</span>
            <span
              v-for="tool in agent.tools"
              :key="tool"
              class="text-[9px] font-semibold rounded-md px-2 py-[3px] leading-none
                     transition-colors duration-500"
              :class="getAgentState(agent.id).status === 'completed'
                ? 'text-emerald-600 bg-emerald-50  border border-emerald-200/70'
                : 'text-slate-500   bg-slate-100/80 border border-slate-200/60'"
            >{{ tool }}</span>
          </div>
        </div>

      </div>
      <!-- /agent panel -->

    </main>

    <!-- ====================================================================
         PLAY BAR
    ===================================================================== -->
    <div
      class="absolute bottom-0 left-0 right-0 z-50
             flex items-center gap-3 px-6 py-3
             bg-slate-900/90 backdrop-blur-md
             border-t border-slate-700/50
             shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.4)]"
    >

      <button
        class="w-8 h-8 rounded-lg flex items-center justify-center
               bg-blue-500 hover:bg-blue-600 active:bg-blue-700
               text-white shadow-sm shadow-blue-500/30 transition-colors duration-150"
        :aria-label="isPlaying ? 'Pause' : 'Play'"
        @click="handlePlayPause()"
      >
        <svg v-if="!isPlaying" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      </button>

      <button
        class="w-8 h-8 rounded-lg flex items-center justify-center
               bg-slate-800/80 hover:bg-slate-700 text-slate-400 transition-colors duration-150"
        aria-label="Reset"
        @click="handleReset()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                   0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <div class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-blue-400 rounded-full transition-all duration-100 ease-linear"
          :style="{ width: `${globalProgress * 100}%` }"
        />
      </div>

      <span class="text-xs font-mono text-slate-400 tabular-nums w-9 text-right shrink-0">
        {{ progressPct }}%
      </span>

      <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider
                   hidden sm:block w-52 text-right shrink-0 truncate">
        {{ phaseLabel }}
      </span>

    </div>

  </div>
</template>
