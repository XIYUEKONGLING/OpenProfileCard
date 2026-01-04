<script setup lang="ts">
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AssetView from '@/components/ui/AssetView.vue';
import type { AssetDto } from '@/api/types';

defineProps<{
  open: boolean;
  asset: AssetDto | null;
  alt?: string;
}>();

const emit = defineEmits(['update:open']);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-screen-lg w-fit p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
      <div class="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg">
        <AssetView
            :asset="asset"
            :alt="alt"
            class-name="w-full h-full object-contain max-h-[85vh]"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
