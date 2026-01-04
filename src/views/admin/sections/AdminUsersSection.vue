<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import {
  type UserAdminDto,
  type PagedResponse,
  AccountStatus,
  AccountRole,
  AccountType,
  AccountRoleNames
} from '@/api/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Loader2, Search, Shield, Ban, Trash2, CheckCircle,
  AlertTriangle, MoreHorizontal, Filter, ChevronDown,
  ChevronLeft, ChevronsLeft, ChevronRight, RotateCcw, X
} from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();
const auth = useAuthStore();

// --- State ---
const users = ref<UserAdminDto[]>([]);
const totalRecords = ref(0);
const totalPages = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchInput = ref(''); // Local input state for search
const activeSearch = ref(''); // The actual search string used for API
const isLoading = ref(false);

// Multi-select Filter States
const filterStatus = ref<number[]>([]);
const filterRole = ref<number[]>([]);
const filterType = ref<number[]>([]);

// Action states
const actionLoadingId = ref<string | null>(null);
const showDeleteDialog = ref(false);
const userToDelete = ref<UserAdminDto | null>(null);

// --- Mappings ---
const getStatusLabel = (s: number) => {
  const map: Record<number, string> = {
    [AccountStatus.Active]: t('admin.statusActive'),
    [AccountStatus.PendingDeletion]: t('admin.statusPendingDeletion'),
    [AccountStatus.Banned]: t('admin.statusBanned'),
    [AccountStatus.Suspended]: t('admin.statusSuspended'),
    [AccountStatus.Deactivated]: t('admin.statusDeactivated'),
  };
  return map[s] || 'Unknown';
};

const getRoleLabel = (r: number) => {
  if (r === AccountRoleNames.Root) return t('admin.roleRoot');
  if (r === AccountRoleNames.Admin) return t('admin.roleAdmin');
  return t('admin.roleUser');
};

const getTypeLabel = (type: number) => {
  const map: Record<number, string> = {
    [AccountType.Personal]: t('admin.typePersonal'),
    [AccountType.Organization]: t('admin.typeOrganization'),
    [AccountType.Application]: t('admin.typeApplication'),
    [AccountType.System]: t('admin.typeSystem'),
    [AccountType.Service]: t('admin.typeService'),
  };
  return map[type] || 'Unknown';
};

const getStatusVariant = (s: number) => {
  if (s === AccountStatus.Active) return 'default';
  if (s === AccountStatus.Banned || s === AccountStatus.PendingDeletion) return 'destructive';
  return 'secondary';
};

// --- API Logic ---
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
    });

    if (activeSearch.value) params.append('Search', activeSearch.value);
    filterStatus.value.forEach(v => params.append('Status', v.toString()));
    filterRole.value.forEach(v => params.append('Role', v.toString()));
    filterType.value.forEach(v => params.append('Type', v.toString()));

    const response = await httpClient<PagedResponse<UserAdminDto>>(`/admin/users?${params.toString()}`);
    users.value = response.Data || [];
    totalRecords.value = response.TotalRecords;
    totalPages.value = response.TotalPages;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  activeSearch.value = searchInput.value;
  currentPage.value = 1;
  fetchUsers();
};

const resetFilters = () => {
  filterStatus.value = [];
  filterRole.value = [];
  filterType.value = [];
  searchInput.value = '';
  activeSearch.value = '';
  currentPage.value = 1;
  fetchUsers();
};

const toggleFilter = (arr: number[], val: number) => {
  const idx = arr.indexOf(val);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(val);
  currentPage.value = 1; // Reset to page 1 on filter change
};

const isAnyFilterActive = computed(() => {
  return filterStatus.value.length > 0 ||
      filterRole.value.length > 0 ||
      filterType.value.length > 0 ||
      activeSearch.value.length > 0;
});

// Watch for filter/page changes
watch([currentPage, filterStatus, filterRole, filterType], fetchUsers, { deep: true });

// --- Admin Actions ---
const canDelete = (user: UserAdminDto) => {
  // Front-end check: Cannot delete self
  return auth.user?.Id !== user.Id;
};

const updateStatus = async (user: UserAdminDto, newStatus: number) => {
  actionLoadingId.value = user.Id;
  try {
    await httpClient(`/admin/users/${user.Id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ Status: newStatus })
    });
    user.Status = newStatus as AccountStatus;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;
  actionLoadingId.value = userToDelete.value.Id;
  try {
    await httpClient(`/admin/users/${userToDelete.value.Id}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    showDeleteDialog.value = false;
    fetchUsers();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

    <!-- Action Bar -->
    <div class="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

      <!-- Left: Filters & Reset (Fixed Position) -->
      <div class="flex flex-wrap items-center gap-2">
        <transition name="fade-scale">
          <Button
              v-if="isAnyFilterActive"
              variant="ghost"
              size="sm"
              @click="resetFilters"
              class="text-muted-foreground hover:text-foreground h-9"
          >
            <RotateCcw class="size-4 mr-2" />
            {{ t('admin.resetFilters') }}
          </Button>
        </transition>

        <!-- Status Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 border-dashed">
              <Filter class="size-4 mr-2" />
              {{ t('admin.statusFilter') }}
              <Badge v-if="filterStatus.length" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterStatus.length }}</Badge>
              <ChevronDown class="size-4 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="start">
            <div class="grid gap-1">
              <label v-for="s in [0, 3, 2, 1, 4]" :key="s" class="flex items-center gap-2 p-2 rounded-sm hover:bg-muted cursor-pointer transition-colors">
                <Checkbox :checked="filterStatus.includes(s)" @update:checked="toggleFilter(filterStatus, s)" />
                <span class="text-sm font-medium leading-none">{{ getStatusLabel(s) }}</span>
              </label>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Role Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 border-dashed">
              <Shield class="size-4 mr-2" />
              {{ t('admin.roleFilter') }}
              <Badge v-if="filterRole.length" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterRole.length }}</Badge>
              <ChevronDown class="size-4 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="start">
            <div class="grid gap-1">
              <label v-for="r in [-1, 1000, 0]" :key="r" class="flex items-center gap-2 p-2 rounded-sm hover:bg-muted cursor-pointer transition-colors">
                <Checkbox :checked="filterRole.includes(r)" @update:checked="toggleFilter(filterRole, r)" />
                <span class="text-sm font-medium leading-none">{{ getRoleLabel(r as any) }}</span>
              </label>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Type Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 border-dashed">
              <X class="size-4 mr-2" />
              {{ t('admin.typeFilter') }}
              <Badge v-if="filterType.length" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterType.length }}</Badge>
              <ChevronDown class="size-4 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="start">
            <div class="grid gap-1">
              <label v-for="ty in [1, 2, 3, 4, 5]" :key="ty" class="flex items-center gap-2 p-2 rounded-sm hover:bg-muted cursor-pointer transition-colors">
                <Checkbox :checked="filterType.includes(ty)" @update:checked="toggleFilter(filterType, ty)" />
                <span class="text-sm font-medium leading-none">{{ getTypeLabel(ty as any) }}</span>
              </label>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- Right: Search Input Group -->
      <div class="flex w-full xl:max-w-sm items-center gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
              v-model="searchInput"
              :placeholder="t('common.search')"
              class="pl-9 h-10 bg-background/50 focus-visible:ring-brand-blue"
              @keyup.enter="handleSearch"
          />
        </div>
        <Button variant="default" class="font-bold h-10" @click="handleSearch">
          {{ t('common.search') }}
        </Button>
      </div>
    </div>

    <!-- User Table -->
    <div class="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden relative min-h-[500px]">

      <!-- Overlay Loading -->
      <transition name="fade">
        <div v-if="isLoading" class="absolute inset-0 z-20 bg-background/40 backdrop-blur-[2px] flex items-center justify-center">
          <div class="flex flex-col items-center gap-2">
            <Loader2 class="size-10 animate-spin text-brand-blue" />
            <span class="text-sm font-bold animate-pulse">{{ t('common.loading') }}</span>
          </div>
        </div>
      </transition>

      <Table>
        <TableHeader class="bg-muted/50">
          <TableRow>
            <TableHead class="w-[260px] font-black uppercase text-xs tracking-widest">{{ t('common.username') }}</TableHead>
            <TableHead class="font-black uppercase text-xs tracking-widest">{{ t('admin.typeFilter') }}</TableHead>
            <TableHead class="font-black uppercase text-xs tracking-widest">{{ t('admin.roleFilter') }}</TableHead>
            <TableHead class="font-black uppercase text-xs tracking-widest">{{ t('admin.statusFilter') }}</TableHead>
            <TableHead class="text-right font-black uppercase text-xs tracking-widest">{{ t('common.manage') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <transition-group name="list">
            <TableRow v-for="user in users" :key="user.Id" class="group transition-colors">
              <TableCell>
                <div class="flex flex-col gap-0.5">
                  <span class="font-black text-sm">{{ user.AccountName }}</span>
                  <span class="text-xs text-muted-foreground font-medium">{{ user.Email }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="font-bold px-2 py-0.5 border-muted-foreground/20">
                  {{ getTypeLabel(user.Type) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Shield v-if="user.Role !== 0" class="size-3.5" :class="user.Role === -1 ? 'text-purple-500' : 'text-brand-blue'" />
                  <span class="text-xs font-bold">{{ getRoleLabel(user.Role) }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(user.Status)" class="font-black shadow-sm">
                  {{ getStatusLabel(user.Status) }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="rounded-full hover:bg-muted" :disabled="actionLoadingId === user.Id">
                      <Loader2 v-if="actionLoadingId === user.Id" class="size-4 animate-spin" />
                      <MoreHorizontal v-else class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-56 font-bold">
                    <DropdownMenuLabel>{{ t('common.manage') }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem v-if="user.Status !== 0" @click="updateStatus(user, 0)">
                      <CheckCircle class="mr-2 size-4 text-green-500" /> {{ t('admin.statusActive') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="user.Status !== 3" @click="updateStatus(user, 3)">
                      <AlertTriangle class="mr-2 size-4 text-orange-500" /> {{ t('admin.statusSuspended') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="user.Status !== 2" @click="updateStatus(user, 2)">
                      <Ban class="mr-2 size-4 text-destructive" /> {{ t('admin.statusBanned') }}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        class="text-destructive focus:bg-destructive focus:text-white"
                        :disabled="!canDelete(user)"
                        @click="userToDelete = user; showDeleteDialog = true"
                    >
                      <Trash2 class="mr-2 size-4" /> {{ t('common.remove') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </transition-group>

          <!-- Empty State -->
          <TableRow v-if="users.length === 0 && !isLoading">
            <TableCell colspan="5" class="h-[400px] text-center">
              <div class="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Search class="size-10 opacity-20" />
                <p class="text-sm font-bold italic">No users found matching your criteria.</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination Footer -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
      <div class="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
        <div>{{ t('admin.totalUsers') }}: <span class="text-foreground">{{ totalRecords }}</span></div>
        <div class="w-px h-3 bg-border"></div>
        <div>{{ t('admin.totalPages') }}: <span class="text-foreground">{{ totalPages }}</span></div>
      </div>

      <div class="flex items-center gap-2">
        <Button
            variant="outline"
            size="icon"
            class="size-9 rounded-lg"
            :disabled="currentPage === 1"
            @click="currentPage = 1"
            :title="t('admin.goToFirst')"
        >
          <ChevronsLeft class="size-4" />
        </Button>
        <Button variant="outline" size="icon" class="size-9 rounded-lg" :disabled="currentPage === 1" @click="currentPage--">
          <ChevronLeft class="size-4" />
        </Button>

        <div class="flex items-center justify-center px-4 h-9 min-w-24 bg-muted/50 rounded-lg text-xs font-black">
          {{ currentPage }} / {{ totalPages }}
        </div>

        <Button variant="outline" size="icon" class="size-9 rounded-lg" :disabled="currentPage >= totalPages" @click="currentPage++">
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>

    <!-- Physical Delete Confirmation -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent class="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-xl font-black">{{ t('common.deleteConfirm') }}</AlertDialogTitle>
          <AlertDialogDescription class="font-medium">
            {{ t('admin.deleteModalDesc') || 'This will permanently delete the account and all associated data. This action cannot be undone.' }}
            <div class="mt-4 p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive text-sm font-bold">
              Account: {{ userToDelete?.AccountName }} ({{ userToDelete?.Email }})
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="gap-2">
          <AlertDialogCancel class="rounded-xl font-bold">{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
              @click="confirmDelete"
              class="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold"
          >
            {{ t('common.remove') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
/* List Animation */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.list-move {
  transition: transform 0.4s ease;
}

/* Fade Scale Animation for Reset Button */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateX(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
