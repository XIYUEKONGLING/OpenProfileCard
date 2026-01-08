<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import { type AssetDto, AssetType } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { lookupApi, publicAssetsApi } from '@/api/services';

const props = defineProps<{
  asset?: AssetDto | null;
  fallbackName?: string;
  alt?: string;
  className?: string;
}>();

const auth = useAuthStore();

// Loading state for library/resource loading
const isLoading = ref(false);
const assetError = ref(false);
// Store resolved asset after library/resource loading
const resolvedAsset = ref<AssetDto | null>(null);

// Helper: Check type safely
const isType = (type: AssetType) => {
  if (type === AssetType.Empty) {
    // It's empty if asset is null, or Type is explicitly 0 (Empty)
    return !props.asset || props.asset.Type === AssetType.Empty;
  }
  return props.asset?.Type === type;
};

// Check if asset is effectively empty (no value to display)
const isEffectivelyEmpty = computed(() => {
  const currentAsset = resolvedAsset.value ?? props.asset;

  if (!currentAsset) return true;
  if (currentAsset.Type === AssetType.Empty) return true;
  // Check if Value is empty for types that require a value
  if (!currentAsset.Value || currentAsset.Value.trim() === '') {
    return currentAsset.Type === AssetType.Text ||
           currentAsset.Type === AssetType.Image ||
           currentAsset.Type === AssetType.Remote ||
           currentAsset.Type === AssetType.Style ||
           currentAsset.Type === AssetType.Library ||
           currentAsset.Type === AssetType.Resource;
  }
  return false;
});

// The asset to display (resolved or original)
const displayAsset = computed(() => resolvedAsset.value ?? props.asset);

const textMetrics = computed(() => {
  const text = displayAsset.value?.Value || '';
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

// Load library/resource asset with fallback chain
async function loadAsset(uuid: string, _isResource: boolean): Promise<AssetDto | null> {
  const MAX_REDIRECTS = 3;
  const visitedUuids = new Set<string>();

  async function tryFetchAsset(currentUuid: string, redirectCount: number): Promise<AssetDto | null> {
    if (redirectCount > MAX_REDIRECTS) {
      console.warn(`Asset loading: exceeded max redirects (${MAX_REDIRECTS}) for ${uuid}`);
      return null;
    }
    if (visitedUuids.has(currentUuid)) {
      console.warn(`Asset loading: circular reference detected for ${currentUuid}`);
      return null;
    }
    visitedUuids.add(currentUuid);

    try {
      // Priority 1: If authenticated, use lookup API
      let assetData: any;
      if (auth.isAuthenticated) {
        try {
          assetData = await lookupApi.lookupAsset(currentUuid);
        } catch (lookupError) {
          // If lookup fails, fall back to public API
          console.debug(`Lookup failed for ${currentUuid}, trying public API`, lookupError);
          assetData = await publicAssetsApi.getAsset(currentUuid);
        }
      } else {
        // Priority 2: Static deployment or not logged in, use public API
        assetData = await publicAssetsApi.getAsset(currentUuid);
      }

      if (!assetData?.Asset) return null;

      // If the resolved asset itself is a Library/Resource type, follow the redirect
      const resolvedType = assetData.Asset.Type;
      if (resolvedType === AssetType.Library || resolvedType === AssetType.Resource) {
        const nextUuid = assetData.Asset.Value;
        if (nextUuid) {
          return tryFetchAsset(nextUuid, redirectCount + 1);
        }
      }

      return assetData.Asset;
    } catch (error) {
      console.warn(`Asset loading failed for ${currentUuid}:`, error);
      return null;
    }
  }

  return tryFetchAsset(uuid, 0);
}

// Watch for library/resource assets and resolve them
watch(
  () => props.asset,
  async (newAsset) => {
    resolvedAsset.value = null;
    assetError.value = false;

    if (!newAsset) return;

    const type = newAsset.Type;
    // Only process Library and Resource types
    if (type !== AssetType.Library && type !== AssetType.Resource) return;

    const uuid = newAsset.Value;
    if (!uuid?.trim()) return;

    isLoading.value = true;
    try {
      const loaded = await loadAsset(uuid, type === AssetType.Resource);
      if (loaded) {
        resolvedAsset.value = loaded;
      } else {
        assetError.value = true;
      }
    } catch (error) {
      console.error('Failed to load asset:', error);
      assetError.value = true;
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

// Watch for auth state changes - reload library/resources when authentication status changes
watch(
  () => auth.isAuthenticated,
  () => {
    if (props.asset && (props.asset.Type === AssetType.Library || props.asset.Type === AssetType.Resource)) {
      // Reset and trigger reload
      resolvedAsset.value = null;
      assetError.value = false;
    }
  }
);
</script>

<template>
  <div :class="['relative flex items-center justify-center overflow-hidden shrink-0 select-none box-border', className]">

    <!-- Background Pattern -->
    <div v-if="!isEffectivelyEmpty && displayAsset?.Value"
         class="absolute inset-0 bg-linear-to-br from-foreground/5 to-foreground/10 -z-10">
    </div>

    <!-- Loading State (for Library/Resource) -->
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
      <Loader2 class="animate-spin text-muted-foreground size-1/2" />
    </div>

    <!-- Case 1: Empty / Fallback -->
    <template v-else-if="isEffectivelyEmpty || assetError">
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
          {{ displayAsset?.Value }}
        </text>
      </svg>
    </template>

    <!-- Case 3: Image / Remote URL -->
    <template v-else-if="isType(AssetType.Image) || isType(AssetType.Remote)">
      <img
          v-if="displayAsset?.Value"
          :src="displayAsset.Value"
          :alt="alt ?? 'Asset'"
          class="w-full h-full object-cover"
          loading="lazy"
      />
    </template>

    <!-- Case 4: Icon Style (FontAwesome / Devicon) -->
    <template v-else-if="isType(AssetType.Style)">
      <i
          v-if="displayAsset?.Value"
          :class="[displayAsset.Value, 'not-italic flex items-center justify-center leading-none']"
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
