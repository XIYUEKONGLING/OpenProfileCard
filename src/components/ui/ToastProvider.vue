<script setup lang="ts">
import { useUIStore } from '../../stores/ui';
const ui = useUIStore();
</script>

<template>
  <div class="fixed bottom-8 right-8 z-9999 flex flex-col gap-4 w-80 pointer-events-none">
    <TransitionGroup name="toast">
      <div
          v-for="t in ui.toasts"
          :key="t.id"
          class="toast-card pointer-events-auto"
          :class="t.type"
      >
        <div class="flex items-center gap-4">
          <div class="status-dot"></div>
          <p class="text-[11px] font-black tracking-widest uppercase italic">{{ t.message }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
@reference "../../style.css";

.toast-card {
  @apply p-5 rounded-3xl backdrop-blur-3xl border shadow-2xl transition-all duration-500;
}

.toast-card.info { @apply bg-white/5 border-white/10 text-white; }
.toast-card.success { @apply bg-green-500/10 border-green-500/20 text-green-400; }
.toast-card.error { @apply bg-red-500/10 border-red-500/20 text-red-400; }
.toast-card.warning { @apply bg-orange-500/10 border-orange-500/20 text-orange-400; }

.status-dot {
  @apply w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor];
}

.toast-enter-from { opacity: 0; transform: translateY(20px) scale(0.9); }
.toast-leave-to { opacity: 0; transform: scale(0.8); }
</style>
