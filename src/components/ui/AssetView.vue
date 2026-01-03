<script setup lang="ts">
import { computed } from 'vue';
import type { AssetDto } from '@/api/types';

const props = defineProps<{
  asset?: AssetDto | null;
  fallbackName?: string;
  alt?: string;
  className?: string;
}>();

const isType = (type: string) => {
  const val = props.asset?.Type;
  if (val === undefined || val === null) return false;
  const map: Record<string, (string | number)[]> = {
    Text: ['Text', 0],
    Image: ['Image', 1],
    Remote: ['Remote', 2],
    Style: ['Style', 3],
    Identifier: ['Identifier', 4]
  };
  return map[type]?.includes(val);
};

const textMetrics = computed(() => {
  const text = props.asset?.Value || '';
  const len = text.length;

  if (len === 0) return { fontSize: 0, y: 50 };

  let size = 0;
  if (len === 1) size = 70;
  else if (len === 2) size = 45;
  else if (len === 3) size = 35;
  else size = Math.max(14, 110 / len); 

  return {
    fontSize: size,
    y: len === 1 ? 72 : 68
  };
});

const fallbackChar = computed(() => {
  if (!props.fallbackName) return '?';
  return props.fallbackName.trim().charAt(0).toUpperCase();
});
</script>

<template>
  <div :class="['relative flex items-center justify-center overflow-hidden shrink-0 select-none', className]">

    <!-- Fallback & Text Background -->
    <div v-if="!asset?.Value || isType('Text')"
         class="absolute inset-0 bg-linear-to-br from-foreground/5 to-foreground/10 -z-10">
    </div>

    <!-- Fallback (No data) -->
    <template v-if="!asset || !asset.Value">
      <svg viewBox="0 0 100 100" class="w-[70%] h-[70%]">
        <text
            x="50%" y="72"
            text-anchor="middle"
            fill="currentColor"
            class="font-black italic opacity-20"
            style="font-size: 70px"
        >
          {{ fallbackChar }}
        </text>
      </svg>
    </template>

    <!-- Text -->
    <template v-else-if="isType('Text')">
      <svg viewBox="0 0 100 100" class="w-[85%] h-[85%]">
        <text
            x="50%"
            :y="textMetrics.y"
            text-anchor="middle"
            fill="currentColor"
            class="font-black tracking-tighter"
            :style="{ fontSize: `${textMetrics.fontSize}px` }"
        >
          {{ asset.Value }}
        </text>
      </svg>
    </template>

    <!-- Image -->
    <template v-else-if="isType('Image') || isType('Remote')">
      <img
          :src="asset.Value"
          :alt="alt ?? 'Identity Asset'"
          class="w-full h-full object-cover"
          loading="lazy"
      />
    </template>

    <!-- Style -->
    <template v-else-if="isType('Style')">
      <i :class="[asset.Value, 'not-italic flex items-center justify-center text-[2em]']" aria-hidden="true"></i>
    </template>

    <!-- Identifier -->
    <template v-else-if="isType('Identifier')">
      <div class="bg-destructive/20 text-destructive text-[8px] font-black p-1 uppercase">Restricted</div>
    </template>

  </div>
</template>

<style scoped>
text {
  transition: all 0.3s ease;
  dominant-baseline: alphabetic;
}
</style>
