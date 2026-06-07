<script setup>
import { computed } from 'vue'

const props = defineProps({
  logs:          { type: Array,  required: true },
  phaseProgress: { type: Number, default: 0     },
})

// ─── Visible line count ────────────────────────────────────────────────────────
const visibleCount = computed(() =>
  Math.min(
    Math.floor(props.phaseProgress * (props.logs.length + 1)),
    props.logs.length,
  )
)

// ─── Stack lines ──────────────────────────────────────────────────────────────
// Up to 4 most-recent visible logs, newest first.
// stackIndex 0 = newest (bottom/foreground).  stackIndex 3 = oldest (top/back).
//
// The stable originalIndex is the Vue :key so Vue reuses DOM nodes when
// stackIndex increments, letting the CSS transition animate the glide.
const stackLines = computed(() => {
  const count = visibleCount.value
  const start = Math.max(0, count - 4)
  const items = []
  for (let i = count - 1; i >= start; i--) {
    items.push({
      text:          props.logs[i],
      originalIndex: i,
      stackIndex:    count - 1 - i, // 0 = newest
    })
  }
  return items
})

const isStreaming = computed(() => visibleCount.value < props.logs.length)

// ─── Stack config ──────────────────────────────────────────────────────────────
// Complete literal strings — Tailwind v4 content scanner must see every class.
//
// pos   : absolute vertical slot + depth modifiers.
//         bottom-12 →  48 px  newest / foreground
//         bottom-28 → 112 px  (64 px gap)
//         bottom-44 → 176 px  (64 px gap)
//         bottom-60 → 240 px  oldest / background
//         The 64 px gap between slots eliminates overlap at every scale factor.
//
//         Index 0 additionally carries the solid card surface
//         (bg-white/95 … shadow-sm) that masks older lines sliding behind it.
//
// text  : color, weight, size for the log-text <span>.
// glyph : font-size for the › prompt character.
const STACK_CFG = [
  {
    pos:   'bottom-12 scale-100    opacity-100 z-30 bg-white/95 rounded-lg border border-slate-200/60 shadow-sm px-3 py-1.5',
    text:  'text-slate-800 font-semibold text-base',
    glyph: 'text-base',
  },
  {
    pos:   'bottom-28 scale-95     opacity-60  z-20',
    text:  'text-slate-500 text-sm',
    glyph: 'text-sm',
  },
  {
    pos:   'bottom-44 scale-90     opacity-30  z-10',
    text:  'text-slate-400 text-xs',
    glyph: 'text-xs',
  },
  {
    pos:   'bottom-60 scale-[0.85] opacity-10  z-0',
    text:  'text-slate-300 text-xs',
    glyph: 'text-xs',
  },
]
</script>

<template>
  <!-- ══════════════════════════════════════════════════════════════════════════
       Root has NO `relative` or `position` class — the parent in CommandCenter
       injects `absolute inset-0`, making this element `position: absolute`.
       An absolutely-positioned element already establishes a containing block
       for its absolutely-positioned children, so `relative` is not needed and
       would actually fight the parent's `absolute` in Tailwind's cascade order.
  ══════════════════════════════════════════════════════════════════════════ -->
  <div class="overflow-hidden">

    <!-- ── Background radar wireframe ──────────────────────────────────────────
         SVG is sized to 80% of the container so all rings stay inside the
         overflow-hidden boundary and are never clipped.
         Fades to opacity-0 once streaming completes.
    ─────────────────────────────────────────────────────────────────────────── -->
    <div
      class="absolute inset-0 flex items-center justify-center
             pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg
        class="w-4/5 h-4/5 text-slate-400 transition-opacity duration-700"
        :class="isStreaming ? 'opacity-100' : 'opacity-0'"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        stroke-width="0.6"
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

    <!-- ── Badge ──────────────────────────────────────────────────────────────── -->
    <div class="absolute top-3 left-4 right-4 z-40 flex items-center gap-2">
      <span class="relative flex w-2.5 h-2.5 shrink-0">
        <span
          class="absolute inset-0 rounded-full bg-emerald-400"
          :class="isStreaming ? 'animate-ping opacity-70' : 'opacity-20'"
        />
        <span
          class="relative rounded-full w-2.5 h-2.5 transition-colors duration-500"
          :class="isStreaming ? 'bg-emerald-500' : 'bg-slate-300'"
        />
      </span>
      <span
        class="text-[9px] font-bold uppercase tracking-[0.12em] transition-colors duration-500"
        :class="isStreaming ? 'text-emerald-600' : 'text-slate-400'"
      >
        Active Agent Execution
      </span>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════
         3D DEPTH LOG STACK

         Lines are anchored from the container bottom with explicit bottom-* slots
         (64 px apart) so overlap is impossible at any scale.

         Index 0 (newest) carries a solid white card surface — this masks older
         lines that animate upward through the same screen area, creating a clean
         "foreground pushes background back" depth illusion.

         Vue :key = originalIndex  →  same DOM node across stackIndex changes
         transition-all duration-700  →  bottom + scale + opacity all animate together
    ══════════════════════════════════════════════════════════════════════════ -->
    <div
      v-for="item in stackLines"
      :key="item.originalIndex"
      class="absolute left-2 right-2
             flex items-start gap-2
             transition-all duration-700 ease-in-out"
      :class="STACK_CFG[item.stackIndex]?.pos"
    >
      <span
        class="text-emerald-500 font-mono leading-snug shrink-0 transition-all duration-700"
        :class="STACK_CFG[item.stackIndex]?.glyph"
      >›</span>
      <span
        class="break-words min-w-0 leading-snug transition-all duration-700"
        :class="STACK_CFG[item.stackIndex]?.text"
      >{{ item.text }}</span>
    </div>

    <!-- ── Streaming cursor — below the newest log slot ──────────────────────── -->
    <div
      v-if="isStreaming"
      class="absolute bottom-3 left-4 z-40 flex items-center gap-1.5"
    >
      <span class="font-mono text-xs text-emerald-500 select-none">›</span>
      <span class="inline-block w-[7px] h-[11px] bg-emerald-400 animate-pulse rounded-[1px]" />
    </div>

  </div>
</template>
