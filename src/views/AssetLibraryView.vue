<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import type { AccountAssetDto, Visibility } from '@/api/types';
import { assetsApi } from '@/api/services';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft, ChevronRight, ChevronsLeft,
  Search, Eye, EyeOff, Filter, Copy, Trash2, Edit2
} from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const assets = ref<AccountAssetDto[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = 12;
const totalPages = ref(1);
const searchQuery = ref('');
const selectedCategory = ref<string>('All');
const selectedVisibility = ref<string>('All');
const categories = ref<string[]>([]);

const visibilityOptions = [
  { value: 'All', label: t('common.all') },
  { value: 'Public', label: t('common.visibilityPublic') },
  { value: 'Authenticated', label: t('common.visibilityAuthenticated') },
  { value: 'Protected', label: t('common.visibilityProtected') },
  { value: 'Private', label: t('common.visibilityPrivate') },
  { value: 'FriendsOnly', label: t('common.visibilityFriendsOnly') },
];

// --- Computed ---
const visibleCategories = computed(() => ['All', ...categories.value]);

const filteredAssets = computed(() => {
  let filtered = assets.value;

  if (selectedCategory.value !== 'All') {
    filtered = filtered.filter(a => a.Category === selectedCategory.value);
  }
  if (selectedVisibility.value !== 'All') {
    filtered = filtered.filter(a => a.Visibility === selectedVisibility.value);
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(a =>
      a.Category?.toLowerCase().includes(query) ||
      a.Notes?.toLowerCase().includes(query) ||
      a.Asset.TypeName?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// --- Helpers ---
const fetchAssets = async () => {
  isLoading.value = true;
  try {
    const response = await assetsApi.personal.listAssets({
      page: currentPage.value,
      pageSize: pageSize,
    });

    assets.value = response.Data || [];
    totalPages.value = response.TotalPages;

    // Extract unique categories
    const allCategories = new Set<string>();
    assets.value.forEach(a => {
      if (a.Category) allCategories.add(a.Category);
    });
    categories.value = Array.from(allCategories).sort();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const copyUuid = (uuid: string) => {
  navigator.clipboard.writeText(uuid);
  ui.notify(t('common.copied'), 'success');
};

const deleteAsset = async (uuid: string) => {
  if (!confirm(t('common.deleteConfirm'))) return;

  try {
    await assetsApi.personal.deleteAsset(uuid);
    assets.value = assets.value.filter(a => a.Asset.Id !== uuid);
    ui.notify(t('common.deleteSuccess'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'All';
  selectedVisibility.value = 'All';
};

watch(currentPage, fetchAssets);
onMounted(fetchAssets);
</script>


<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight">{{ t('common.assetLibrary') }}</h1>
        <p class="text-muted-foreground text-sm">{{ t('assetLibrary.subtitle') }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-50">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
              v-model="searchQuery"
              :placeholder="t('common.search')"
              class="pl-9"
          />
        </div>

        <!-- Category Filter -->
        <select
            v-model="selectedCategory"
            class="h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option v-for="cat in visibleCategories" :key="cat" :value="cat">
            {{ cat === 'All' ? t('assetLibrary.allCategories') : cat }}
          </option>
        </select>

        <!-- Visibility Filter -->
        <select
            v-model="selectedVisibility"
            class="h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option v-for="opt in visibilityOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <!-- Reset -->
        <Button v-if="searchQuery || selectedCategory !== 'All' || selectedVisibility !== 'All'"
                variant="ghost" size="sm" @click="resetFilters">
          <Filter class="mr-2 size-4" />
          {{ t('admin.resetFilters') }}
        </Button>
      </div>
    </div>

    <!-- Asset Grid -->
    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <!-- Loading -->
      <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="i in 12" :key="i" class="aspect-square bg-muted rounded-xl animate-pulse"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredAssets.length === 0" class="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/10 animate-in fade-in zoom-in-95 duration-300">
        <Search class="size-12 mx-auto text-muted-foreground/20 mb-4" />
        <p class="font-bold">{{ t('assetLibrary.noAssets') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('assetLibrary.noAssetsDesc') }}</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card v-for="item in filteredAssets" :key="item.Asset.Id"
              class="group overflow-hidden hover:shadow-lg transition-all animate-in fade-in">
          <div class="relative aspect-square bg-muted">
            <AssetView :asset="item.Asset" class-name="w-full h-full object-cover" />

            <!-- Overlay on hover -->
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" class="size-8 rounded-full" @click="copyUuid(item.Asset.Id)" :title="t('common.copy')">
                <Copy class="size-4" />
              </Button>
              <Button size="icon" variant="destructive" class="size-8 rounded-full" @click="deleteAsset(item.Asset.Id)" :title="t('common.delete')">
                <Trash2 class="size-4" />
              </Button>
            </div>

            <!-- Visibility Badge -->
            <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
              <Eye v-if="item.Visibility === Visibility.Public" class="size-3 text-green-400" />
              <EyeOff v-else class="size-3 text-orange-400" />
              <span class="text-[10px] font-bold text-white">{{ item.Visibility }}</span>
            </div>

            <!-- Asset Type Badge -->
            <div class="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-0.5">
              <span class="text-[10px] font-bold text-white">{{ item.Asset.TypeName }}</span>
            </div>
          </div>

          <CardContent class="p-3 space-y-2">
            <div v-if="item.Category" class="truncate font-bold text-sm">
              {{ item.Category }}
            </div>
            <div v-if="item.Notes" class="text-xs text-muted-foreground truncate">
              {{ item.Notes }}
            </div>
            <div class="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <span class="opacity-50">#</span>
              <span class="truncate">{{ item.Asset.Id.slice(0, 8) }}...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between gap-4 px-2 pt-4 border-t animate-in fade-in duration-300">
      <div class="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {{ t('admin.currentPage') }}: <span class="text-foreground">{{ currentPage }}</span> / {{ totalPages }}
      </div>

      <div class="flex items-center gap-2">
        <Button
            variant="outline"
            size="icon"
            class="size-9 rounded-lg"
            :disabled="currentPage === 1"
            @click="currentPage = 1"
        >
          <ChevronsLeft class="size-4" />
        </Button>
        <Button variant="outline" size="icon" class="size-9 rounded-lg" :disabled="currentPage === 1" @click="currentPage--">
          <ChevronLeft class="size-4" />
        </Button>
        <Button variant="outline" size="icon" class="size-9 rounded-lg" :disabled="currentPage >= totalPages" @click="currentPage++">
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
