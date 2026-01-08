<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import { type AccountAssetDto, type AssetDto, Visibility, AssetType } from '@/api/types';
import { assetsApi } from '@/api/services';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft, ChevronRight, ChevronsLeft,
  Search, Eye, EyeOff, Filter, Copy, Trash2,
  MoreHorizontal, Edit2, Plus, Layers
} from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const assets = ref<AccountAssetDto[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = 12;
const totalPages = ref(0);
const totalItems = ref(0);
const searchQuery = ref('');
const selectedCategory = ref<string | undefined>(undefined);
const categories = ref<string[]>([]);
const selectedVisibility = ref<Visibility | undefined>(undefined);
const selectedAssets = ref<Set<string>>(new Set());

// Dialog states
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const editingAsset = ref<AccountAssetDto | null>(null);
const assetToDelete = ref<AccountAssetDto | null>(null);

// Form state
const formData = ref<{
  Asset: AssetDto | null;
  Visibility: Visibility;
  Category: string | undefined;
  Notes: string | undefined;
}>({
  Asset: null,
  Visibility: Visibility.Private,
  Category: undefined,
  Notes: undefined,
});

const visibilityOptions = [
  { value: undefined as Visibility | undefined, label: t('common.all') },
  { value: Visibility.Public, label: t('common.visibilityPublic') },
  { value: Visibility.Authenticated, label: t('common.visibilityAuthenticated') },
  { value: Visibility.Protected, label: t('common.visibilityProtected') },
  { value: Visibility.Private, label: t('common.visibilityPrivate') },
  { value: Visibility.FriendsOnly, label: t('common.visibilityFriendsOnly') },
];

// --- Computed ---
const allSelected = computed(() => {
  return assets.value.length > 0 && selectedAssets.value.size === assets.value.length;
});

const hasSelected = computed(() => selectedAssets.value.size > 0);

const selectedCount = computed(() => selectedAssets.value.size);

// --- Actions ---
const fetchAssets = async () => {
  isLoading.value = true;
  try {
    const response = await assetsApi.getPersonalAssets({
      page: currentPage.value,
      pageSize: pageSize,
      category: selectedCategory.value,
      visibility: selectedVisibility.value,
      search: searchQuery.value || undefined,
    });

    assets.value = response.Data || [];
    // API uses PascalCase for TotalPages
    totalPages.value = response.TotalPages || 0;
    totalItems.value = response.TotalRecords || 0;
    selectedAssets.value.clear();

    // Fetch categories if not already loaded
    if (categories.value.length === 0) {
      fetchCategories();
    }
  } catch (e: any) {
    ui.notify(e.message || 'Failed to load assets', 'error');
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const cats = await assetsApi.getPersonalCategories();
    categories.value = cats || [];
  } catch (e: any) {
    console.error('Failed to load categories:', e);
  }
};

const openCreateDialog = () => {
  formData.value = {
    Asset: null,
    Visibility: Visibility.Private,
    Category: undefined,
    Notes: undefined,
  };
  showCreateDialog.value = true;
};

const openEditDialog = (asset: AccountAssetDto) => {
  editingAsset.value = asset;
  formData.value = {
    Asset: asset.Asset,
    Visibility: asset.Visibility,
    Category: asset.Category,
    Notes: asset.Notes,
  };
  showEditDialog.value = true;
};

const closeCreateDialog = () => {
  showCreateDialog.value = false;
  formData.value = {
    Asset: null,
    Visibility: Visibility.Private,
    Category: undefined,
    Notes: undefined,
  };
};

const closeEditDialog = () => {
  showEditDialog.value = false;
  editingAsset.value = null;
  formData.value = {
    Asset: null,
    Visibility: Visibility.Private,
    Category: undefined,
    Notes: undefined,
  };
};

const handleCreate = async () => {
  try {
    const payload = {
      Asset: formData.value.Asset || { Type: AssetType.Empty, Value: undefined, Tag: undefined },
      Visibility: formData.value.Visibility,
      Category: formData.value.Category,
      Notes: formData.value.Notes,
    };

    await assetsApi.createPersonalAsset(payload);
    ui.notify(t('common.success'), 'success');
    closeCreateDialog();
    fetchAssets();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to create asset', 'error');
  }
};

const handleUpdate = async () => {
  if (!editingAsset.value) return;

  try {
    const payload = {
      Asset: formData.value.Asset || { Type: AssetType.Empty, Value: undefined, Tag: undefined },
      Visibility: formData.value.Visibility,
      Category: formData.value.Category,
      Notes: formData.value.Notes,
    };

    await assetsApi.patchPersonalAsset(editingAsset.value.Id, payload);
    ui.notify(t('common.success'), 'success');
    closeEditDialog();
    fetchAssets();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to update asset', 'error');
  }
};

const confirmDelete = (asset: AccountAssetDto) => {
  assetToDelete.value = asset;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!assetToDelete.value) return;

  try {
    await assetsApi.deletePersonalAsset(assetToDelete.value.Id);
    ui.notify(t('common.deleteSuccess'), 'success');
    showDeleteDialog.value = false;
    assetToDelete.value = null;
    fetchAssets();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to delete asset', 'error');
  }
};

const copyUuid = (uuid: string) => {
  navigator.clipboard.writeText(uuid);
  ui.notify(t('common.copied'), 'success');
};

const toggleSelect = (uuid: string) => {
  if (selectedAssets.value.has(uuid)) {
    selectedAssets.value.delete(uuid);
  } else {
    selectedAssets.value.add(uuid);
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedAssets.value.clear();
  } else {
    assets.value.forEach(a => selectedAssets.value.add(a.Id));
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = undefined;
  selectedVisibility.value = undefined;
  currentPage.value = 1;
};

const getVisibilityLabel = (visibility: Visibility) => {
  switch (visibility) {
    case Visibility.Public: return t('common.visibilityPublic');
    case Visibility.Authenticated: return t('common.visibilityAuthenticated');
    case Visibility.Protected: return t('common.visibilityProtected');
    case Visibility.Private: return t('common.visibilityPrivate');
    case Visibility.FriendsOnly: return t('common.visibilityFriendsOnly');
    default: return 'Unknown';
  }
};

const getAssetTypeLabel = (type: AssetType) => {
  switch (type) {
    case AssetType.Text: return t('common.text');
    case AssetType.Image: return t('common.image');
    case AssetType.Remote: return t('common.remote');
    case AssetType.Style: return t('common.style');
    case AssetType.Identifier: return t('common.identifier');
    case AssetType.Library: return t('common.library');
    case AssetType.Resource: return t('common.resource');
    default: return 'Unknown';
  }
};

const getVisibilityIcon = (visibility: Visibility) => {
  return visibility === Visibility.Public ? Eye : EyeOff;
};

const getVisibilityColor = (visibility: Visibility) => {
  switch (visibility) {
    case Visibility.Public: return 'text-green-400';
    case Visibility.Authenticated:
    case Visibility.Protected: return 'text-blue-400';
    case Visibility.Private:
    case Visibility.FriendsOnly: return 'text-orange-400';
    default: return 'text-gray-400';
  }
};

// Watchers
watch([searchQuery, selectedCategory, selectedVisibility], () => {
  currentPage.value = 1;
  fetchAssets();
});

watch(currentPage, fetchAssets);

onMounted(fetchAssets);
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
          <Layers class="size-5 text-brand-blue" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">{{ t('common.assetLibrary') }}</h1>
          <p class="text-muted-foreground text-sm">{{ t('assetLibrary.subtitle') }}</p>
        </div>
      </div>
      <Button @click="openCreateDialog" class="font-bold gap-2">
        <Plus class="size-4" /> {{ t('common.create') }}
      </Button>
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
        <Select v-model="selectedCategory">
          <SelectTrigger class="w-40 h-9">
            <SelectValue :placeholder="t('assetLibrary.allCategories')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{{ t('assetLibrary.allCategories') }}</SelectItem>
            <SelectItem v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Visibility Filter -->
        <Select v-model="selectedVisibility">
          <SelectTrigger class="w-40 h-9">
            <SelectValue :placeholder="t('common.all')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{{ t('common.all') }}</SelectItem>
            <SelectItem v-for="opt in visibilityOptions" :key="opt.value ?? ''" :value="opt.value ?? ''">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Reset -->
        <Button
          v-if="searchQuery || selectedCategory !== undefined || selectedVisibility !== undefined"
          variant="ghost"
          size="sm"
          @click="resetFilters"
        >
          <Filter class="mr-2 size-4" />
          {{ t('admin.resetFilters') }}
        </Button>
      </div>

      <!-- Batch Actions Bar -->
      <div v-if="hasSelected" class="flex items-center justify-between p-3 bg-brand-blue/10 rounded-lg border border-brand-blue/20 animate-in fade-in slide-in-from-bottom-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold">{{ selectedCount }} {{ t('assetLibrary.selected') }}</span>
          <Button variant="ghost" size="sm" class="h-7 text-xs" @click="toggleSelectAll">
            {{ allSelected ? t('common.deselectAll') : t('common.selectAll') }}
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" class="h-7 text-xs">
            {{ t('assetLibrary.batchUpdateVisibility') }}
          </Button>
          <Button variant="destructive" size="sm" class="h-7 text-xs">
            <Trash2 class="size-3 mr-1" /> {{ t('common.delete') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Asset Grid -->
    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <!-- Loading -->
      <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="i in 12" :key="i" class="aspect-square bg-muted rounded-xl animate-pulse"></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="assets.length === 0"
        class="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/10 animate-in fade-in zoom-in-95 duration-300"
      >
        <Layers class="size-12 mx-auto text-muted-foreground/20 mb-4" />
        <p class="font-bold">{{ t('assetLibrary.noAssets') }}</p>
        <p class="text-sm text-muted-foreground mb-4">{{ t('assetLibrary.noAssetsDesc') }}</p>
        <Button variant="outline" @click="openCreateDialog">
          <Plus class="size-4 mr-2" /> {{ t('common.create') }}
        </Button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card
          v-for="item in assets"
          :key="item.Id"
          class="group overflow-hidden hover:shadow-lg transition-all animate-in fade-in relative"
          :class="{ 'ring-2 ring-brand-blue': selectedAssets.has(item.Id) }"
        >
          <!-- Checkbox -->
          <div class="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              :checked="selectedAssets.has(item.Id)"
              @change="toggleSelect(item.Id)"
              class="size-4 rounded border-border cursor-pointer"
            />
          </div>

          <div class="relative aspect-square bg-muted">
            <AssetView :asset="item.Asset" class-name="w-full h-full object-cover" />

            <!-- Visibility Badge -->
            <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
              <component :is="getVisibilityIcon(item.Visibility)" class="size-3" :class="getVisibilityColor(item.Visibility)" />
              <span class="text-[10px] font-bold text-white">{{ getVisibilityLabel(item.Visibility) }}</span>
            </div>

            <!-- Asset Type Badge -->
            <div class="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-0.5">
              <span class="text-[10px] font-bold text-white">{{ getAssetTypeLabel(item.Asset.Type) }}</span>
            </div>

            <!-- Hover Actions -->
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button size="icon" variant="secondary" class="size-9 rounded-full">
                    <MoreHorizontal class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem @click="copyUuid(item.Id)">
                    <Copy class="size-4 mr-2" /> {{ t('common.copy') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openEditDialog(item)">
                    <Edit2 class="size-4 mr-2" /> {{ t('common.edit') }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDelete(item)">
                    <Trash2 class="size-4 mr-2" /> {{ t('common.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <span class="truncate">{{ item.Id.slice(0, 8) }}...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between gap-4 px-2 pt-4 border-t animate-in fade-in duration-300">
      <div class="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {{ t('admin.currentPage') }}: <span class="text-foreground">{{ currentPage }}</span> / {{ totalPages }}
        <span class="ml-2">({{ totalItems }} {{ t('assetLibrary.total') }})</span>
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
        <Button
          variant="outline"
          size="icon"
          class="size-9 rounded-lg"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <ChevronLeft class="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="size-9 rounded-lg"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>

    <!-- Create Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ t('assetLibrary.createAsset') }}</DialogTitle>
          <DialogDescription>{{ t('assetLibrary.createAssetDesc') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Asset Editor -->
          <AssetEditor
            v-model="formData.Asset"
            :label="t('assetLibrary.assetFile')"
            :description="t('assetLibrary.assetFileDesc')"
          />

          <!-- Visibility -->
          <div class="space-y-2">
            <Label>{{ t('common.visibility') }}</Label>
            <Select v-model="formData.Visibility">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="Visibility.Public">{{ t('common.visibilityPublic') }}</SelectItem>
                <SelectItem :value="Visibility.Authenticated">{{ t('common.visibilityAuthenticated') }}</SelectItem>
                <SelectItem :value="Visibility.Protected">{{ t('common.visibilityProtected') }}</SelectItem>
                <SelectItem :value="Visibility.Private">{{ t('common.visibilityPrivate') }}</SelectItem>
                <SelectItem :value="Visibility.FriendsOnly">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Category -->
          <div class="space-y-2">
            <Label>{{ t('assetLibrary.category') }}</Label>
            <Input v-model="formData.Category" :placeholder="t('assetLibrary.categoryPlaceholder')" />
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <Label>{{ t('assetLibrary.notes') }}</Label>
            <Input v-model="formData.Notes" :placeholder="t('assetLibrary.notesPlaceholder')" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeCreateDialog">{{ t('common.cancel') }}</Button>
          <Button @click="handleCreate">{{ t('common.create') }}</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ t('assetLibrary.editAsset') }}</DialogTitle>
          <DialogDescription>{{ t('assetLibrary.editAssetDesc') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Asset Editor -->
          <AssetEditor
            v-model="formData.Asset"
            :label="t('assetLibrary.assetFile')"
            :description="t('assetLibrary.assetFileDesc')"
          />

          <!-- Visibility -->
          <div class="space-y-2">
            <Label>{{ t('common.visibility') }}</Label>
            <Select v-model="formData.Visibility">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="Visibility.Public">{{ t('common.visibilityPublic') }}</SelectItem>
                <SelectItem :value="Visibility.Authenticated">{{ t('common.visibilityAuthenticated') }}</SelectItem>
                <SelectItem :value="Visibility.Protected">{{ t('common.visibilityProtected') }}</SelectItem>
                <SelectItem :value="Visibility.Private">{{ t('common.visibilityPrivate') }}</SelectItem>
                <SelectItem :value="Visibility.FriendsOnly">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Category -->
          <div class="space-y-2">
            <Label>{{ t('assetLibrary.category') }}</Label>
            <Input v-model="formData.Category" :placeholder="t('assetLibrary.categoryPlaceholder')" />
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <Label>{{ t('assetLibrary.notes') }}</Label>
            <Input v-model="formData.Notes" :placeholder="t('assetLibrary.notesPlaceholder')" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeEditDialog">{{ t('common.cancel') }}</Button>
          <Button @click="handleUpdate">{{ t('common.save') }}</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.delete') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('assetLibrary.deleteConfirm') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
            @click="handleDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
