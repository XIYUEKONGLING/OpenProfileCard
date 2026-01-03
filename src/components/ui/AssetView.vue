<script setup lang="ts">
import type { AssetDto } from '../../api/types';

const props = defineProps<{
  asset?: AssetDto | null;
  fallbackName?: string;
  alt?: string;
  className?: string;
}>();

/**
 * Handle AssetType.Identifier restriction and logic
 */
if (props.asset?.Type === 'Identifier') {
  console.error('CRITICAL_SECURITY_ACCESS: AssetType.Identifier is restricted.');
}
</script>

<template>
  <div :class="className" class="flex items-center justify-center overflow-hidden">
    <template v-if="!asset?.Value">
      <!-- Professional Letter-based Fallback with Gradient -->
      <div class="w-full h-full bg-linear-to-br from-white/5 to-white/10 flex items-center justify-center">
                <span class="text-white/20 font-black uppercase italic tracking-tighter">
                    {{ fallbackName?.charAt(0) ?? '?' }}
                </span>
      </div>
    </template>

    <template v-else-if="asset.Type === 'Text'">
      <span class="text-inherit">{{ asset.Value }}</span>
    </template>

    <template v-else-if="asset.Type === 'Image' || asset.Type === 'Remote'">
      <img :src="asset.Value" :alt="alt ?? 'Identity Asset'" class="w-full h-full object-cover" />
    </template>

    <template v-else-if="asset.Type === 'Style'">
      <i :class="asset.Value"></i>
    </template>

    <template v-else-if="asset.Type === 'Identifier'">
      <div class="bg-red-500/20 text-red-500 p-2 text-[10px] font-black uppercase">Blocked</div>
    </template>
  </div>
</template>
