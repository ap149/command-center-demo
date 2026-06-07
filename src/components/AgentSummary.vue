<script setup>
/**
 * AgentSummary.vue
 * ────────────────
 * Completed-state artefact panel. Renders a unique, high-density layout for
 * each of the 5 agents based on their summaryData from AGENT_CONTENT.
 *
 * Props
 *   agentId     — string  One of: research | market | product | creative | finance
 *   summaryData — object  The summaryData block from AGENT_CONTENT[agentId]
 *
 * Layout per agent
 *   research  → Competitors list · Key Insights bullets · Opportunity highlight
 *   market    → Trend bullets · Target Audience CSS bar chart
 *   product   → Product render placeholder · Numbered 8-step GTM list
 *   creative  → Stacked Ad Concept cards with campaign visual placeholders
 *   finance   → Pricing target · Cost breakdown table · Y1 Outlook stat strip
 */

import { computed } from 'vue'

const props = defineProps({
  agentId: {
    type: String,
    required: true,
  },
  summaryData: {
    type: Object,
    required: true,
  },
})

// ── Market: maps chartData indices to display labels and bar colours ──────────
const MARKET_SEGMENTS = [
  { label: 'Core Gamers',    color: 'bg-violet-400' },
  { label: 'Streamers',      color: 'bg-purple-400' },
  { label: 'Remote Workers', color: 'bg-slate-400'  },
  { label: 'Enthusiasts',    color: 'bg-slate-300'  },
]

// ── Finance: sum of all per-unit cost line items ──────────────────────────────
const totalCOGS = computed(() =>
  Object.values(props.summaryData.costs ?? {}).reduce((sum, v) => sum + v, 0)
)
</script>

<template>
  <!--
    Single root wrapper — required so that class bindings passed by the parent
    (e.g. the absolute inset-0 container in CommandCenter) fall through correctly.
    Without this, Vue treats the template as a fragment (multiple root elements)
    and silently drops any inherited class, causing blank panels.

    overflow-y-auto here handles scrolling so inner divs don't need it.
  -->
  <div class="min-h-full">

  <!-- =========================================================================
       RESEARCH ANALYST
       Competitors list → Key Insights bullets → Opportunity highlight block
  ========================================================================== -->
  <div
    v-if="agentId === 'research'"
    class="flex flex-col gap-3 p-4"
  >

    <!-- Top Competitors ranked list -->
    <div class="rounded-lg border border-slate-200/80 overflow-hidden shrink-0">
      <div class="px-3 py-2 bg-slate-50/70 border-b border-slate-200/60">
        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Top Competitors
        </p>
      </div>
      <div
        v-for="(name, i) in summaryData.competitors"
        :key="name"
        class="flex items-center gap-3 px-3 py-2
               border-b border-slate-100/80 last:border-0"
      >
        <span
          class="w-[18px] h-[18px] rounded-md bg-slate-100 shrink-0
                 flex items-center justify-center
                 text-[9px] font-bold text-slate-400"
        >
          {{ i + 1 }}
        </span>
        <span class="text-[12px] font-semibold text-slate-700">{{ name }}</span>
      </div>
    </div>

    <!-- Key Insights bullet list -->
    <div class="flex flex-col gap-1.5 shrink-0">
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        Key Insights
      </p>
      <div
        v-for="insight in summaryData.insights"
        :key="insight"
        class="flex items-start gap-2"
      >
        <span class="w-1 h-1 rounded-full bg-blue-400 mt-[5px] shrink-0" />
        <p class="text-[11px] text-slate-600 leading-snug">{{ insight }}</p>
      </div>
    </div>

    <!-- Positioning Opportunity — highlighted block -->
    <div class="rounded-lg bg-blue-50/70 border border-blue-200/50 p-3 shrink-0">
      <p class="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">
        Positioning Opportunity
      </p>
      <p class="text-[11px] text-slate-700 leading-snug">
        {{ summaryData.opportunity }}
      </p>
    </div>

  </div>

  <!-- =========================================================================
       MARKET STRATEGIST
       Trend bullets → CSS bar chart for Target Audience breakdown
  ========================================================================== -->
  <div
    v-else-if="agentId === 'market'"
    class="flex flex-col gap-3 p-4"
  >

    <!-- Market Trends -->
    <div class="shrink-0">
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        {{ summaryData.trendTitle }}
      </p>
      <div
        v-for="trend in summaryData.trends"
        :key="trend"
        class="flex items-start gap-2 mb-1.5 last:mb-0"
      >
        <span class="w-1 h-1 rounded-full bg-violet-400 mt-[5px] shrink-0" />
        <p class="text-[11px] text-slate-600 leading-snug">{{ trend }}</p>
      </div>
    </div>

    <div class="border-t border-slate-200/60 shrink-0" />

    <!-- Target Audience — horizontal CSS progress bars -->
    <!--
      chartData: [45, 20, 20, 15] maps to MARKET_SEGMENTS by index.
      transition-all duration-1000 → bars animate in smoothly on mount.
    -->
    <div class="shrink-0">
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
        Target Audience
      </p>
      <div class="flex flex-col gap-2">
        <div
          v-for="(pct, i) in summaryData.chartData"
          :key="i"
          class="flex items-center gap-2.5"
        >
          <span class="text-[9px] text-slate-500 w-[90px] shrink-0 truncate">
            {{ MARKET_SEGMENTS[i]?.label }}
          </span>
          <div class="flex-1 h-1.5 bg-slate-100/80 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-1000 ease-out"
              :class="MARKET_SEGMENTS[i]?.color"
              :style="{ width: pct + '%' }"
            />
          </div>
          <span class="text-[9px] font-bold text-slate-500 w-7 text-right shrink-0">
            {{ pct }}%
          </span>
        </div>
      </div>
    </div>

  </div>

  <!-- =========================================================================
       PRODUCT STRATEGIST
       Centred product render placeholder → Numbered 8-step GTM list
  ========================================================================== -->
  <div
    v-else-if="agentId === 'product'"
    class="flex flex-col gap-3 p-4"
  >

    <!-- 3D product render placeholder card -->
    <!--
      Decorative circles suggest depth/roundness of a physical product.
      Swap the 🪑 emoji and placeholder text with an <img> when assets are ready.
    -->
    <div
      class="rounded-xl h-[68px] shrink-0 relative overflow-hidden
             bg-gradient-to-br from-emerald-50/60 to-teal-50/40
             border border-emerald-200/40
             flex flex-col items-center justify-center gap-1"
    >
      <div class="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-emerald-100/50" />
      <div class="absolute -left-2 -top-2 w-10 h-10 rounded-full bg-teal-100/40" />
      <span class="relative text-xl select-none">🪑</span>
      <span class="relative text-[9px] font-semibold text-emerald-700/60 tracking-wide">
        [ 3D Product Render ]
      </span>
    </div>

    <!-- 8-step GTM Blueprint numbered list -->
    <div class="shrink-0">
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        GTM Blueprint
      </p>
      <div class="flex flex-col">
        <div
          v-for="(step, i) in summaryData.steps"
          :key="step"
          class="flex items-center gap-2.5 py-1.5
                 border-b border-slate-100/80 last:border-0"
        >
          <span
            class="w-[18px] h-[18px] rounded-md shrink-0
                   bg-emerald-100 border border-emerald-200/60
                   flex items-center justify-center
                   text-[8px] font-bold text-emerald-600"
          >
            {{ i + 1 }}
          </span>
          <span class="text-[11px] font-medium text-slate-700 leading-snug">{{ step }}</span>
        </div>
      </div>
    </div>

  </div>

  <!-- =========================================================================
       CREATIVE DIRECTOR
       Stacked Ad Concept cards — each with a visual placeholder + bold copy
  ========================================================================== -->
  <div
    v-else-if="agentId === 'creative'"
    class="flex flex-col gap-2.5 p-4"
  >

    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
      Ad Concepts
    </p>

    <div
      v-for="concept in summaryData.concepts"
      :key="concept.title"
      class="rounded-xl border border-slate-200/80 overflow-hidden shrink-0"
    >
      <!-- Campaign visual placeholder strip -->
      <!--
        Replace bg-gradient + span with an <img> when campaign assets exist.
        Tweak gradient colours to match each concept's mood.
      -->
      <div
        class="h-9 flex items-center justify-center border-b border-slate-200/60
               bg-gradient-to-r from-orange-50/80 to-amber-50/60"
      >
        <span class="text-[9px] font-medium text-amber-500/70 tracking-wide select-none">
          [ Campaign Visual ]
        </span>
      </div>

      <!-- Concept copy -->
      <div class="px-3 py-2.5">
        <!-- Bold typographic headline — intentionally all-caps, tight tracking -->
        <p class="text-[13px] font-black text-slate-800 tracking-tighter leading-none mb-1.5">
          {{ concept.title }}
        </p>
        <p class="text-[10px] text-slate-500 leading-snug">{{ concept.desc }}</p>
      </div>
    </div>

  </div>

  <!-- =========================================================================
       FINANCIAL ANALYST
       Pricing target pill → Cost breakdown table → Y1 Outlook stat strip
  ========================================================================== -->
  <div
    v-else-if="agentId === 'finance'"
    class="flex flex-col gap-3 p-4"
  >

    <!-- Pricing target pill -->
    <div
      class="rounded-lg bg-rose-50/60 border border-rose-200/50
             px-4 py-2.5 text-center shrink-0"
    >
      <p class="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">
        Pricing Strategy
      </p>
      <p class="text-[17px] font-black text-slate-800 leading-none">
        {{ summaryData.pricing }}
      </p>
    </div>

    <!-- Cost Structure per-unit table -->
    <!--
      A mini bar inside each row shows each line item's proportion of totalCOGS.
      The bar width is computed as (val / totalCOGS * 100)%.
    -->
    <div class="rounded-lg border border-slate-200/80 overflow-hidden shrink-0">
      <div class="px-3 py-2 bg-slate-50/70 border-b border-slate-200/60">
        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Cost Structure / Unit
        </p>
      </div>

      <div
        v-for="[key, val] in Object.entries(summaryData.costs ?? {})"
        :key="key"
        class="flex items-center gap-3 px-3 py-1.5
               border-b border-slate-100/80 last:border-0"
      >
        <span class="text-[11px] text-slate-500 capitalize w-20 shrink-0">{{ key }}</span>
        <div class="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-rose-300 rounded-full transition-all duration-1000 ease-out"
            :style="{ width: totalCOGS > 0 ? (val / totalCOGS * 100) + '%' : '0%' }"
          />
        </div>
        <span class="text-[11px] font-semibold text-slate-700 w-8 text-right shrink-0">
          ${{ val }}
        </span>
      </div>

      <!-- Total row -->
      <div class="flex items-center justify-between px-3 py-2 bg-slate-50/50">
        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
          Total COGS
        </span>
        <span class="text-[11px] font-bold text-slate-700">${{ totalCOGS }}</span>
      </div>
    </div>

    <!-- Y1 Financial Outlook stat strip -->
    <div
      class="rounded-lg bg-gradient-to-br from-slate-50 to-white
             border border-slate-200/80 p-3 shrink-0"
    >
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        Y1 Financial Outlook
      </p>
      <div class="grid grid-cols-3 gap-2 text-center">

        <div class="flex flex-col gap-0.5">
          <p class="text-[9px] text-slate-400 leading-none">Units Sold</p>
          <p class="text-[12px] font-black text-slate-700 leading-tight">
            {{ summaryData.outlook?.sold }}
          </p>
        </div>

        <!-- Centre column has side borders to visually separate the three stats -->
        <div class="flex flex-col gap-0.5 border-x border-slate-200/60">
          <p class="text-[9px] text-slate-400 leading-none">Revenue</p>
          <p class="text-[12px] font-black text-emerald-600 leading-tight">
            {{ summaryData.outlook?.revenue }}
          </p>
        </div>

        <div class="flex flex-col gap-0.5">
          <p class="text-[9px] text-slate-400 leading-none">Gross Profit</p>
          <p class="text-[12px] font-black text-emerald-600 leading-tight">
            {{ summaryData.outlook?.profit }}
          </p>
        </div>

      </div>
    </div>

  </div>

  <!-- =========================================================================
       FALLBACK — unknown agentId
  ========================================================================== -->
  <div
    v-else
    class="flex items-center justify-center p-4"
  >
    <p class="text-xs text-slate-300">No summary available.</p>
  </div>

  </div><!-- /single root wrapper -->
</template>
