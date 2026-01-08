<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/stores/ui';
import { type AccountAssetDto, type AssetDto, Visibility, MemberRole, type OrganizationDto } from '@/api/types';
import { httpClient } from '@/api/client';

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
  ChevronLeft, ChevronRight, ChevronsLeft,
  Search, Eye, EyeOff, Trash2, ChevronsRight,
  Edit2, Plus, Layers, Check, Lock, Users, Loader2
} from 'lucide-vue-next';
import {assetsApi} from "@/api/services";

const props = defineProps<{ accountName: string }>();
const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const assets = ref<AccountAssetDto[]>([]);
const org = ref<OrganizationDto | null>(null);
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

// --- Computed ---
const canEdit = computed(() => {
  const role = org.value?.MyRole;
  return role === MemberRole.Owner || role === MemberRole.Admin;
});

const allSelected = computed(() => {
  return assets.value.length > 0 && selectedAssets.value.size === assets.value.length;
});

const hasSelected = computed(() => selectedAssets.value.size > 0);

const selectedCount = computed(() => selectedAssets.value.size);

// --- Actions ---
const fetchAssets = async () => {
  if (!props.accountName) return;

  isLoading.value = true;
  try {
    const response = await assetsApi.getOrganizationAssets(props.accountName, {
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
  if (!props.accountName) return;

  try {
    categories.value = await assetsApi.getOrganizationCategories(props.accountName);
  } catch (e: any) {
    console.error('Failed to load categories:', e);
  }
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

const openDeleteDialog = (asset: AccountAssetDto) => {
  assetToDelete.value = asset;
  showDeleteDialog.value = true;
};

const handleCreate = async () => {
  if (!props.accountName || !formData.value.Asset) return;

  try {
    await assetsApi.createOrganizationAsset(props.accountName, {
      Asset: formData.value.Asset,
      Visibility: formData.value.Visibility,
      Category: formData.value.Category,
      Notes: formData.value.Notes,
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
  if (!props.accountName || !editingAsset.value || !formData.value.Asset) return;

  try {
    await assetsApi.updateOrganizationAsset(props.accountName, editingAsset.value.Id, {
      Asset: formData.value.Asset,
      Visibility: formData.value.Visibility,
      Category: formData.value.Category,
      Notes: formData.value.Notes,
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
  if (!props.accountName || !assetToDelete.value) return;

  try {
    await assetsApi.deleteOrganizationAsset(props.accountName, assetToDelete.value.Id);
    ui.notify(t('common.deleteSuccess'), 'success');
    showDeleteDialog.value = false;
    fetchAssets();
    fetchCategories();
  } catch (e: any) {
    ui.notify(e.message || 'Failed to delete asset', 'error');
  }
};

const confirmBatchVisibility = () => {
  if (selectedAssets.value.size === 0) return;
  showBatchVisibilityDialog.value = true;
};

const handleBatchVisibility = async () => {
  if (!props.accountName || selectedAssets.value.size === 0) return;

  try {
    await assetsApi.batchUpdateOrganizationVisibility(props.accountName, {
      AssetIds: Array.from(selectedAssets.value),
      Visibility: parseInt(batchVisibility.value) as Visibility,
    });
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
  if (!props.accountName || selectedAssets.value.size === 0) return;

  try {
    await assetsApi.batchDeleteOrganizationAssets(props.accountName, {
      AssetIds: Array.from(selectedAssets.value),
    });
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
    case Visibility.FriendsOnly: return Users;
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
    default: return String(visibility);
  }
};

// --- Lifecycle ---
const fetchOrgData = async () => {
  if (!props.accountName) return;

  try {
    const response = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    org.value = response;
  } catch (e: any) {
    ui.notify(e.message || 'Failed to load organization data', 'error');
  }
};

onMounted(() => {
  fetchOrgData();
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
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black tracking-tight">{{ t('assetLibrary.title') }}</h1>
        <p class="text-muted-foreground text-sm">{{ t('assetLibrary.subtitle') }}</p>
      </div>
      <Button v-if="canEdit" @click="openCreateDialog" class="font-bold shadow-sm">
        <Plus class="size-4 mr-2" /> {{ t('assetLibrary.createAsset') }}
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          :placeholder="t('common.search') || 'Search...'"
          class="pl-10 h-10"
        />
      </div>

      <Select v-model="selectedCategory">
        <SelectTrigger class="w-40 h-10">
          <SelectValue :placeholder="t('assetLibrary.allCategories')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('assetLibrary.allCategories') }}</SelectItem>
          <SelectItem v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="selectedVisibility">
        <SelectTrigger class="w-40 h-10">
          <SelectValue :placeholder="t('common.all') || 'All'" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('common.all') || 'All' }}</SelectItem>
          <SelectItem :value="String(Visibility.Public)">{{ t('common.visibilityPublic') }}</SelectItem>
          <SelectItem :value="String(Visibility.Authenticated)">{{ t('common.visibilityAuthenticated') }}</SelectItem>
          <SelectItem :value="String(Visibility.Protected)">{{ t('common.visibilityProtected') }}</SelectItem>
          <SelectItem :value="String(Visibility.Private)">{{ t('common.visibilityPrivate') }}</SelectItem>
          <SelectItem :value="String(Visibility.FriendsOnly)">{{ t('common.visibilityFriendsOnly') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Batch Actions -->
    <div v-if="canEdit && hasSelected" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <Button variant="outline" size="sm" @click="toggleSelectAll">
        <Check v-if="allSelected" class="size-4 mr-2" />
        {{ allSelected ? t('common.deselectAll') : t('common.selectAll') }}
      </Button>
      <span class="text-sm text-muted-foreground">
        {{ selectedCount }} {{ t('assetLibrary.selected') }}
      </span>
      <div class="flex-1" />
      <Button variant="outline" size="sm" @click="confirmBatchVisibility">
        <Eye class="size-4 mr-2" /> {{ t('assetLibrary.batchUpdateVisibility') }}
      </Button>
      <Button variant="destructive" size="sm" @click="confirmBatchDelete">
        <Trash2 class="size-4 mr-2" /> {{ t('common.delete') }}
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && assets.length === 0" class="py-20 flex justify-center">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && assets.length === 0" class="text-center py-20 border-2 border-dashed rounded-xl">
      <Layers class="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 class="text-lg font-semibold mb-2">{{ t('assetLibrary.noAssets') }}</h3>
      <p class="text-muted-foreground mb-6">{{ t('assetLibrary.noAssetsDesc') }}</p>
      <Button v-if="canEdit" @click="openCreateDialog">
        <Plus class="size-4 mr-2" /> {{ t('assetLibrary.createAsset') }}
      </Button>
    </div>

    <!-- Asset Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          v-if="canEdit"
          class="absolute top-2 left-2 z-10 size-5 rounded cursor-pointer flex items-center justify-center transition-all"
          :class="{
            'bg-background border-2 border-brand-blue': selectedAssets.has(item.Id),
            'bg-black/20 border-2 border-transparent hover:border-background/80': !selectedAssets.has(item.Id)
          }"
          @click.stop="toggleSelect(item.Id)"
        >
          <Check v-if="selectedAssets.has(item.Id)" class="size-3 text-brand-blue" />
        </div>

        <!-- Asset Preview -->
        <div class="relative aspect-square bg-muted">
          <AssetView :asset="item.Asset" class-name="w-full h-full object-cover" />

          <!-- Visibility Badge -->
          <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <component :is="getVisibilityIcon(item.Visibility)" class="size-3" :class="getVisibilityColor(item.Visibility)" />
            <span class="text-[10px] font-bold text-white">{{ getVisibilityLabel(item.Visibility) }}</span>
          </div>

          <!-- Hover Actions -->
          <div v-if="canEdit" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="icon" variant="secondary" class="h-8 w-8" @click.stop="openEditDialog(item)">
              <Edit2 class="size-4" />
            </Button>
            <Button size="icon" variant="destructive" class="h-8 w-8" @click.stop="openDeleteDialog(item)">
              <Trash2 class="size-4" />
            </Button>
          </div>
        </div>

        <!-- Asset Info -->
        <CardContent class="p-4">
          <div v-if="item.Category" class="text-xs text-muted-foreground mb-1 truncate">
            {{ item.Category }}
          </div>
          <div v-if="item.Notes" class="text-sm font-medium line-clamp-2">
            {{ item.Notes }}
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
        <DialogDescription>{{ t('assetLibrary.createAssetDesc') }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <AssetEditor
          v-model="formData.Asset"
          :label="t('assetLibrary.assetFile')"
          :description="t('assetLibrary.assetFileDesc')"
        />
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
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>{{ t('assetLibrary.category') }}</Label>
          <Input v-model="formData.Category" :placeholder="t('assetLibrary.categoryPlaceholder')" />
        </div>
        <div class="space-y-2">
          <Label>{{ t('assetLibrary.notes') }}</Label>
          <Input v-model="formData.Notes" :placeholder="t('assetLibrary.notesPlaceholder')" />
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
        <DialogDescription>{{ t('assetLibrary.editAssetDesc') }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <AssetEditor
          v-model="formData.Asset"
          :label="t('assetLibrary.assetFile')"
          :description="t('assetLibrary.assetFileDesc')"
        />
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
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>{{ t('assetLibrary.category') }}</Label>
          <Input v-model="formData.Category" :placeholder="t('assetLibrary.categoryPlaceholder')" />
        </div>
        <div class="space-y-2">
          <Label>{{ t('assetLibrary.notes') }}</Label>
          <Input v-model="formData.Notes" :placeholder="t('assetLibrary.notesPlaceholder')" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showEditDialog = false">{{ t('common.cancel') }}</Button>
        <Button @click="handleUpdate">{{ t('common.update') }}</Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation -->
  <AlertDialog v-model:open="showDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('assetLibrary.deleteConfirm') }}</AlertDialogTitle>
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
  <AlertDialog v-model:open="showBatchVisibilityDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('assetLibrary.batchUpdateVisibility') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('common.updateConfirm') }} {{ selectedCount }} {{ t('assetLibrary.selected') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div class="space-y-4 py-4">
        <Select v-model="batchVisibility">
          <SelectTrigger>
            <SelectValue :placeholder="t('common.selectVisibility')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="Visibility.Public">{{ t('common.visibilityPublic') }}</SelectItem>
            <SelectItem :value="Visibility.Authenticated">{{ t('common.visibilityAuthenticated') }}</SelectItem>
            <SelectItem :value="Visibility.Protected">{{ t('common.visibilityProtected') }}</SelectItem>
            <SelectItem :value="Visibility.Private">{{ t('common.visibilityPrivate') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showBatchVisibilityDialog = false">{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction @click="handleBatchVisibility">{{ t('common.update') }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Batch Delete Dialog -->
  <AlertDialog v-model:open="showBatchDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('common.delete') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('common.deleteConfirm') }} {{ selectedCount }} {{ t('assetLibrary.selected') }}?
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
