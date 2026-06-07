import { ref, computed } from 'vue'

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBACK CONFIGURATION
// Adjust TOTAL_DURATION to rescale the entire timeline.
// All progress thresholds in SEQUENCE are normalised 0.0 → 1.0, so they
// stretch or compress automatically without any other changes.
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_DURATION = 22_000 // ms  ← single source of truth for timeline length

// ─────────────────────────────────────────────────────────────────────────────
// AGENT IDs
// Canonical list. Matches the `id` fields expected by the panel layer.
// ─────────────────────────────────────────────────────────────────────────────
export const AGENT_IDS = ['research', 'market', 'product', 'creative', 'finance']

// ─────────────────────────────────────────────────────────────────────────────
// AGENT CONTENT
//
// Static script data for each agent keyed by AGENT_ID.
// Plain object — no reactivity needed; values never change at runtime.
//
// terminalLogs  : ordered strings shown one-by-one while status === 'processing'.
//                 Consumed by the panel's streaming log renderer.
//
// summaryData   : structured artefact shown when status === 'completed'.
//                 Shape varies per agent (see per-entry comments below).
//                 Components should use optional chaining when reading fields.
// ─────────────────────────────────────────────────────────────────────────────
export const AGENT_CONTENT = {

  // ── Research Analyst ────────────────────────────────────────────────────────
  research: {
    terminalLogs: [
      'Fetching Secretlab product catalog and pricing tiers...',
      'Analyzing noblechairs ergonomic patents and materials...',
      'Benchmarking DXRacer market positioning and review sentiment...',
      'Scanning r/battlestations & r/pcmasterrace for user pain points...',
      'Cross-referencing Steelcase and Herman Miller ergonomic research...',
      'Compiling competitor gap analysis matrix...',
    ],
    // summaryData shape: { competitors, insights, opportunity }
    summaryData: {
      competitors: ['Secretlab', 'DXRacer', 'noblechairs'],
      insights: [
        'Secretlab leads premium positioning at $499–$699',
        'Gap in adaptive ergonomics under $700',
        'Lumbar & neck support cited in 68% of negative reviews',
        '18–34 male demographic accounts for 74% of purchases',
      ],
      opportunity:
        'Focus on adaptive ergonomics and immersive gaming integration to capture the underserved $499–$699 comfort-first segment.',
    },
  },

  // ── Market Strategist ────────────────────────────────────────────────────────
  market: {
    terminalLogs: [
      'Fetching global gaming hardware market CAGR data (2024–2028)...',
      'Segmenting streamer vs. core gamer vs. remote worker demographics...',
      'Pulling gaming chair search volume trends across NA, EU, SEA...',
      'Mapping Twitch & YouTube influencer sponsorship rate benchmarks...',
      'Analysing DTC vs. retail channel margin split by region...',
    ],
    // summaryData shape: { trendTitle, trends, chartData }
    // chartData: [coreGamers%, streamers%, remoteWorkers%, enthusiasts%]
    summaryData: {
      trendTitle: 'Market Trends',
      trends: [
        'Global gaming chair market projected to hit $5.5B by 2028',
        'CAGR of 6.3% driven by hybrid work + esports growth',
        'DTC channel growing 2.1× faster than retail',
        'Influencer-led discovery accounts for 41% of first purchase',
      ],
      chartData: [45, 20, 20, 15], // Core Gamers | Streamers | Remote Workers | Enthusiasts
    },
  },

  // ── Product Strategist ───────────────────────────────────────────────────────
  product: {
    terminalLogs: [
      'Drafting Go-To-Market blueprint outline...',
      'Mapping 8-point GTM structure to gaming chair context...',
      'Cross-checking launch timeline against Q4 retail windows...',
      'Defining value proposition against competitor positioning matrix...',
      'Structuring success metrics and 90-day KPI framework...',
    ],
    // summaryData shape: { steps }
    summaryData: {
      steps: [
        'Market Opportunity',
        'Value Proposition',
        'Product Strategy',
        'Pricing Strategy',
        'Launch Plan',
        'Marketing Strategy',
        'Sales Channels',
        'Success Metrics',
      ],
    },
  },

  // ── Creative Director ────────────────────────────────────────────────────────
  creative: {
    terminalLogs: [
      'Generating ad copy hooks for esports & streaming audiences...',
      'Composing visual frame variations for hero launch campaign...',
      'Testing tagline resonance against core gamer persona brief...',
      'Drafting social proof angles for tier-1 streamer partnerships...',
      'Locking brand tone: premium-aggressive, not clinical...',
    ],
    // summaryData shape: { concepts: [{ title, desc }] }
    summaryData: {
      concepts: [
        {
          title: 'DOMINATE IN COMFORT',
          desc:  'Premium lifestyle positioning. Pairs ergonomic authority with aspirational gaming identity. Hero visual: low-angle chair shot, cinematic lighting.',
        },
        {
          title: 'BUILT FOR VICTORY',
          desc:  'Esports & streamer focus. Leans into performance language. Activates through sponsored stream overlays and tournament placement.',
        },
        {
          title: 'YOUR SETUP, EVOLVED',
          desc:  'Upgrade narrative targeting existing chair owners. Retargeting campaign with before/after battlestation comparisons.',
        },
      ],
    },
  },

  // ── Financial Analyst ────────────────────────────────────────────────────────
  finance: {
    terminalLogs: [
      'Running Bill of Materials cost model at 25,000-unit volume...',
      'Calculating gross margin projections at $499 / $599 ASP...',
      'Modeling retailer vs. DTC channel margin split...',
      'Stress-testing break-even at 40 / 60 channel mix assumption...',
      'Projecting Y1 revenue scenarios: base / bull / bear...',
      'Validating logistics cost assumptions against current freight index...',
    ],
    // summaryData shape: { pricing, costs, outlook }
    // costs keys are USD per unit; outlook keys are formatted strings
    summaryData: {
      pricing: '$499 – $599 Target ASP',
      costs: {
        materials:  180,  // USD per unit
        mfg:         70,
        packaging:   15,
        logistics:   25,
      },
      outlook: {
        sold:    '25,000 units',
        revenue: '$13.7M',
        profit:  '$8.2M',
      },
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPTED SEQUENCE MATRIX
//
// Each phase entry covers a [from, to) progress window and declares the
// exact { status, depthState } for every agent.
//
// status     : 'idle'       → not yet activated
//              'processing' → streaming / actively working
//              'completed'  → finished, final artefact visible
//
// depthState : 'normal'     → neutral z-position
//              'foreground' → scaled up, full focus
//              'background' → dimmed, visually receded
//
// Rules for editing:
//   • Phases must be contiguous — no gaps, no overlaps.
//   • The last phase's `to` must be 1.0 (inclusive endpoint).
//   • Every phase must list all 5 AGENT_IDs.
// ─────────────────────────────────────────────────────────────────────────────
export const SEQUENCE = [
  {
    // ── Phase 0 (0 – 25 %) ── Research Ingestion ──────────────────────────────
    index: 0,
    label: 'Research Ingestion',
    from:  0.0,
    to:    0.25,
    agents: {
      research: { status: 'processing', depthState: 'foreground' },
      market:   { status: 'idle',       depthState: 'normal'     },
      product:  { status: 'idle',       depthState: 'normal'     },
      creative: { status: 'idle',       depthState: 'normal'     },
      finance:  { status: 'idle',       depthState: 'normal'     },
    },
  },
  {
    // ── Phase 1 (25 – 30 %) ── Data Handoff → Market ─────────────────────────
    // Research completes; its output is passed directly to Market.
    index: 1,
    label: 'Data Handoff → Market',
    from:  0.25,
    to:    0.30,
    agents: {
      research: { status: 'completed',  depthState: 'background' },
      market:   { status: 'processing', depthState: 'foreground' },
      product:  { status: 'idle',       depthState: 'normal'     },
      creative: { status: 'idle',       depthState: 'normal'     },
      finance:  { status: 'idle',       depthState: 'normal'     },
    },
  },
  {
    // ── Phase 2 (30 – 50 %) ── Creative Synthesis ────────────────────────────
    // Market and Creative run simultaneously, exchanging loops on brand voice
    // and market positioning. Topology map draws a live bidirectional link.
    index: 2,
    label: 'Creative Synthesis Phase',
    from:  0.30,
    to:    0.50,
    agents: {
      research: { status: 'completed',  depthState: 'background' },
      market:   { status: 'processing', depthState: 'foreground' },
      product:  { status: 'idle',       depthState: 'normal'     },
      creative: { status: 'processing', depthState: 'foreground' },
      finance:  { status: 'idle',       depthState: 'normal'     },
    },
  },
  {
    // ── Phase 3 (50 – 75 %) ── Commercial Viability ───────────────────────────
    // Product and Finance run simultaneously, negotiating margins and GTM fit.
    index: 3,
    label: 'Commercial Viability Phase',
    from:  0.50,
    to:    0.75,
    agents: {
      research: { status: 'completed',  depthState: 'background' },
      market:   { status: 'completed',  depthState: 'background' },
      product:  { status: 'processing', depthState: 'foreground' },
      creative: { status: 'completed',  depthState: 'background' },
      finance:  { status: 'processing', depthState: 'foreground' },
    },
  },
  {
    // ── Phase 4 (75 – 90 %) ── Synthesis / Integration ───────────────────────
    // All four completed agents funnel their artefacts into Product for final
    // integration. Topology map shows four converging lines to the Product node.
    index: 4,
    label: 'Synthesis / Integration Phase',
    from:  0.75,
    to:    0.90,
    agents: {
      research: { status: 'completed',  depthState: 'background' },
      market:   { status: 'completed',  depthState: 'background' },
      product:  { status: 'processing', depthState: 'foreground' },
      creative: { status: 'completed',  depthState: 'background' },
      finance:  { status: 'completed',  depthState: 'background' },
    },
  },
  {
    // ── Phase 5 (90 – 100 %) ── Aggregate Closure ────────────────────────────
    // All agents complete and equalise to neutral depth.
    index: 5,
    label: 'Aggregate Closure',
    from:  0.90,
    to:    1.0,
    agents: {
      research: { status: 'completed', depthState: 'normal' },
      market:   { status: 'completed', depthState: 'normal' },
      product:  { status: 'completed', depthState: 'normal' },
      creative: { status: 'completed', depthState: 'normal' },
      finance:  { status: 'completed', depthState: 'normal' },
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL SINGLETON STATE
//
// Defined outside the composable function so every caller of useDemoEngine()
// shares one instance. The timeline runs once for the whole app — there is no
// benefit to multiple independent clocks.
// ─────────────────────────────────────────────────────────────────────────────

// Reactive playback state
const globalProgress = ref(0)   // 0.0 → 1.0
const isPlaying      = ref(false)

// RAF bookkeeping — plain variables, not reactive (no rendering needed)
let rafId              = null
let startTimestamp     = null  // performance.now() value captured on first tick
let progressAtPlayStart = 0    // progress snapshot taken when play was pressed

// ─── Tick ─────────────────────────────────────────────────────────────────────
// Called on every animation frame while playing.
// Computes a new globalProgress from wall-clock elapsed time so that the
// animation is framerate-independent and never drifts.
function tick(timestamp) {
  // Capture the start timestamp on the very first frame of this play segment.
  if (startTimestamp === null) startTimestamp = timestamp

  const elapsed    = timestamp - startTimestamp                          // ms since last play()
  const newProgress = Math.min(progressAtPlayStart + elapsed / TOTAL_DURATION, 1.0)

  globalProgress.value = newProgress

  if (newProgress < 1.0) {
    rafId = requestAnimationFrame(tick)
  } else {
    // Timeline finished naturally — stop the loop.
    isPlaying.value = false
    rafId           = null
  }
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/**
 * Begin or resume playback from the current globalProgress position.
 * No-ops if already playing or if the timeline has already reached 1.0.
 */
function startDemo() {
  if (isPlaying.value)           return  // already running
  if (globalProgress.value >= 1) return  // nothing left to play

  progressAtPlayStart = globalProgress.value
  startTimestamp      = null               // reset so tick() captures a fresh origin
  isPlaying.value     = true
  rafId               = requestAnimationFrame(tick)
}

/**
 * Freeze playback at the current progress position.
 * A subsequent startDemo() will resume from exactly this point.
 */
function pauseDemo() {
  if (!isPlaying.value) return

  isPlaying.value = false
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  startTimestamp = null  // discard the origin; next play segment starts fresh
}

/**
 * Stop playback and rewind to 0.0.
 */
function resetDemo() {
  pauseDemo()
  globalProgress.value = 0
  progressAtPlayStart   = 0
}

// ─── Derived Phase State ───────────────────────────────────────────────────────

/**
 * The active SEQUENCE entry for the current globalProgress value.
 * The final entry is open-ended (handles exactly 1.0).
 */
const currentPhase = computed(() => {
  const p = globalProgress.value
  for (let i = 0; i < SEQUENCE.length; i++) {
    const s      = SEQUENCE[i]
    const isLast = i === SEQUENCE.length - 1
    // Open upper bound for intermediate phases; closed for the last phase.
    if (p >= s.from && (isLast ? p <= s.to : p < s.to)) return s
  }
  return SEQUENCE[SEQUENCE.length - 1]
})

/** 0-based index of the currently active phase (0–3). */
const currentPhaseIndex = computed(() => currentPhase.value.index)

/**
 * Normalised 0.0–1.0 progress within the current phase window.
 * Use this for per-phase micro-animations (staggered reveals, counters, etc.)
 * without coupling to absolute globalProgress values.
 */
const phaseProgress = computed(() => {
  const { from, to } = currentPhase.value
  const span          = to - from
  if (span <= 0) return 1
  return Math.min((globalProgress.value - from) / span, 1)
})

/**
 * A map of agentId → { status, depthState } derived from the current phase.
 * Consumers (panels) should read their state as: agentStates.value['research']
 */
const agentStates = computed(() => currentPhase.value.agents)

/**
 * True once globalProgress passes the Phase 3 boundary (0.7).
 * The command layer uses this to bring the closure deck to the front.
 */
const closureActive = computed(() => globalProgress.value >= SEQUENCE[SEQUENCE.length - 1].from)

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSABLE EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function useDemoEngine() {
  return {
    // ── Config (static, for reference in consumers) ──────────────────────────
    TOTAL_DURATION,     // number   — full timeline length in ms
    SEQUENCE,           // array    — full phase definitions
    AGENT_IDS,          // string[] — canonical agent id list
    AGENT_CONTENT,      // object   — terminalLogs + summaryData keyed by agent id

    // ── Playback state ───────────────────────────────────────────────────────
    globalProgress,     // Ref<number>   0.0 → 1.0
    isPlaying,          // Ref<boolean>

    // ── Controls ─────────────────────────────────────────────────────────────
    startDemo,          // () => void   begin / resume
    pauseDemo,          // () => void   freeze at current position
    resetDemo,          // () => void   rewind to 0.0

    // ── Phase ─────────────────────────────────────────────────────────────────
    currentPhase,       // ComputedRef<SEQUENCE[n]>
    currentPhaseIndex,  // ComputedRef<number>  0–3
    phaseProgress,      // ComputedRef<number>  0.0 → 1.0 within phase

    // ── Agent ─────────────────────────────────────────────────────────────────
    agentStates,        // ComputedRef<Record<id, {status, depthState}>>

    // ── Flags ─────────────────────────────────────────────────────────────────
    closureActive,      // ComputedRef<boolean>  true when progress >= 0.7
  }
}
