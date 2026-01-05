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
  AccountType,
  type AccountEmailDto,
  type AddEmailRequestDto,
  type AdminUpdateEmailRequestDto,
  type AdminResetPasswordRequestDto, AccountRole, NotificationType, type CreateNotificationRequestDto,
  type CreateUserRequestDto
} from '@/api/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import {
  Loader2, Search, Shield, Ban, Trash2, CheckCircle,
  AlertTriangle, MoreHorizontal, Filter, ChevronDown, Mail, Key,
  ChevronLeft, ChevronsLeft, ChevronRight, RotateCcw, UserCircle,
  Plus, X, Bell, UserPlus,
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
const searchInput = ref('');
const activeSearch = ref('');
const isLoading = ref(false);

const filterStatus = ref<number[]>([]);
const filterRole = ref<number[]>([]);
const filterType = ref<number[]>([]);

const actionLoadingId = ref<string | null>(null);
const showDeleteDialog = ref(false);
const userToDelete = ref<UserAdminDto | null>(null);

const accountTypeValues = Object.values(AccountType).filter((v) => typeof v === 'number');

const selectedUser = ref<UserAdminDto | null>(null);

// Email Management State
const showEmailModal = ref(false);
const userEmails = ref<AccountEmailDto[]>([]);
const isEmailsLoading = ref(false);
const newEmailAddress = ref('');
const isAddingEmail = ref(false);

// Reset Password State
const showResetPasswordModal = ref(false);
const resetPasswordData = ref({
  newPassword: '',
  confirmPassword: ''
});
const isResettingPassword = ref(false);

// Notification State
const showNotificationModal = ref(false);
const notificationForm = ref<CreateNotificationRequestDto>({
  Title: '',
  Body: '',
  Type: NotificationType.Administrator, // Default to Admin
  Url: ''
});
const isSendingNotification = ref(false);

// Create User State
const showCreateUserModal = ref(false);
const isCreatingUser = ref(false);

const createUserForm = ref<CreateUserRequestDto>({
  AccountName: '',
  Email: '',
  Password: '',
  Type: AccountType.Personal,
  Role: AccountRole.User,
  DisplayName: ''
});

// --- Mappings ---
const getStatusLabel = (s: number): string => {
  const map: Record<number, string> = {
    [AccountStatus.Active]: t('admin.statusActive'),
    [AccountStatus.PendingDeletion]: t('admin.statusPendingDeletion'),
    [AccountStatus.Banned]: t('admin.statusBanned'),
    [AccountStatus.Suspended]: t('admin.statusSuspended'),
    [AccountStatus.Deactivated]: t('admin.statusDeactivated'),
  };
  return map[s] || 'Unknown';
};

const getRoleLabel = (r: number): string => {
  if (r === AccountRole.Root) return t('admin.roleRoot');
  if (r === AccountRole.Admin) return t('admin.roleAdmin');
  return t('admin.roleUser');
};

const getTypeLabel = (type: number): string => {
  const map: Record<number, string> = {
    [AccountType.Personal]: t('admin.typePersonal'),
    [AccountType.Organization]: t('admin.typeOrganization'),
    [AccountType.Application]: t('admin.typeApplication'),
    [AccountType.System]: t('admin.typeSystem'),
    [AccountType.Service]: t('admin.typeService'),
  };
  return map[type] || 'Unknown';
};

const getStatusVariant = (s: number): "default" | "destructive" | "secondary" | "outline" => {
  if (s === AccountStatus.Active) return 'default';
  if (s === AccountStatus.Banned || s === AccountStatus.PendingDeletion) return 'destructive';
  return 'secondary';
};

// --- API Logic ---
const fetchUsers = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
    });

    if (activeSearch.value) params.append('Search', activeSearch.value);

    // Append multiple filters
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

const handleSearch = (): void => {
  activeSearch.value = searchInput.value;
  currentPage.value = 1;
  fetchUsers();
};

const resetFilters = (): void => {
  filterStatus.value = [];
  filterRole.value = [];
  filterType.value = [];
  searchInput.value = '';
  activeSearch.value = '';
  currentPage.value = 1;
  fetchUsers();
};



// --- API Logic: Emails ---

const fetchUserEmails = async (userId: string): Promise<void> => {
  isEmailsLoading.value = true;
  try {
    userEmails.value = await httpClient<AccountEmailDto[]>(`/admin/users/${userId}/emails`);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isEmailsLoading.value = false;
  }
};

const openEmailModal = (user: UserAdminDto): void => {
  selectedUser.value = user;
  showEmailModal.value = true;
  fetchUserEmails(user.Id);
};

const handleAddEmail = async (): Promise<void> => {
  if (!selectedUser.value || !newEmailAddress.value) return;
  isAddingEmail.value = true;
  try {
    const payload: AddEmailRequestDto = {
      Email: newEmailAddress.value,
    };
    await httpClient(`/admin/users/${selectedUser.value.Id}/emails`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    ui.notify(t('admin.emailAdded'), 'success');
    newEmailAddress.value = '';
    fetchUserEmails(selectedUser.value.Id);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isAddingEmail.value = false;
  }
};

const handleUpdateEmailStatus = async (email: string, updates: AdminUpdateEmailRequestDto): Promise<void> => {
  if (!selectedUser.value) return;
  try {
    await httpClient(`/admin/users/${selectedUser.value.Id}/emails/${email}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    ui.notify(t('admin.emailUpdated'), 'success');
    fetchUserEmails(selectedUser.value.Id);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const handleDeleteEmail = async (email: string): Promise<void> => {
  if (!selectedUser.value) return;
  try {
    await httpClient(`/admin/users/${selectedUser.value.Id}/emails/${email}`, {
      method: 'DELETE'
    });
    ui.notify(t('admin.emailDeleted'), 'success');
    fetchUserEmails(selectedUser.value.Id);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

// --- API Logic: Password ---

const openResetPasswordModal = (user: UserAdminDto): void => {
  selectedUser.value = user;
  resetPasswordData.value = { newPassword: '', confirmPassword: '' };
  showResetPasswordModal.value = true;
};

const handleResetPassword = async (): Promise<void> => {
  if (!selectedUser.value) return;
  if (resetPasswordData.value.newPassword !== resetPasswordData.value.confirmPassword) {
    ui.notify(t('admin.passwordMismatch'), 'error');
    return;
  }

  isResettingPassword.value = true;
  try {
    const payload: AdminResetPasswordRequestDto = {
      NewPassword: resetPasswordData.value.newPassword
    };
    await httpClient(`/admin/users/${selectedUser.value.Id}/password/reset`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    ui.notify(t('admin.resetPasswordSuccess'), 'success');
    showResetPasswordModal.value = false;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isResettingPassword.value = false;
  }
};

// --- API Logic: Send Notification ---
const openNotificationModal = (user: UserAdminDto): void => {
  selectedUser.value = user;
  // Reset form
  notificationForm.value = {
    Title: '',
    Body: '',
    Type: NotificationType.Administrator,
    Url: ''
  };
  showNotificationModal.value = true;
};

const handleSendNotification = async (): Promise<void> => {
  if (!selectedUser.value) return;

  // Basic Validation
  if (!notificationForm.value.Title || !notificationForm.value.Body) {
    ui.notify(t('common.requiredFields'), 'error');
    return;
  }

  isSendingNotification.value = true;
  try {
    await httpClient(`/admin/users/${selectedUser.value.Id}/notifications`, {
      method: 'POST',
      body: JSON.stringify(notificationForm.value)
    });
    ui.notify(t('admin.notificationSent'), 'success');
    showNotificationModal.value = false;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSendingNotification.value = false;
  }
};

// --- API Logic: Create User ---

const openCreateUserModal = (): void => {
  // Reset form to defaults
  createUserForm.value = {
    AccountName: '',
    Email: '',
    Password: '',
    Type: AccountType.Personal,
    Role: AccountRole.User,
    DisplayName: ''
  };
  showCreateUserModal.value = true;
};

const handleCreateUser = async (): Promise<void> => {
  // Basic Validation
  if (!createUserForm.value.AccountName || !createUserForm.value.Email || !createUserForm.value.Password) {
    ui.notify(t('common.requiredFields'), 'error');
    return;
  }

  isCreatingUser.value = true;
  try {
    await httpClient<UserAdminDto>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(createUserForm.value)
    });

    ui.notify(t('admin.createUserSuccess'), 'success');
    showCreateUserModal.value = false;
    fetchUsers(); // Refresh list
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isCreatingUser.value = false;
  }
};



// Helper for Select options
const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.System: return t('admin.notificationTypeSystem');
    case NotificationType.Administrator: return t('admin.notificationTypeAdmin');
    case NotificationType.Security: return t('admin.notificationTypeSecurity');
    case NotificationType.Interaction: return t('admin.notificationTypeInteraction');
    default: return String(type);
  }
};


const toggleFilter = (target: 'status' | 'role' | 'type', val: number): void => {
  currentPage.value = 1;
  if (target === 'status') {
    const arr = [...filterStatus.value];
    const idx = arr.indexOf(val);
    if (idx > -1) arr.splice(idx, 1); else arr.push(val);
    filterStatus.value = arr;
  } else if (target === 'role') {
    const arr = [...filterRole.value];
    const idx = arr.indexOf(val);
    if (idx > -1) arr.splice(idx, 1); else arr.push(val);
    filterRole.value = arr;
  } else if (target === 'type') {
    const arr = [...filterType.value];
    const idx = arr.indexOf(val);
    if (idx > -1) arr.splice(idx, 1); else arr.push(val);
    filterType.value = arr;
  }
};

const isAnyFilterActive = computed(() => {
  return filterStatus.value.length > 0 ||
      filterRole.value.length > 0 ||
      filterType.value.length > 0 ||
      activeSearch.value.length > 0;
});

// Watch for changes to trigger fetch
watch([currentPage, filterStatus, filterRole, filterType], () => {
  fetchUsers();
}, { deep: true });

// --- Admin Actions ---
const canDelete = (user: UserAdminDto): boolean => auth.user?.Id !== user.Id;

const updateStatus = async (user: UserAdminDto, newStatus: number): Promise<void> => {
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

const updateRole = async (user: UserAdminDto, newRole: number): Promise<void> => {
  actionLoadingId.value = user.Id;
  try {
    await httpClient(`/admin/users/${user.Id}/role`, {
      method: 'POST',
      body: JSON.stringify({ Role: newRole })
    });
    user.Role = newRole as any;
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const canManageRoles = (targetUser: UserAdminDto): boolean => {
  return auth.isRoot && targetUser.Role !== AccountRole.Root;
};

const confirmDelete = async (): Promise<void> => {
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
  <div class="space-y-6 fade-in-animation">
    <!-- Action Bar -->
    <div class="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

      <!-- Left: Search Input Group -->
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
        <Button variant="default" class="font-bold h-10 px-6 shadow-sm" @click="handleSearch">
          {{ t('common.search') }}
        </Button>
      </div>

      <!-- Right: Filters & Reset -->
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

        <!-- CREATE USER BUTTON -->
        <Button variant="default" size="sm" class="h-9" @click="openCreateUserModal">
          <UserPlus class="size-4 mr-2" />
          {{ t('admin.createUser') }}
        </Button>

        <!-- Filters (Status, Role, Type) -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 border-dashed">
              <Filter class="size-4 mr-2" />
              {{ t('admin.statusFilter') }}
              <Badge v-if="filterStatus.length" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterStatus.length }}</Badge>
              <ChevronDown class="size-4 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="end">
            <div class="grid gap-1">
              <div
                  v-for="s in [0, 3, 2, 1, 4]" :key="s"
                  class="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  @click="toggleFilter('status', s)"
              >
                <Checkbox :checked="filterStatus.includes(s)" :modelValue="filterStatus.includes(s)" />
                <span class="text-sm font-medium leading-none">{{ getStatusLabel(s) }}</span>
              </div>
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
          <PopoverContent class="w-48 p-2" align="end">
            <div class="grid gap-1">
              <div
                  v-for="r in [AccountRole.Root, AccountRole.Admin, AccountRole.User]" :key="r"
                  class="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  @click="toggleFilter('role', r)"
              >
                <Checkbox :checked="filterRole.includes(r)" :modelValue="filterRole.includes(r)" />
                <span class="text-sm font-medium leading-none">{{ getRoleLabel(r) }}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Type Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-9 border-dashed">
              <UserCircle class="size-4 mr-2" />
              {{ t('admin.typeFilter') }}
              <Badge v-if="filterType.length" variant="secondary" class="ml-2 rounded-sm px-1 font-normal">{{ filterType.length }}</Badge>
              <ChevronDown class="size-4 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-2" align="end">
            <div class="grid gap-1">
              <div
                  v-for="ty in accountTypeValues" :key="ty"
                  class="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  @click="toggleFilter('type', ty)"
              >
                <Checkbox :checked="filterType.includes(ty)" :modelValue="filterType.includes(ty)" />
                <span class="text-sm font-medium leading-none">{{ getTypeLabel(ty) }}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <!-- User Table -->
    <div class="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden relative min-h-145">

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
            <TableHead class="w-65 font-black uppercase text-xs tracking-widest">{{ t('common.username') }}</TableHead>
            <TableHead class="font-black uppercase text-xs tracking-widest">{{ t('admin.typeFilter') }}</TableHead>
            <TableHead class="font-black uppercase text-xs tracking-widest">{{ t('admin.roleFilter') }}</TableHead>
            <TableHead class="font-black uppercase text-xs tracking-widest">{{ t('admin.statusFilter') }}</TableHead>
            <TableHead class="text-right font-black uppercase text-xs tracking-widest">{{ t('common.manage') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="relative">
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
                      <AlertTriangle class="mr-2 size-4 text-orange-500" /> {{ t('admin.actionsSuspend') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="user.Status !== 2" @click="updateStatus(user, 2)">
                      <Ban class="mr-2 size-4 text-destructive" /> {{ t('admin.actionsBan') }}
                    </DropdownMenuItem>

                    <template v-if="canManageRoles(user)">
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel class="text-xs opacity-50 uppercase tracking-tighter"> {{ t('admin.permissionControl') }} </DropdownMenuLabel>

                      <DropdownMenuItem
                          v-if="user.Role === AccountRole.User"
                          @click="updateRole(user, AccountRole.Admin)"
                      >
                        <Shield class="mr-2 size-4 text-brand-blue" /> {{ t('admin.actionsPromote') }}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                          v-if="user.Role === AccountRole.Admin"
                          @click="updateRole(user, AccountRole.User)"
                      >
                        <UserCircle class="mr-2 size-4 text-muted-foreground" /> {{ t('admin.actionsDemote') }}
                      </DropdownMenuItem>
                    </template>

                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem @click="openEmailModal(user)">
                      <Mail class="mr-2 size-4" /> {{ t('admin.manageEmails') }}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem @click="openResetPasswordModal(user)">
                      <Key class="mr-2 size-4" /> {{ t('admin.resetPassword') }}
                    </DropdownMenuItem>

                    <DropdownMenuItem @click="openNotificationModal(user)">
                      <Bell class="mr-2 size-4" /> {{ t('admin.sendNotification') }}
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
            <TableCell colspan="5" class="h-100 text-center">
              <div class="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Search class="size-10 opacity-20" />
                <p class="text-sm font-bold italic">{{ t('admin.accountFilterNoMatching') }}</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
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

    <!-- Modal: Email Management -->
    <Dialog v-model:open="showEmailModal">
      <DialogContent class="sm:max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle class="text-xl font-black flex items-center gap-2">
            <Mail class="size-5 text-brand-blue" />
            {{selectedUser?.AccountName ? t('admin.emailsFor', { name: selectedUser?.AccountName }) : t('admin.manageEmails') }}
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Add Email Form -->
          <div class="flex items-end gap-2">
            <div class="flex-1 space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('common.email') }}</Label>
              <Input
                  v-model="newEmailAddress"
                  placeholder="example@domain.com"
                  class="h-10"
                  @keyup.enter="handleAddEmail"
              />
            </div>
            <Button :disabled="isAddingEmail" @click="handleAddEmail" class="h-10 font-bold">
              <Plus v-if="!isAddingEmail" class="size-4 mr-1" />
              <Loader2 v-else class="size-4 animate-spin mr-1" />
              {{ t('common.add') }}
            </Button>
          </div>

          <!-- Email List -->
          <div class="rounded-xl border bg-muted/30 overflow-hidden">
            <Table>
              <TableBody>
                <TableRow v-if="isEmailsLoading">
                  <TableCell colspan="3" class="h-32 text-center">
                    <Loader2 class="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
                <TableRow v-else v-for="email in userEmails" :key="email.Id" class="group">
                  <TableCell>
                    <div class="flex flex-col">
                      <span class="font-bold text-sm">{{ email.Email }}</span>
                      <span class="text-[10px] text-muted-foreground">{{ new Date(email.CreatedAt).toLocaleDateString() }}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-4">
                      <div class="flex items-center gap-1.5">
                        <Switch
                            :model-value="email.IsVerified"
                            @update:model-value="(v: boolean) => handleUpdateEmailStatus(email.Email, { IsVerified: v })"
                        />
                        <span class="text-xs font-medium">{{ t('admin.isVerified') }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <Switch
                            :model-value="email.IsPrimary"
                            @update:model-value="(v: boolean) => handleUpdateEmailStatus(email.Email, { IsPrimary: v })"
                        />
                        <span class="text-xs font-medium">{{ t('admin.isPrimary') }}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button
                        variant="ghost"
                        size="icon"
                        class="size-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        @click="handleDeleteEmail(email.Email)"
                    >
                      <X class="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal: Reset Password -->
    <Dialog v-model:open="showResetPasswordModal">
      <DialogContent class="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle class="text-xl font-black flex items-center gap-2">
            <Key class="size-5 text-brand-blue" />
            {{ t('admin.resetPassword') }}
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="p-3 bg-muted/50 rounded-xl border text-sm font-medium">
            {{ t('common.account') }}: <span class="font-black">{{ selectedUser?.AccountName }}</span>
          </div>

          <div class="space-y-3">
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.newPassword') }}</Label>
              <Input v-model="resetPasswordData.newPassword" type="password" class="h-10" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.confirmPassword') }}</Label>
              <Input v-model="resetPasswordData.confirmPassword" type="password" class="h-10" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showResetPasswordModal = false" class="font-bold rounded-xl">
            {{ t('common.cancel') }}
          </Button>
          <Button
              :disabled="isResettingPassword || !resetPasswordData.newPassword"
              @click="handleResetPassword"
              class="font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90"
          >
            <Loader2 v-if="isResettingPassword" class="size-4 animate-spin mr-2" />
            {{ t('admin.resetPassword') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal: Send Notification -->
    <Dialog v-model:open="showNotificationModal">
      <DialogContent class="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle class="text-xl font-black flex items-center gap-2">
            <Bell class="size-5 text-brand-blue" />
            {{ t('admin.sendNotification') }}
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="p-3 bg-muted/50 rounded-xl border text-sm font-medium">
            {{ t('common.account') }}: <span class="font-black">{{ selectedUser?.AccountName }}</span>
          </div>

          <div class="space-y-3">
            <!-- Title -->
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.notificationTitle') }}</Label>
              <Input
                  v-model="notificationForm.Title"
                  :placeholder="t('admin.notificationTitle')"
                  class="h-10"
              />
            </div>

            <!-- Type -->
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.notificationType') }}</Label>
              <Select v-model="notificationForm.Type">
                <SelectTrigger class="h-10">
                  <SelectValue :placeholder="t('admin.notificationType')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NotificationType.System">
                    {{ getNotificationTypeLabel(NotificationType.System) }}
                  </SelectItem>
                  <SelectItem :value="NotificationType.Administrator">
                    {{ getNotificationTypeLabel(NotificationType.Administrator) }}
                  </SelectItem>
                  <SelectItem :value="NotificationType.Security">
                    {{ getNotificationTypeLabel(NotificationType.Security) }}
                  </SelectItem>
                  <SelectItem :value="NotificationType.Interaction">
                    {{ getNotificationTypeLabel(NotificationType.Interaction) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- URL -->
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.notificationUrl') }}</Label>
              <Input
                  v-model="notificationForm.Url"
                  :placeholder="'https://...'"
                  class="h-10"
              />
            </div>

            <!-- Body -->
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.notificationBody') }}</Label>
              <Textarea
                  v-model="notificationForm.Body"
                  :placeholder="t('admin.notificationBody')"
                  class="min-h-25 resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showNotificationModal = false" class="font-bold rounded-xl">
            {{ t('common.cancel') }}
          </Button>
          <Button
              :disabled="isSendingNotification"
              @click="handleSendNotification"
              class="font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90"
          >
            <Loader2 v-if="isSendingNotification" class="size-4 animate-spin mr-2" />
            {{ t('common.send') }} <!-- Assuming 'send' exists in common, otherwise use 'save' or add key -->
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal: Create User -->
    <Dialog v-model:open="showCreateUserModal">
      <DialogContent class="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle class="text-xl font-black flex items-center gap-2">
            <UserPlus class="size-5 text-brand-blue" />
            {{ t('admin.createUserTitle') }}
          </DialogTitle>
          <p class="text-sm text-muted-foreground font-medium">
            {{ t('admin.createUserDesc') }}
          </p>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <!-- Account Name -->
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.accountNameLabel') }}</Label>
            <Input
                v-model="createUserForm.AccountName"
                placeholder="username"
                class="h-10"
            />
          </div>

          <!-- Display Name -->
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.displayNameLabel') }}</Label>
            <Input
                v-model="createUserForm.DisplayName"
                :placeholder="t('profile.displayName')"
                class="h-10"
            />
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('common.email') }}</Label>
            <Input
                v-model="createUserForm.Email"
                type="email"
                placeholder="user@example.com"
                class="h-10"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('common.password') }}</Label>
            <Input
                v-model="createUserForm.Password"
                type="password"
                placeholder="••••••••"
                class="h-10"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Type -->
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.typeLabel') }}</Label>
              <Select v-model="createUserForm.Type">
                <SelectTrigger class="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="AccountType.Personal">
                    {{ t('admin.typePersonal') }}
                  </SelectItem>
                  <SelectItem :value="AccountType.Organization">
                    {{ t('admin.typeOrganization') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Role -->
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider opacity-60">{{ t('admin.roleLabel') }}</Label>
              <Select v-model="createUserForm.Role">
                <SelectTrigger class="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="AccountRole.User">
                    {{ t('admin.roleUser') }}
                  </SelectItem>
                  <!-- Only allow creating Admins if current user is Root (Optional Logic, keeping simple for now) -->
                  <SelectItem :value="AccountRole.Admin">
                    {{ t('admin.roleAdmin') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreateUserModal = false" class="font-bold rounded-xl">
            {{ t('common.cancel') }}
          </Button>
          <Button
              :disabled="isCreatingUser"
              @click="handleCreateUser"
              class="font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90"
          >
            <Loader2 v-if="isCreatingUser" class="size-4 animate-spin mr-2" />
            {{ t('common.create') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


    <!-- Physical Delete Confirmation -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent class="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-xl font-black">{{ t('common.deleteConfirm') }}</AlertDialogTitle>
          <AlertDialogDescription class="font-medium">
            {{ t('admin.deleteModalDesc') }}
            <div class="mt-4 p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive text-sm font-bold">
              {{ t('common.account') }}: {{ userToDelete?.AccountName }} {{ userToDelete?.Email ? "(" + userToDelete?.Email + ")" : "" }}
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
.fade-in-animation {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

.list-move {
  transition: transform 0.4s ease;
}

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
