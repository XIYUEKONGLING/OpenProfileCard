<script setup lang="ts">
import { computed } from 'vue';
import { type AssetDto, AssetType } from '@/api/types';

const props = defineProps<{
  asset?: AssetDto | null;
  fallbackName?: string;
  alt?: string;
  className?: string;
}>();

// Helper: Check type safely
const isType = (type: AssetType) => {
  if (type === AssetType.Empty) {
    // It's empty if asset is null, or Type is explicitly 0 (Empty)
    return !props.asset || props.asset.Type === AssetType.Empty;
  }
  return props.asset?.Type === type;
};

const textMetrics = computed(() => {
  const text = props.asset?.Value || '';
  const len = text.length;
  
  if (len === 0) return { fontSize: 0 };

  let size = 0;
  if (len === 1) size = 65;
  else if (len === 2) size = 45;
  else if (len === 3) size = 30;
  else size = Math.max(12, 100 / len);

  return { fontSize: size };
});

const fallbackChar = computed(() => {
  if (!props.fallbackName) return '?';
  return props.fallbackName.trim().charAt(0).toUpperCase();
});
</script>

<template>
  <div :class="['relative flex items-center justify-center overflow-hidden shrink-0 select-none box-border', className]">

    <!-- Background Pattern -->
    <div v-if="!isType(AssetType.Empty) && asset?.Value"
         class="absolute inset-0 bg-linear-to-br from-foreground/5 to-foreground/10 -z-10">
    </div>

    <!-- Case 1: Empty / Fallback -->
    <template v-if="isType(AssetType.Empty)">
      <template v-if="fallbackName">
        <div class="absolute inset-0 bg-muted/30 -z-10"></div>
        <svg viewBox="0 0 100 100" class="w-[60%] h-[60%]">
          <text
              x="50%" y="50%"
              text-anchor="middle"
              dominant-baseline="central"
              fill="currentColor"
              class="font-black italic opacity-20"
              style="font-size: 70px"
          >
            {{ fallbackChar }}
          </text>
        </svg>
      </template>
      <!-- Else (e.g. Background), render nothing -->
    </template>

    <!-- Case 2: Text / Emoji -->
    <template v-else-if="isType(AssetType.Text)">
      <svg viewBox="0 0 100 100" class="w-[80%] h-[80%]">
        <text
            x="50%" y="50%"
            text-anchor="middle"
            dominant-baseline="central"
            fill="currentColor"
            class="font-black tracking-tighter"
            :style="{ fontSize: `${textMetrics.fontSize}px` }"
        >
          {{ asset?.Value }}
        </text>
      </svg>
    </template>

    <!-- Case 3: Image / Remote URL -->
    <template v-else-if="isType(AssetType.Image) || isType(AssetType.Remote)">
      <img
          v-if="asset?.Value"
          :src="asset.Value"
          :alt="alt ?? 'Asset'"
          class="w-full h-full object-cover"
          loading="lazy"
      />
    </template>

    <!-- Case 4: Icon Style (FontAwesome / Devicon) -->
    <template v-else-if="isType(AssetType.Style)">
      <i
          :class="[asset?.Value, 'not-italic flex items-center justify-center leading-none']"
          style="font-size: 1.5rem; width: 100%; height: 100%;"
          aria-hidden="true"
      ></i>
    </template>

    <!-- Case 5: Identifier (Restricted) -->
    <template v-else-if="isType(AssetType.Identifier)">
      <div class="bg-destructive/10 text-destructive text-[10px] font-bold px-1 py-0.5 uppercase rounded-sm">
        ID
      </div>
    </template>

  </div>
</template>

<style scoped>
:deep(i) {
  display: flex !important;
  align-items: center;
  justify-content: center;
}
</style>
