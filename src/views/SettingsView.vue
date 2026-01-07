<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import {
  AccountStatus,
  AccountType,
  type PersonalSettingsDto,
  type UpdatePersonalSettingsRequestDto,
  type AccountEmailDto,
  type AddEmailRequestDto,
  type VerifyEmailRequestDto,
  type ChangePasswordRequestDto,
  type BlockDto, VerificationType,
  Visibility
} from '@/api/types';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import AssetView from '@/components/ui/AssetView.vue';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import {
  Mail,
  Loader2,
  Trash2,
  Shield,
  Star,
  AlertTriangle,
  RotateCcw,
  Fingerprint,
  User,
  UserCircle,
  Activity,
  Calendar,
  Ban
} from 'lucide-vue-next';

const { t, locale } = useI18n();
const auth = useAuthStore();
const server = useServerStore();
const ui = useUIStore();

// --- State ---
const isLoading = ref(false);
const isSaving = ref(false);

// Settings State
const settings = ref<PersonalSettingsDto | null>(null);
const settingsForm = ref<UpdatePersonalSettingsRequestDto>({});

// Email State
const emails = ref<AccountEmailDto[]>([]);
const newEmail = ref('');
const showAddEmail = ref(false);
const verifyEmailId = ref<string | null>(null);
const verifyCode = ref('');

// Verification Code Timer State
const countdown = ref(0);
const isSendingCode = ref(false);

// Password State
const passwordForm = ref<ChangePasswordRequestDto>({
  OldPassword: '',
  NewPassword: ''
});
const confirmPassword = ref('');

// Modal State
const showDeleteModal = ref(false);
const deleteConfirmationInput = ref('');

// Blocked Users State
const blockedUsers = ref<BlockDto[]>([]);
const isLoadingBlocked = ref(false);
const showUnblockModal = ref(false);
const userToUnblock = ref<BlockDto | null>(null);

// --- Computed ---
const isPersonal = computed(() => auth.user?.Type === AccountType.Personal);
const isEmailServiceEnabled = computed(() => server.features?.Email === true);
const requiresVerification = computed(() => server.features?.Email && server.features?.EmailAddVerification === true);
const isPendingDeletion = computed(() => auth.user?.Status === AccountStatus.PendingDeletion);

const canDeleteAccount = computed(() => {
  const isSystemType = auth.user?.Type === AccountType.System;
  const isRootRole = auth.user?.Role === -1;

  return !isSystemType && !isRootRole;
});

// --- Helpers for Account Info ---

const getAccountTypeLabel = (type: AccountType) => {
  switch (type) {
    case AccountType.Personal: return t('common.accountTypePersonal');
    case AccountType.Organization: return t('common.accountTypeOrganization');
    case AccountType.Application: return t('common.accountTypeApplication');
    case AccountType.System: return t('common.accountTypeSystem');
    case AccountType.Service: return t('common.accountTypeService');
    default: return 'Unknown';
  }
};

const getStatusInfo = (status: AccountStatus) => {
  switch (status) {
    case AccountStatus.Active:
      return { label: t('common.statusActive'), color: 'text-green-600 bg-green-100 border-green-200' };
    case AccountStatus.PendingDeletion:
      return { label: t('common.statusPendingDeletion'), color: 'text-orange-500 bg-orange-50 border-orange-200' };
    case AccountStatus.Banned:
      return { label: t('common.statusBanned'), color: 'text-destructive bg-destructive/10 border-destructive/20' };
    case AccountStatus.Suspended:
      return { label: t('common.statusSuspended'), color: 'text-orange-500 bg-orange-50 border-orange-200' };
    case AccountStatus.Deactivated:
      return { label: t('common.statusDeactivated'), color: 'text-muted-foreground bg-muted border-border' };
    default:
      return { label: 'Unknown', color: 'text-muted-foreground' };
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// --- API Actions ---

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [settingsData, emailData] = await Promise.all([
      httpClient<PersonalSettingsDto>('/me/settings'),
      httpClient<AccountEmailDto[]>('/me/emails')
    ]);

    settings.value = settingsData;
    settingsForm.value = { ...settingsData };
    emails.value = emailData || [];

    // Ensure auth user status is up to date for Delete/Restore logic
    await auth.fetchMe();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// 1. Settings Update
const saveSettings = async () => {
  isSaving.value = true;
  try {
    await httpClient('/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(settingsForm.value)
    });
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

// 2. Email Management
const sendVerificationCode = async (email: string) => {
  if (countdown.value > 0) return;

  isSendingCode.value = true;
  try {
    await auth.sendCode({ Email: email, Type: VerificationType.VerifyEmail });
    ui.notify(t('auth.codeSent'), 'success');
    // Start 60 second countdown
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSendingCode.value = false;
  }
};

const addEmail = async () => {
  if (!newEmail.value) return;

  try {
    // Logic: Verification Required vs Direct Add
    if (requiresVerification.value) {
      if (!verifyCode.value) {
        await sendVerificationCode(newEmail.value);
        return;
      }
    }

    const payload: AddEmailRequestDto = {
      Email: newEmail.value,
      Code: verifyCode.value || 'skipped'
    };

    await httpClient('/me/emails', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    ui.notify(t('common.success'), 'success');
    newEmail.value = '';
    verifyCode.value = '';
    countdown.value = 0;
    showAddEmail.value = false;
    emails.value = await httpClient<AccountEmailDto[]>('/me/emails');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const deleteEmail = async (email: string) => {
  if (!confirm('Are you sure?')) return; // Could use custom modal here too, but simple confirm is often acceptable for lists
  try {
    await httpClient(`/me/emails/${email}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    emails.value = emails.value.filter(e => e.Email !== email);
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const setPrimaryEmail = async (email: string) => {
  try {
    await httpClient(`/me/emails/${email}/primary`, { method: 'POST' });
    ui.notify(t('common.success'), 'success');
    emails.value = await httpClient<AccountEmailDto[]>('/me/emails');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const verifyExistingEmail = async (email: string) => {
  if (requiresVerification.value && !verifyCode.value) {
    await sendVerificationCode(email);
    return;
  }

  const payload: VerifyEmailRequestDto = {
    Code: verifyCode.value || 'skipped'
  };

  await httpClient(`/me/emails/${email}/verify`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  ui.notify(t('common.success'), 'success');
  verifyEmailId.value = null;
  verifyCode.value = '';
  emails.value = await httpClient<AccountEmailDto[]>('/me/emails');
};

// 3. Password Change
const changePassword = async () => {
  if (passwordForm.value.NewPassword !== confirmPassword.value) {
    ui.notify(t('auth.passwordMismatch'), 'error');
    return;
  }
  isSaving.value = true;
  try {
    await httpClient('/me/password', {
      method: 'POST',
      body: JSON.stringify(passwordForm.value)
    });
    ui.notify(t('settings.passwordChangedLogout'), 'success');

    // Force Logout
    auth.logout();
    window.location.reload();
    // window.location.href = '/login?reason=secure';
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

// 4. Account Lifecycle (Delete / Restore)
const requestDeleteAccount = async () => {
  if (deleteConfirmationInput.value !== auth.user?.AccountName) {
    ui.notify('Account name mismatch', 'error');
    return;
  }
  try {
    await httpClient('/me', { method: 'DELETE' });
    ui.notify(t('settings.accountDeleted'), 'warning');
    showDeleteModal.value = false;
    auth.logout();
    window.location.reload();
    // window.location.href = '/login?reason=deleted';
  } catch(e: any) {
    ui.notify(e.message, 'error');
  }
};

const restoreAccount = async () => {
  try {
    await httpClient('/me/restore', { method: 'POST' });
    ui.notify(t('settings.accountRestored'), 'success');
    await auth.fetchMe(); // Refresh status
    // Possibly reload to clear global blockers if they exist in DashboardView
  } catch(e: any) {
    ui.notify(e.message, 'error');
  }
};

// 5. Blocked Users Management
const fetchBlockedUsers = async () => {
  isLoadingBlocked.value = true;
  try {
    blockedUsers.value = await httpClient<BlockDto[]>('/me/blocks');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoadingBlocked.value = false;
  }
};

const unblockUser = async () => {
  if (!userToUnblock.value) return;
  try {
    await httpClient(`/profiles/${userToUnblock.value.AccountName}/block`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    blockedUsers.value = blockedUsers.value.filter(u => u.AccountName !== userToUnblock.value!.AccountName);
    showUnblockModal.value = false;
    userToUnblock.value = null;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const confirmUnblock = (user: BlockDto) => {
  userToUnblock.value = user;
  showUnblockModal.value = true;
};

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchData();
    fetchBlockedUsers();
  }
});
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-10">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-black tracking-tight">{{ t('common.settings') }}</h1>
      <p class="text-muted-foreground">{{ t('settings.subtitle') }}</p>
    </div>

    <Tabs default-value="account" class="w-full">
      <!-- Fixed Layout: grid-cols-3 for 3 tabs -->
      <TabsList class="grid w-full grid-cols-3 lg:w-125">
        <TabsTrigger value="account">{{ t('settings.account') }}</TabsTrigger>
        <TabsTrigger value="preferences">{{ t('settings.preferences') }}</TabsTrigger>
        <TabsTrigger value="blocked">{{ t('settings.blockedUsers') }}</TabsTrigger>
      </TabsList>

      <!-- TAB: ACCOUNT -->
      <TabsContent value="account" class="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">

        <!-- Account Info Card (NEW) -->
        <Card v-if="auth.user">
          <CardHeader>
            <CardTitle class="text-base">{{ t('settings.accountInfo') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- ID -->
            <div class="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <Fingerprint class="size-4" />
                <span>{{ t('settings.accountId') }}</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                {{ auth.user.Id }}
              </div>
            </div>

            <!-- Name -->
            <div class="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <User class="size-4" />
                <span>{{ t('settings.accountName') }}</span>
              </div>
              <div class="font-medium text-sm">{{ auth.user.AccountName }}</div>
            </div>

            <!-- Type -->
            <div class="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <UserCircle class="size-4" />
                <span>{{ t('settings.accountType') }}</span>
              </div>
              <Badge variant="outline" class="text-[10px]">{{ getAccountTypeLabel(auth.user.Type) }}</Badge>
            </div>

            <!-- Status -->
            <div class="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <Activity class="size-4" />
                <span>{{ t('settings.accountStatus') }}</span>
              </div>
              <Badge :class="['text-[10px]', getStatusInfo(auth.user.Status).color]">
                {{ getStatusInfo(auth.user.Status).label }}
              </Badge>
            </div>

            <!-- Created At -->
            <div class="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar class="size-4" />
                <span>{{ t('settings.createdAt') }}</span>
              </div>
              <div class="text-sm font-medium">{{ formatDate(auth.user.CreatedAt) }}</div>
            </div>
          </CardContent>
        </Card>

        <!-- Emails -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('settings.emailManagement') }}</CardTitle>
            <CardDescription>{{ t('settings.emailDesc') }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="email in emails" :key="email.Id" class="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2 font-medium">
                  <Mail class="size-4 text-muted-foreground" />
                  {{ email.Email }}
                </div>
                <div class="flex gap-2">
                  <Badge v-if="email.IsPrimary" variant="default" class="text-[10px]">{{ t('settings.primary') }}</Badge>
                  <Badge v-if="email.IsVerified" variant="secondary" class="text-[10px] text-green-600 bg-green-500/10">{{ t('settings.verified') }}</Badge>
                  <Badge v-else variant="outline" class="text-[10px] text-orange-500 border-orange-200">{{ t('settings.unverified') }}</Badge>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <!-- Verify Action -->
                <div v-if="!email.IsVerified && isEmailServiceEnabled" class="flex items-center gap-1">
                  <template v-if="requiresVerification">
                    <Input
                        v-if="verifyEmailId === email.Id"
                        v-model="verifyCode"
                        class="w-24 h-8 text-xs"
                        placeholder="Code"
                    />
                    <Button
                        v-if="verifyEmailId === email.Id"
                        size="sm"
                        variant="default"
                        class="h-8"
                        @click="verifyExistingEmail(email.Email)"
                    >
                      {{ t('common.save') }}
                    </Button>
                    <Button
                        v-else
                        size="icon"
                        variant="ghost"
                        class="size-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        @click="() => { verifyEmailId = email.Id; verifyCode = ''; }"
                        :title="t('settings.verifyEmail')"
                    >
                      <Shield class="size-4" />
                    </Button>
                  </template>
                </div>

                <!-- Set Primary -->
                <Button
                    v-if="!email.IsPrimary && email.IsVerified"
                    size="icon"
                    variant="ghost"
                    @click="setPrimaryEmail(email.Email)"
                    :title="t('settings.setPrimary')"
                >
                  <Star class="size-4" />
                </Button>

                <!-- Delete -->
                <Button
                    v-if="!email.IsPrimary"
                    size="icon"
                    variant="ghost"
                    class="text-destructive hover:bg-destructive/10"
                    @click="deleteEmail(email.Email)"
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>

            <!-- Add Email Form -->
            <div v-if="showAddEmail" class="p-4 bg-muted/30 rounded-lg border border-dashed flex flex-col gap-3 animate-in fade-in zoom-in-95">
              <div class="space-y-1">
                <Label>{{ t('settings.addEmailLabel') }}</Label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <Input v-model="newEmail" placeholder="name@example.com" class="flex-1" />

                  <!-- Show Code Input only if Verification is Required -->
                  <template v-if="requiresVerification">
                    <Input
                        v-if="verifyCode || newEmail"
                        v-model="verifyCode"
                        :placeholder="t('auth.codePlaceholder')"
                        class="sm:w-32 lg:w-48"
                    />
                    <Button
                        @click="addEmail"
                        :disabled="isSendingCode || (countdown > 0 && !verifyCode)"
                    >
                      <template v-if="isSendingCode">
                        <Loader2 class="mr-2 size-4 animate-spin" />
                        {{ t('common.sending') }}
                      </template>
                      <template v-else-if="countdown > 0 && !verifyCode">
                        {{ countdown }}s
                      </template>
                      <template v-else-if="verifyCode">
                        {{ t('common.save') }}
                      </template>
                      <template v-else>
                        {{ t('auth.sendCode') }}
                      </template>
                    </Button>
                  </template>

                  <Button v-else @click="addEmail">
                    {{ t('common.add') }}
                  </Button>
                </div>
                <p v-if="requiresVerification" class="text-[10px] text-muted-foreground">{{ t('settings.addEmailNote') }}</p>
              </div>
            </div>

            <Button v-else variant="outline" class="w-full border-dashed" @click="showAddEmail = true">
              + {{ t('settings.addEmail') }}
            </Button>

          </CardContent>
        </Card>

        <!-- Change Password -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('auth.resetPassword') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 max-w-md">
            <div class="space-y-2">
              <Label>{{ t('settings.oldPassword') }}</Label>
              <Input v-model="passwordForm.OldPassword" type="password" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('settings.newPassword') }}</Label>
              <Input v-model="passwordForm.NewPassword" type="password" />
            </div>
            <div class="space-y-2">
              <Label>{{ t('auth.confirmPassword') }}</Label>
              <Input v-model="confirmPassword" type="password" />
            </div>
          </CardContent>
          <CardFooter class="border-t bg-muted/20 px-6 py-4">
            <Button @click="changePassword" :disabled="isSaving" variant="secondary">
              {{ t('common.save') }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Danger Zone (Delete / Restore) -->
        <Card v-if="canDeleteAccount" class="border-destructive/30 overflow-hidden">
          <CardHeader
              :class="[
                isPendingDeletion ? 'bg-orange-500/10' : 'bg-destructive/10', 
                'py-6' 
              ]"
          >
            <CardTitle class="flex items-center gap-2" :class="isPendingDeletion ? 'text-orange-500' : 'text-destructive'">
              <AlertTriangle class="size-5" />
              {{ t('settings.dangerZone') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">

            <!-- Restore Logic -->
            <div v-if="isPendingDeletion" class="flex items-center justify-between">
              <div>
                <h4 class="font-bold">{{ t('settings.accountPendingDeletion') }}</h4>
                <p class="text-sm text-muted-foreground mb-4">{{ t('dashboard.accountPendingDeletionDesc') }}</p>
              </div>
              <Button variant="default" @click="restoreAccount" class="font-bold gap-2">
                <RotateCcw class="size-4" />
                {{ t('dashboard.restoreAccount') }}
              </Button>
            </div>

            <!-- Delete Logic -->
            <div v-else>
              <p class="text-sm text-muted-foreground mb-4">{{ t('settings.deleteAccountDesc') }}</p>
              <Button variant="destructive" @click="showDeleteModal = true">{{ t('settings.deleteAccount') }}</Button>
            </div>

          </CardContent>
        </Card>
      </TabsContent>

      <!-- TAB: PREFERENCES -->
      <TabsContent value="preferences" class="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('settings.privacy') }}</CardTitle>
            <CardDescription>{{ t('settings.privacyDesc') }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">

            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-base">{{ t('settings.allowFollowers') }}</Label>
                <p class="text-sm text-muted-foreground">{{ t('settings.allowFollowersDesc') }}</p>
              </div>
              <input type="checkbox" v-model="settingsForm.AllowFollowers" class="size-5 accent-brand-blue" />
            </div>
            <Separator />

            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-base">{{ t('settings.showFollowers') }}</Label>
                <p class="text-sm text-muted-foreground">{{ t('settings.showFollowersDesc') }}</p>
              </div>
              <input type="checkbox" v-model="settingsForm.ShowFollowersList" class="size-5 accent-brand-blue" />
            </div>
            <Separator />

            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-base">{{ t('settings.showFollowing') }}</Label>
                <p class="text-sm text-muted-foreground">{{ t('settings.showFollowingDesc') }}</p>
              </div>
              <input type="checkbox" v-model="settingsForm.ShowFollowingList" class="size-5 accent-brand-blue" />
            </div>

            <Separator />

            <!-- Visibility Settings (Selects) -->
            <div class="space-y-4">
              <div class="space-y-2">
                <Label>{{ t('common.visibility') }}</Label>
                <Select v-model.number="settingsForm.Visibility">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="Visibility.Public">{{ t('common.public') }}</SelectItem>
                    <SelectItem :value="Visibility.Private">{{ t('common.private') }}</SelectItem>
                    <SelectItem :value="Visibility.Protected">{{ t('common.protected') }}</SelectItem>
                    <SelectItem :value="Visibility.MembersOnly">{{ t('common.membersOnly') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>{{ t('settings.defaultVisibility') }}</Label>
                <Select v-model.number="settingsForm.DefaultVisibility">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="Visibility.Public">{{ t('common.public') }}</SelectItem>
                    <SelectItem :value="Visibility.Private">{{ t('common.private') }}</SelectItem>
                    <SelectItem :value="Visibility.Protected">{{ t('common.protected') }}</SelectItem>
                    <SelectItem :value="Visibility.MembersOnly">{{ t('common.membersOnly') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <template v-if="isPersonal">
              <Separator />
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-base">{{ t('settings.showLocalTime') }}</Label>
                  <p class="text-sm text-muted-foreground">{{ t('settings.showLocalTimeDesc') }}</p>
                </div>
                <input type="checkbox" v-model="settingsForm.ShowLocalTime" class="size-5 accent-brand-blue" />
              </div>
            </template>

          </CardContent>
          <CardFooter class="border-t bg-muted/20 px-6 py-4">
            <Button @click="saveSettings" :disabled="isSaving" class="font-bold">
              <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
              {{ t('common.save') }}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <!-- TAB: BLOCKED USERS -->
      <TabsContent value="blocked" class="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Ban class="size-5 text-destructive" />
              {{ t('settings.blockedUsers') }}
            </CardTitle>
            <CardDescription>{{ t('settings.blockedUsersDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="isLoadingBlocked" class="flex justify-center py-8">
              <Loader2 class="size-6 animate-spin text-muted-foreground" />
            </div>

            <div v-else-if="blockedUsers.length === 0" class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              <Ban class="size-8 mx-auto mb-2 opacity-20" />
              <p>{{ t('settings.noBlockedUsers') }}</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="user in blockedUsers" :key="user.AccountId" class="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="size-10 rounded-full bg-muted border overflow-hidden shrink-0">
                    <AssetView :asset="(user as any).Avatar" :fallback-name="user.DisplayName" class-name="w-full h-full" />
                  </div>
                  <div>
                    <div class="font-bold">{{ user.DisplayName }}</div>
                    <div class="text-xs text-muted-foreground">@{{ user.AccountName }}</div>
                    <div class="text-[10px] text-muted-foreground mt-1">
                      {{ t('settings.blockedAt') }}: {{ formatDate(user.BlockedAt) }}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" @click="confirmUnblock(user)">
                  {{ t('social.unblock') }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>

    <!-- Custom Modal Implementation (Teleport to Body) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="w-full max-w-md bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-4 text-destructive">
                <div class="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle class="size-5" />
                </div>
                <div>
                  <h3 class="font-bold text-lg text-foreground">{{ t('settings.deleteModalTitle') }}</h3>
                  <p class="text-xs text-destructive font-bold uppercase tracking-wide">{{ t('settings.dangerZone') }}</p>
                </div>
              </div>

              <p class="text-sm text-muted-foreground mb-4">
                {{ t('settings.deleteModalDesc') }}
              </p>

              <div class="space-y-2">
                <Label>
                  {{ t('settings.deleteConfirmLabel', { name: auth.user?.AccountName ?? '' }) }}
                </Label>
                <Input v-model="deleteConfirmationInput" :placeholder="auth.user?.AccountName" class="border-destructive/50 focus:border-destructive" />
              </div>
            </div>
            <div class="bg-muted/50 p-4 flex justify-end gap-3 border-t border-border">
              <Button variant="ghost" @click="showDeleteModal = false">{{ t('common.cancel') }}</Button>
              <Button variant="destructive" @click="requestDeleteAccount" :disabled="deleteConfirmationInput !== auth.user?.AccountName">
                {{ t('settings.deleteAccount') }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Unblock Confirmation Modal -->
    <AlertDialog v-model:open="showUnblockModal">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('social.unblock') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('social.unblockConfirm', { name: userToUnblock?.DisplayName || '' }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="unblockUser" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ t('social.unblock') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
