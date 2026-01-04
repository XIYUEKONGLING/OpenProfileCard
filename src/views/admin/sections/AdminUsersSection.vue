<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import {
  type UserAdminDto,
  type PagedResponse,
  AccountStatus,
  AccountRole,
  AccountType
} from '@/api/types';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2, MoreHorizontal, Search, Shield, Ban, Trash2, CheckCircle, AlertTriangle } from 'lucide-vue-next';

const { t } = useI18n();
const ui = useUIStore();

// State
const users = ref<UserAdminDto[]>([]);
const totalRecords = ref(0);
const page = ref(1);
const pageSize = ref(10);
const search = ref('');
const statusFilter = ref<string>('all');
const isLoading = ref(false);

// Action State
const actionLoading = ref<string | null>(null);
const showDeleteDialog = ref(false);
const userToDelete = ref<UserAdminDto | null>(null);

// Fetch Data
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const query = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString(),
    });

    if (search.value) query.append('Search', search.value);
    if (statusFilter.value !== 'all') query.append('Status', statusFilter.value);

    const response = await httpClient<PagedResponse<UserAdminDto>>(`/admin/users?${query.toString()}`);
    users.value = response.Data || [];
    totalRecords.value = response.TotalRecords;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Actions
const updateUserStatus = async (user: UserAdminDto, status: AccountStatus) => {
  actionLoading.value = user.Id;
  try {
    await httpClient(`/admin/users/${user.Id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ Status: status })
    });
    user.Status = status;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
  }
};

const updateUserRole = async (user: UserAdminDto, role: AccountRole) => {
  actionLoading.value = user.Id;
  try {
    await httpClient(`/admin/users/${user.Id}/role`, {
      method: 'POST',
      body: JSON.stringify({ Role: role })
    });
    user.Role = role;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
  }
};

const confirmDelete = (user: UserAdminDto) => {
  userToDelete.value = user;
  showDeleteDialog.value = true;
};

const executeDelete = async () => {
  if (!userToDelete.value) return;
  try {
    await httpClient(`/admin/users/${userToDelete.value.Id}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    showDeleteDialog.value = false;
    fetchUsers();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

// Watchers
watch([page, pageSize, statusFilter], fetchUsers);

// Helpers
const getStatusBadge = (status: AccountStatus) => {
  switch (status) {
    case AccountStatus.Active: return 'default'; // black/white
    case AccountStatus.Banned: return 'destructive'; // red
    case AccountStatus.Suspended: return 'secondary'; // orange-ish usually handled by class
    case AccountStatus.PendingDeletion: return 'outline';
    default: return 'outline';
  }
};

const getStatusLabel = (status: AccountStatus) => {
  return Object.keys(AccountStatus).find(key => AccountStatus[key as keyof typeof AccountStatus] === status) || 'Unknown';
};

const getTypeLabel = (type: AccountType) => {
  return Object.keys(AccountType).find(key => AccountType[key as keyof typeof AccountType] === type) || 'Unknown';
};

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-4 justify-between">
      <div class="flex gap-2 flex-1 max-w-sm">
        <div class="relative flex-1">
          <Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
              v-model="search"
              :placeholder="t('common.search') + '...'"
              class="pl-9"
              @keydown.enter="fetchUsers"
          />
        </div>
        <Button variant="secondary" @click="fetchUsers">
          <Search class="size-4" />
        </Button>
      </div>

      <div class="flex gap-2">
        <Select v-model="statusFilter">
          <SelectTrigger class="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="0">Active</SelectItem>
            <SelectItem value="2">Banned</SelectItem>
            <SelectItem value="3">Suspended</SelectItem>
            <SelectItem value="1">Pending Deletion</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="6" class="h-24 text-center">
              <Loader2 class="size-6 animate-spin mx-auto text-muted-foreground" />
            </TableCell>
          </TableRow>

          <TableRow v-else-if="users.length === 0">
            <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
              No users found.
            </TableCell>
          </TableRow>

          <TableRow v-for="user in users" :key="user.Id">
            <TableCell>
              <div class="flex flex-col">
                <span class="font-medium">{{ user.AccountName }}</span>
                <span class="text-xs text-muted-foreground">{{ user.Email }}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{{ getTypeLabel(user.Type) }}</Badge>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-1">
                <Shield v-if="user.Role === 1000 || user.Role === -1" class="size-3 text-brand-blue" />
                <span class="text-sm">{{ user.Role === -1 ? 'Root' : (user.Role === 1000 ? 'Admin' : 'User') }}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusBadge(user.Status)">
                {{ getStatusLabel(user.Status) }}
              </Badge>
            </TableCell>
            <TableCell class="text-xs text-muted-foreground">
              {{ new Date(user.CreatedAt).toLocaleDateString() }}
            </TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" :disabled="actionLoading === user.Id">
                    <Loader2 v-if="actionLoading === user.Id" class="size-4 animate-spin" />
                    <MoreHorizontal v-else class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <!-- Status Actions -->
                  <DropdownMenuItem v-if="user.Status !== AccountStatus.Active" @click="updateUserStatus(user, AccountStatus.Active)">
                    <CheckCircle class="size-4 mr-2 text-green-500" /> Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="user.Status !== AccountStatus.Suspended" @click="updateUserStatus(user, AccountStatus.Suspended)">
                    <AlertTriangle class="size-4 mr-2 text-orange-500" /> Suspend
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="user.Status !== AccountStatus.Banned" @click="updateUserStatus(user, AccountStatus.Banned)">
                    <Ban class="size-4 mr-2 text-destructive" /> Ban
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <!-- Role Actions -->
                  <DropdownMenuItem v-if="user.Role !== 1000" @click="updateUserRole(user, 1000)">
                    <Shield class="size-4 mr-2 text-brand-blue" /> Promote to Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="user.Role === 1000" @click="updateUserRole(user, 0)">
                    <Shield class="size-4 mr-2 text-muted-foreground" /> Demote to User
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDelete(user)">
                    <Trash2 class="size-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" :disabled="page === 1" @click="page--">Previous</Button>
      <span class="text-sm text-muted-foreground">Page {{ page }}</span>
      <Button variant="outline" size="sm" :disabled="users.length < pageSize" @click="page++">Next</Button>
    </div>

    <!-- Delete Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the account
            <strong>{{ userToDelete?.AccountName }}</strong> and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
