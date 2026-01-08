<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import { type SystemAssetDto, type AssetDto, Visibility } from '@/api/types';
import { systemAssetsApi } from '@/api/services';

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
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Eye, EyeOff, Filter, Copy, Trash2,
  Edit2, Plus, Layers, Check, Lock, Loader2
} from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const assets = ref<SystemAssetDto[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = 12;
const totalPages = ref(0);
const totalItems = ref(0);
const searchQuery = ref('');
const selectedCategory = ref<string>('__all__');
const categories = ref<string[]>([]);
const selectedVisibility = ref<string>('__all__');
const selectedAssets = ref<Set<string>>(new Set());
const showBatchVisibilityDialog = ref(false);
const showBatchDeleteDialog = ref(false);
const batchVisibility = ref<string>(String(Visibility.Private));

// Dialog states
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const editingAsset = ref<SystemAssetDto | null>(null);
const assetToDelete = ref<SystemAssetDto | null>(null);

// Form state
const formAsset = ref<AssetDto | null>(null);
const formVisibility = ref<Visibility>(Visibility.Private);
const formCategory = ref<string>('');
const formNotes = ref<string>('');

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
    const response = await systemAssetsApi.getSystemAssets({
      page: currentPage.value,
      pageSize: pageSize,
      category: selectedCategory.value && selectedCategory.value !== '__all__' ? selectedCategory.value : undefined,
      visibility: selectedVisibility.value && selectedVisibility.value !== '__all__' ? parseInt(selectedVisibility.value) as Visibility : undefined,
      search: searchQuery.value || undefined,
    });

    assets.value = response.Data || [];
    totalPages.value = response.TotalPages || 0;
    totalItems.value = response.TotalRecords || 0;
    selectedAssets.value.clear();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to load assets', 'error');
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    // System assets don't have a categories endpoint, derive from assets
    const uniqueCategories = new Set<string>();
    assets.value.forEach(asset => {
      if (asset.Category) uniqueCategories.add(asset.Category);
    });
    categories.value = Array.from(uniqueCategories).sort();
  } catch (e: any) {
    console.error('Failed to load categories:', e);
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = '__all__';
  selectedVisibility.value = '__all__';
  currentPage.value = 1;
};

const toggleSelect = (id: string) => {
  if (selectedAssets.value.has(id)) {
    selectedAssets.value.delete(id);
  } else {
    selectedAssets.value.add(id);
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedAssets.value.clear();
  } else {
    assets.value.forEach(item => selectedAssets.value.add(item.Id));
  }
};

const copyUuid = async (uuid: string) => {
  try {
    await navigator.clipboard.writeText(uuid);
    ui.notify(t('assetLibrary.copySuccess'), 'success');
  } catch {
    ui.notify('Failed to copy', 'error');
  }
};

const openCreateDialog = () => {
  formAsset.value = null;
  formVisibility.value = Visibility.Private;
  formCategory.value = '';
  formNotes.value = '';
  showCreateDialog.value = true;
};

const openEditDialog = (asset: SystemAssetDto) => {
  editingAsset.value = asset;
  formAsset.value = asset.Asset;
  formVisibility.value = asset.Visibility;
  formCategory.value = asset.Category || '';
  formNotes.value = asset.Notes || '';
  showEditDialog.value = true;
};

const openDeleteDialog = (asset: SystemAssetDto) => {
  assetToDelete.value = asset;
  showDeleteDialog.value = true;
};

const handleCreate = async () => {
  if (!formAsset.value) return;

  try {
    await systemAssetsApi.createSystemAsset({
      Asset: formAsset.value,
      Visibility: formVisibility.value,
      Category: formCategory.value || undefined,
      Notes: formNotes.value || undefined,
    });
    ui.notify(t('common.createSuccess'), 'success');
    showCreateDialog.value = false;
    fetchAssets();
    fetchCategories();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to create asset', 'error');
  }
};

const handleUpdate = async () => {
  if (!editingAsset.value || !formAsset.value) return;

  try {
    await systemAssetsApi.updateSystemAsset(editingAsset.value.Id, {
      Asset: formAsset.value,
      Visibility: formVisibility.value,
      Category: formCategory.value || undefined,
      Notes: formNotes.value || undefined,
    });
    ui.notify(t('common.updateSuccess'), 'success');
    showEditDialog.value = false;
    fetchAssets();
    fetchCategories();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to update asset', 'error');
  }
};

const handleDelete = async () => {
  if (!assetToDelete.value) return;

  try {
    await systemAssetsApi.deleteSystemAsset(assetToDelete.value.Id);
    ui.notify(t('common.deleteSuccess'), 'success');
    showDeleteDialog.value = false;
    fetchAssets();
    fetchCategories();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to delete asset', 'error');
  }
};
const handleBatchVisibility = async () => {
  if (selectedAssets.value.size === 0) return;

  try {
    // Batch visibility updates for system assets - using individual API calls
    const promises = Array.from(selectedAssets.value).map(id =>
      systemAssetsApi.patchSystemAsset(id, { Visibility: parseInt(batchVisibility.value) as Visibility })
    );
    await Promise.all(promises);
    ui.notify(t('common.updateSuccess'), 'success');
    selectedAssets.value.clear();
    showBatchVisibilityDialog.value = false;
    fetchAssets();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to update visibility', 'error');
  }
};

const confirmBatchDelete = () => {
  if (selectedAssets.value.size === 0) return;
  showBatchDeleteDialog.value = true;
};

const handleBatchDelete = async () => {
  if (selectedAssets.value.size === 0) return;

  try {
    // Batch delete for system assets - using individual API calls
    const promises = Array.from(selectedAssets.value).map(id =>
      systemAssetsApi.deleteSystemAsset(id)
    );
    await Promise.all(promises);
    ui.notify(t('common.deleteSuccess'), 'success');
    selectedAssets.value.clear();
    showBatchDeleteDialog.value = false;
    fetchAssets();
    fetchCategories();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to delete assets', 'error');
  }
};

const getVisibilityIcon = (visibility: Visibility) => {
  switch (visibility) {
    case Visibility.Public: return Eye;
    case Visibility.Authenticated:
    case Visibility.Protected: return EyeOff;
    case Visibility.Private: return Lock;
    case Visibility.FriendsOnly:
    case Visibility.MembersOnly: return Eye;
    default: return Eye;
  }
};

const getVisibilityColor = (visibility: Visibility) => {
  switch (visibility) {
    case Visibility.Public: return 'text-green-500';
    case Visibility.Authenticated: return 'text-blue-500';
    case Visibility.Protected: return 'text-yellow-500';
    case Visibility.Private: return 'text-red-500';
    case Visibility.FriendsOnly: return 'text-purple-500';
    case Visibility.MembersOnly: return 'text-orange-500';
    default: return 'text-gray-500';
  }
};

const getVisibilityLabel = (visibility: Visibility) => {
  switch (visibility) {
    case Visibility.Public: return t('common.visibilityPublic');
    case Visibility.Authenticated: return t('common.visibilityAuthenticated');
    case Visibility.Protected: return t('common.visibilityProtected');
    case Visibility.Private: return t('common.visibilityPrivate');
    case Visibility.FriendsOnly: return t('common.visibilityFriendsOnly');
    case Visibility.MembersOnly: return t('common.visibilityMembersOnly');
    default: return String(visibility);
  }
};

// --- Lifecycle ---
onMounted(() => {
  fetchAssets();
  fetchCategories();
});

watch(currentPage, () => {
  fetchAssets();
});

watch([selectedCategory, selectedVisibility, searchQuery], () => {
  currentPage.value = 1;
  fetchAssets();
});
</script>


<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
          <Layers class="size-5 text-brand-blue" />
        </div>
        <div>
          <h2 class="text-2xl font-bold">{{ t('admin.systemAssets') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('admin.systemAssetsDesc') }}</p>
        </div>
      </div>
      <Button @click="openCreateDialog" class="font-bold gap-2">
        <Plus class="size-4" /> {{ t('assetLibrary.createAsset') }}
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
          <SelectTrigger class="w-48 h-9">
            <SelectValue :placeholder="t('assetLibrary.allCategories')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{{ t('assetLibrary.allCategories') }}</SelectItem>
            <SelectItem v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Visibility Filter -->
        <Select v-model="selectedVisibility">
          <SelectTrigger class="w-48 h-9">
            <SelectValue :placeholder="t('common.all')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{{ t('common.all') }}</SelectItem>
            <SelectItem :value="String(Visibility.Public)">{{ t('common.visibilityPublic') }}</SelectItem>
            <SelectItem :value="String(Visibility.Authenticated)">{{ t('common.visibilityAuthenticated') }}</SelectItem>
            <SelectItem :value="String(Visibility.Protected)">{{ t('common.visibilityProtected') }}</SelectItem>
            <SelectItem :value="String(Visibility.Private)">{{ t('common.visibilityPrivate') }}</SelectItem>
            <SelectItem :value="String(Visibility.FriendsOnly)">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
            <SelectItem :value="String(Visibility.MembersOnly)">{{ t('common.visibilityMembersOnly') }}</SelectItem>
          </SelectContent>
        </Select>

        <!-- Reset -->
        <Button
          v-if="searchQuery || selectedCategory !== '__all__' || selectedVisibility !== '__all__'"
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
          <Button variant="outline" size="sm" class="h-7 text-xs" @click="showBatchVisibilityDialog = true">
            <Eye class="size-3 mr-1" /> {{ t('assetLibrary.batchUpdateVisibility') }}
          </Button>
          <Button variant="destructive" size="sm" class="h-7 text-xs" @click="confirmBatchDelete">
            <Trash2 class="size-3 mr-1" /> {{ t('common.delete') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && assets.length === 0" class="py-20 flex justify-center">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && assets.length === 0" class="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/10 animate-in fade-in zoom-in-95 duration-300">
      <Layers class="size-12 mx-auto text-muted-foreground/20 mb-4" />
      <p class="font-bold">{{ t('assetLibrary.noAssets') }}</p>
      <p class="text-sm text-muted-foreground mb-4">{{ t('admin.noSystemAssetsDesc') }}</p>
      <Button variant="outline" @click="openCreateDialog">
        <Plus class="size-4 mr-2" /> {{ t('assetLibrary.createAsset') }}
      </Button>
    </div>

    <!-- Asset Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card
        v-for="item in assets"
        :key="item.Id"
        class="group overflow-hidden transition-all animate-in fade-in relative"
        :class="{
          'ring-2 ring-brand-blue shadow-lg': selectedAssets.has(item.Id),
          'hover:shadow-lg': !selectedAssets.has(item.Id)
        }"
        @click="copyUuid(item.Id)"
      >
        <!-- Checkbox -->
        <div
          class="absolute top-2 left-2 z-10 size-5 rounded cursor-pointer flex items-center justify-center transition-all"
          :class="{
            'bg-background border-2 border-brand-blue': selectedAssets.has(item.Id),
            'bg-black/20 border-2 border-transparent hover:border-background/80': !selectedAssets.has(item.Id)
          }"
          @click.stop="toggleSelect(item.Id)"
        >
          <Check v-if="selectedAssets.has(item.Id)" class="size-3 text-brand-blue" />
        </div>

        <div class="relative aspect-square bg-muted">
          <AssetView :asset="item.Asset" class-name="w-full h-full object-cover" />

          <!-- Visibility Badge -->
          <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <component :is="getVisibilityIcon(item.Visibility)" class="size-3" :class="getVisibilityColor(item.Visibility)" />
            <span class="text-[10px] font-bold text-white">{{ getVisibilityLabel(item.Visibility) }}</span>
          </div>

          <!-- Hover Actions -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              class="size-9 rounded-full"
              @click.stop="copyUuid(item.Id)"
              :title="t('common.copy')"
            >
              <Copy class="size-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              class="size-9 rounded-full"
              @click.stop="openEditDialog(item)"
              :title="t('common.edit')"
            >
              <Edit2 class="size-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              class="size-9 rounded-full"
              @click.stop="openDeleteDialog(item)"
              :title="t('common.delete')"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
        </div>

        <CardContent class="p-4 space-y-2">
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

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" :disabled="currentPage === 1" @click="currentPage = 1">
        <ChevronsLeft class="size-4" />
      </Button>
      <Button variant="outline" size="icon" :disabled="currentPage === 1" @click="currentPage--">
        <ChevronLeft class="size-4" />
      </Button>
      <span class="text-sm text-muted-foreground px-4">
        {{ currentPage }} / {{ totalPages }} ({{ totalItems }} {{ t('assetLibrary.total') }})
      </span>
      <Button variant="outline" size="icon" :disabled="currentPage === totalPages" @click="currentPage++">
        <ChevronRight class="size-4" />
      </Button>
      <Button variant="outline" size="icon" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
        <ChevronsRight class="size-4" />
      </Button>
    </div>
  </div>

  <!-- Create Dialog -->
  <Dialog v-model:open="showCreateDialog">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t('assetLibrary.createAsset') }}</DialogTitle>
        <DialogDescription>{{ t('admin.createSystemAssetDesc') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <AssetEditor
          v-model="formAsset"
          :label="t('assetLibrary.assetFile')"
          :description="t('assetLibrary.assetFileDesc')"
        />

        <div class="space-y-2">
          <Label>{{ t('common.visibility') }}</Label>
          <Select v-model="formVisibility">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="Visibility.Public">{{ t('common.visibilityPublic') }}</SelectItem>
              <SelectItem :value="Visibility.Authenticated">{{ t('common.visibilityAuthenticated') }}</SelectItem>
              <SelectItem :value="Visibility.Protected">{{ t('common.visibilityProtected') }}</SelectItem>
              <SelectItem :value="Visibility.Private">{{ t('common.visibilityPrivate') }}</SelectItem>
              <SelectItem :value="Visibility.FriendsOnly">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
              <SelectItem :value="Visibility.MembersOnly">{{ t('common.visibilityMembersOnly') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>{{ t('assetLibrary.category') }}</Label>
          <Input v-model="formCategory" :placeholder="t('assetLibrary.categoryPlaceholder')" />
        </div>

        <div class="space-y-2">
          <Label>{{ t('assetLibrary.notes') }}</Label>
          <Input v-model="formNotes" :placeholder="t('assetLibrary.notesPlaceholder')" />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showCreateDialog = false">{{ t('common.cancel') }}</Button>
        <Button @click="handleCreate">{{ t('common.create') }}</Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Edit Dialog -->
  <Dialog v-model:open="showEditDialog">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t('assetLibrary.editAsset') }}</DialogTitle>
        <DialogDescription>{{ t('admin.editSystemAssetDesc') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <AssetEditor
          v-model="formAsset"
          :label="t('assetLibrary.assetFile')"
          :description="t('assetLibrary.assetFileDesc')"
        />

        <div class="space-y-2">
          <Label>{{ t('common.visibility') }}</Label>
          <Select v-model="formVisibility">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="Visibility.Public">{{ t('common.visibilityPublic') }}</SelectItem>
              <SelectItem :value="Visibility.Authenticated">{{ t('common.visibilityAuthenticated') }}</SelectItem>
              <SelectItem :value="Visibility.Protected">{{ t('common.visibilityProtected') }}</SelectItem>
              <SelectItem :value="Visibility.Private">{{ t('common.visibilityPrivate') }}</SelectItem>
              <SelectItem :value="Visibility.FriendsOnly">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
              <SelectItem :value="Visibility.MembersOnly">{{ t('common.visibilityMembersOnly') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>{{ t('assetLibrary.category') }}</Label>
          <Input v-model="formCategory" :placeholder="t('assetLibrary.categoryPlaceholder')" />
        </div>

        <div class="space-y-2">
          <Label>{{ t('assetLibrary.notes') }}</Label>
          <Input v-model="formNotes" :placeholder="t('assetLibrary.notesPlaceholder')" />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showEditDialog = false">{{ t('common.cancel') }}</Button>
        <Button @click="handleUpdate">{{ t('common.update') }}</Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <AlertDialog v-model:open="showDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('common.delete') }}</AlertDialogTitle>
        <AlertDialogDescription>
          <div class="space-y-2">
            <p>{{ t('common.deleteConfirm') }}</p>
            <div v-if="assetToDelete" class="mt-4 p-3 bg-muted rounded-lg space-y-1 text-sm font-mono">
              <div><span class="text-muted-foreground">ID:</span> {{ assetToDelete.Id }}</div>
              <div v-if="assetToDelete.Category"><span class="text-muted-foreground">Category:</span> {{ assetToDelete.Category }}</div>
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction @click="handleDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {{ t('common.delete') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Batch Visibility Dialog -->
  <Dialog v-model:open="showBatchVisibilityDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('assetLibrary.batchUpdateVisibility') }}</DialogTitle>
        <DialogDescription>
          {{ t('assetLibrary.selected') }}: {{ selectedCount }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <Label>{{ t('common.visibility') }}</Label>
        <Select v-model="batchVisibility">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="Visibility.Public">{{ t('common.visibilityPublic') }}</SelectItem>
            <SelectItem :value="Visibility.Authenticated">{{ t('common.visibilityAuthenticated') }}</SelectItem>
            <SelectItem :value="Visibility.Protected">{{ t('common.visibilityProtected') }}</SelectItem>
            <SelectItem :value="Visibility.Private">{{ t('common.visibilityPrivate') }}</SelectItem>
            <SelectItem :value="Visibility.FriendsOnly">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
            <SelectItem :value="Visibility.MembersOnly">{{ t('common.visibilityMembersOnly') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showBatchVisibilityDialog = false">{{ t('common.cancel') }}</Button>
        <Button @click="handleBatchVisibility">{{ t('common.save') }}</Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Batch Delete Dialog -->
  <AlertDialog v-model:open="showBatchDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('common.delete') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('assetLibrary.deleteConfirm') }}
          <div class="mt-2 p-2 bg-muted rounded-md text-sm">
            {{ t('assetLibrary.selected') }}: <span class="font-bold">{{ selectedCount }}</span>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showBatchDeleteDialog = false">{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction @click="handleBatchDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {{ t('common.delete') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

</template>
