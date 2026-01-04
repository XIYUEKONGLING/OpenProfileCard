<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import {
  type UserAdminDto,
  type PagedResponse,
  AccountStatus,
  type AccountRole,
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
  AlertTriangle, MoreHorizontal, Filter, ChevronLeft, ChevronsLeft, ChevronRight, X
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
const search = ref('');
const isLoading = ref(false);

const filterStatus = ref<number[]>([]);
const filterRole = ref<number[]>([]);
const filterType = ref<number[]>([]);

const actionLoadingId = ref<string | null>(null);
const showDeleteDialog = ref(false);
const userToDelete = ref<UserAdminDto | null>(null);



const getStatusLabel = (s: AccountStatus) => {
  const map: Record<number, string> = {
    [AccountStatus.Active]: t('admin.statusActive'),
    [AccountStatus.PendingDeletion]: t('admin.statusPendingDeletion'),
    [AccountStatus.Banned]: t('admin.statusBanned'),
    [AccountStatus.Suspended]: t('admin.statusSuspended'),
    [AccountStatus.Deactivated]: t('admin.statusDeactivated'),
  };
  return map[s] || 'Unknown';
};

const getRoleLabel = (r: AccountRole) => {
  if (r === AccountRoleNames.Root) return t('admin.roleRoot');
  if (r === AccountRoleNames.Admin) return t('admin.roleAdmin');
  return t('admin.roleUser');
};

const getTypeLabel = (type: AccountType) => {
  const map: Record<number, string> = {
    [AccountType.Personal]: t('admin.typePersonal'),
    [AccountType.Organization]: t('admin.typeOrganization'),
    [AccountType.Application]: t('admin.typeApplication'),
    [AccountType.System]: t('admin.typeSystem'),
    [AccountType.Service]: t('admin.typeService'),
  };
  return map[type] || 'Unknown';
};

// --- Data ---
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
    });

    if (search.value) params.append('Search', search.value);

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

watch([currentPage, filterStatus, filterRole, filterType], () => {
  fetchUsers();
}, { deep: true });

let searchTimeout: any;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 500);
});

// --- Actions ---
const canOperate = (user: UserAdminDto) => {
  if (user.Role === AccountRoleNames.Root && auth.user?.Role !== AccountRoleNames.Root) return false;
  return true;
};

const updateStatus = async (user: UserAdminDto, newStatus: AccountStatus) => {
  actionLoadingId.value = user.Id;
  try {
    await httpClient(`/admin/users/${user.Id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ Status: newStatus })
    });
    user.Status = newStatus;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const updateRole = async (user: UserAdminDto, newRole: AccountRole) => {
  actionLoadingId.value = user.Id;
  try {
    await httpClient(`/admin/users/${user.Id}/role`, {
      method: 'POST',
      body: JSON.stringify({ Role: newRole })
    });
    user.Role = newRole;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const openDeleteConfirm = (user: UserAdminDto) => {
  if (auth.user?.Id === user.Id) {
    ui.notify(t('admin.cannotDeleteSelf'), 'error');
    return;
  }
  userToDelete.value = user;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;
  const id = userToDelete.value.Id;
  actionLoadingId.value = id;
  try {
    await httpClient(`/admin/users/${id}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    showDeleteDialog.value = false;
    fetchUsers();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const resetFilters = () => {
  filterStatus.value = [];
  filterRole.value = [];
  filterType.value = [];
  currentPage.value = 1;
};

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-4">

    <!-- Toolbar -->
    <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div class="relative w-full lg:max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="search" :placeholder="t('common.search')" class="pl-9 h-10" />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Status Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-10 border-dashed">
              <Filter class="size-4 mr-2" />
              {{ t('admin.statusFilter') }}
              <Badge v-if="filterStatus.length > 0" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterStatus.length }}</Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="end">
            <div class="space-y-1">
              <div v-for="s in [0, 1, 2, 3, 4]" :key="s" class="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer" @click="filterStatus.includes(s) ? filterStatus = filterStatus.filter(i => i !== s) : filterStatus.push(s)">
                <Checkbox :checked="filterStatus.includes(s)" />
                <span class="text-sm">{{ getStatusLabel(s) }}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Role Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-10 border-dashed">
              <Shield class="size-4 mr-2" />
              {{ t('admin.roleFilter') }}
              <Badge v-if="filterRole.length > 0" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterRole.length }}</Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="end">
            <div class="space-y-1">
              <div v-for="r in [-1, 0, 1000]" :key="r" class="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer" @click="filterRole.includes(r) ? filterRole = filterRole.filter(i => i !== r) : filterRole.push(r)">
                <Checkbox :checked="filterRole.includes(r)" />
                <span class="text-sm">{{ getRoleLabel(r as any) }}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button v-if="filterStatus.length || filterRole.length || filterType.length" variant="ghost" size="sm" @click="resetFilters" class="h-10 px-2">
          {{ t('admin.resetFilters') }}
          <X class="ml-2 size-4" />
        </Button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-70">{{ t('common.username') }}</TableHead>
              <TableHead>{{ t('admin.typeFilter') }}</TableHead>
              <TableHead>{{ t('admin.roleFilter') }}</TableHead>
              <TableHead>{{ t('admin.statusFilter') }}</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading && users.length === 0">
              <TableCell colspan="5" class="h-32 text-center">
                <Loader2 class="size-8 animate-spin mx-auto text-muted-foreground" />
              </TableCell>
            </TableRow>

            <TableRow v-else-if="users.length === 0">
              <TableCell colspan="5" class="h-32 text-center text-muted-foreground italic">
                No results found.
              </TableCell>
            </TableRow>

            <template v-else>
              <TableRow v-for="user in users" :key="user.Id" class="transition-opacity duration-300" :class="{ 'opacity-50 pointer-events-none': actionLoadingId === user.Id }">
                <TableCell>
                  <div class="flex flex-col">
                    <span class="font-bold">{{ user.AccountName }}</span>
                    <span class="text-xs text-muted-foreground">{{ user.Email }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="font-normal">{{ getTypeLabel(user.Type) }}</Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Shield v-if="user.Role !== 0" class="size-3.5 text-brand-blue" />
                    <span class="text-sm">{{ getRoleLabel(user.Role) }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="user.Status === 0 ? 'default' : 'secondary'">
                    {{ getStatusLabel(user.Status) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" :disabled="!canOperate(user)">
                        <MoreHorizontal class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                      <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <!-- Status Updates -->
                      <DropdownMenuItem v-if="user.Status !== 0" @click="updateStatus(user, 0)">
                        <CheckCircle class="mr-2 size-4 text-green-500" /> Activate
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="user.Status !== 3" @click="updateStatus(user, 3)">
                        <AlertTriangle class="mr-2 size-4 text-orange-500" /> Suspend
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="user.Status !== 2" @click="updateStatus(user, 2)">
                        <Ban class="mr-2 size-4 text-destructive" /> Ban
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <!-- Role Updates -->
                      <DropdownMenuItem v-if="user.Role === 0" @click="updateRole(user, 1000)">
                        <Shield class="mr-2 size-4 text-brand-blue" /> Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="user.Role === 1000" @click="updateRole(user, 0)">
                        <Shield class="mr-2 size-4 text-muted-foreground" /> Revoke Admin
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:bg-destructive focus:text-white" @click="openDeleteConfirm(user)">
                        <Trash2 class="mr-2 size-4" /> Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
      <div class="text-sm text-muted-foreground">
        {{ t('common.total') }}: <span class="text-foreground font-medium">{{ totalRecords }}</span>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center text-sm font-medium">
          {{ t('admin.currentPage') }} {{ currentPage }} / {{ totalPages }}
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="icon" class="size-8" :disabled="currentPage === 1" @click="currentPage = 1">
            <ChevronsLeft class="size-4" />
          </Button>
          <Button variant="outline" size="icon" class="size-8" :disabled="currentPage === 1" @click="currentPage--">
            <ChevronLeft class="size-4" />
          </Button>
          <Button variant="outline" size="icon" class="size-8" :disabled="currentPage >= totalPages" @click="currentPage++">
            <ChevronRight class="size-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Delete Alert -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.deleteConfirm') }}</AlertDialogTitle>
          <AlertDialogDescription>
            Account <strong>{{ userToDelete?.AccountName }}</strong> will be permanently removed.
            All profile data, projects and settings will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-destructive hover:bg-destructive/90 text-white">
            {{ t('common.remove') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  </div>
</template>
