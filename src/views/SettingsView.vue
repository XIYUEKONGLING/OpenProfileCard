<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import { useUIStore } from '@/stores/ui';
import { httpClient } from '@/api/client';
import {
  type ProfileDto,
  type UpdateProfileRequestDto,
  type PersonalSettingsDto,
  type UpdatePersonalSettingsRequestDto,
  type AccountEmailDto,
  type AddEmailRequestDto,
  type VerifyEmailRequestDto,
  type ChangePasswordRequestDto
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

// Icons
import {
  Mail,
  Loader2,
  Trash2,
  Shield,
  Star,
  AlertTriangle,
  Globe,
  Calendar,
  Briefcase
} from 'lucide-vue-next';

const { t } = useI18n();
const auth = useAuthStore();
const server = useServerStore(); // Use Server Store
const ui = useUIStore();

// --- State ---
const isLoading = ref(false);
const isSaving = ref(false);

// Profile State
const profile = ref<ProfileDto | null>(null);

// Initialize with safe default for Avatar to prevent v-model errors
const profileForm = ref<UpdateProfileRequestDto>({
  Avatar: { Type: 'Image', Value: '' }
});

// Settings State
const settings = ref<PersonalSettingsDto | null>(null);
const settingsForm = ref<UpdatePersonalSettingsRequestDto>({});

// Email State
const emails = ref<AccountEmailDto[]>([]);
const newEmail = ref('');
const showAddEmail = ref(false);
const verifyEmailId = ref<string | null>(null);
const verifyCode = ref('');

// Password State
const passwordForm = ref<ChangePasswordRequestDto>({
  OldPassword: '',
  NewPassword: ''
});
const confirmPassword = ref('');

// --- Computed ---
const isPersonal = computed(() => auth.user?.Type === 'Personal');

// Check server feature flags for email verification
const isEmailServiceEnabled = computed(() => server.features?.Email === true);
const requiresVerification = computed(() => server.features?.EmailVerification === true);

// --- API Actions ---

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [profileData, settingsData, emailData] = await Promise.all([
      httpClient<ProfileDto>('/me/profile'),
      httpClient<PersonalSettingsDto>('/me/settings'),
      httpClient<AccountEmailDto[]>('/me/emails')
    ]);

    profile.value = profileData;

    // Map profile to form with safe Avatar fallback
    profileForm.value = {
      DisplayName: profileData.DisplayName,
      Description: profileData.Description,
      Content: profileData.Content,
      Location: profileData.Location,
      Website: profileData.Website,
      JobTitle: profileData.JobTitle,
      CurrentCompany: profileData.CurrentCompany,
      Pronouns: profileData.Pronouns,
      Birthday: profileData.Birthday,
      Avatar: profileData.Avatar || { Type: 'Image', Value: '' }
    };

    settings.value = settingsData;
    settingsForm.value = { ...settingsData };

    emails.value = emailData || [];
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// 1. Profile Update
const saveProfile = async () => {
  isSaving.value = true;
  try {
    // Ensure Avatar type is set if user entered a URL
    if (profileForm.value.Avatar?.Value && !profileForm.value.Avatar.Type) {
      profileForm.value.Avatar.Type = 'Remote';
    }

    await httpClient('/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileForm.value)
    });
    ui.notify(t('common.success'), 'success');
    await auth.fetchMe();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

// 2. Settings Update
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

// 3. Email Management
const addEmail = async () => {
  if (!newEmail.value) return;

  try {
    // Logic Branch: Verification Required vs Direct Add
    if (requiresVerification.value) {
      // Step 1: Send Code if not yet entered
      if (!verifyCode.value) {
        await auth.sendCode({ Email: newEmail.value, Type: 'VerifyEmail' });
        ui.notify(t('auth.codeSent'), 'success');
        return; // Stop here, wait for user to enter code
      }
    }

    // Step 2: Submit (With code if required, or empty/dummy code if not)
    const payload: AddEmailRequestDto = {
      Email: newEmail.value,
      Code: verifyCode.value || 'skipped' // Backend should handle bypass if feature disabled
    };

    await httpClient('/me/emails', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    ui.notify(t('common.success'), 'success');

    // Reset State
    newEmail.value = '';
    verifyCode.value = '';
    showAddEmail.value = false;

    // Refresh list
    emails.value = await httpClient<AccountEmailDto[]>('/me/emails');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const deleteEmail = async (email: string) => {
  if (!confirm('Are you sure?')) return;
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
  // Only fetch code if verification is actually enabled/required
  if (requiresVerification.value && !verifyCode.value) {
    await auth.sendCode({ Email: email, Type: 'VerifyEmail' });
    ui.notify(t('auth.codeSent'), 'success');
    return;
  }

  // If verification is disabled, we might send an empty code to endpoint 
  // depending on backend implementation, but usually /verify endpoint implies verification is needed.
  // If feature is off, maybe this button shouldn't even be clickable or it just auto-verifies?
  // Assuming standard flow:

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

// 4. Password Change
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
    ui.notify(t('auth.resetPasswordSuccess'), 'success');
    passwordForm.value = { OldPassword: '', NewPassword: '' };
    confirmPassword.value = '';
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

// 5. Account Deletion
const deleteAccount = async () => {
  const confirmation = prompt(t('settings.deleteConfirmPrompt'));
  if (confirmation === auth.user?.AccountName) {
    try {
      await httpClient('/me', { method: 'DELETE' });
      ui.notify(t('settings.accountDeleted'), 'warning');
      await auth.logout();
      window.location.reload();
    } catch(e: any) {
      ui.notify(e.message, 'error');
    }
  } else {
    ui.notify('Account name does not match.', 'error');
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchData();
  }
});
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-10">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-black tracking-tight">{{ t('common.settings') }}</h1>
      <p class="text-muted-foreground">{{ t('settings.subtitle') }}</p>
    </div>

    <Tabs default-value="profile" class="w-full">
      <TabsList class="grid w-full grid-cols-3 lg:w-100">
        <TabsTrigger value="profile">{{ t('settings.profile') }}</TabsTrigger>
        <TabsTrigger value="account">{{ t('settings.account') }}</TabsTrigger>
        <TabsTrigger value="preferences">{{ t('settings.preferences') }}</TabsTrigger>
      </TabsList>

      <!-- TAB: PROFILE -->
      <TabsContent value="profile" class="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('settings.publicProfile') }}</CardTitle>
            <CardDescription>{{ t('settings.publicProfileDesc') }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">

            <!-- Avatar -->
            <div class="flex items-center gap-6">
              <div class="size-20 rounded-full bg-muted border border-border overflow-hidden shrink-0">
                <!-- Use optional chaining safely via profileForm state -->
                <AssetView
                    :asset="profileForm.Avatar"
                    :fallback-name="profileForm.DisplayName"
                    class-name="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 space-y-2">
                <Label>{{ t('settings.avatarUrl') }}</Label>
                <!-- Safe v-model binding: profileForm.Avatar is guaranteed by init -->
                <Input
                    v-if="profileForm.Avatar"
                    v-model="profileForm.Avatar.Value"
                    placeholder="https://..."
                    @input="profileForm.Avatar!.Type = 'Remote'"
                />
                <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Currently supporting remote URLs only
                </p>
              </div>
            </div>

            <Separator />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <Label>{{ t('settings.displayName') }}</Label>
                <Input v-model="profileForm.DisplayName" />
              </div>
              <div class="space-y-2">
                <Label>{{ t('settings.location') }}</Label>
                <div class="relative">
                  <Globe class="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input v-model="profileForm.Location" class="pl-9" />
                </div>
              </div>

              <!-- Personal Specifics -->
              <template v-if="isPersonal">
                <div class="space-y-2">
                  <Label>{{ t('settings.pronouns') }}</Label>
                  <Input v-model="profileForm.Pronouns" placeholder="he/him" />
                </div>
                <div class="space-y-2">
                  <Label>{{ t('settings.birthday') }}</Label>
                  <div class="relative">
                    <Calendar class="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input v-model="profileForm.Birthday" type="date" class="pl-9" />
                  </div>
                </div>
              </template>

              <div class="space-y-2">
                <Label>{{ t('settings.jobTitle') }}</Label>
                <div class="relative">
                  <Briefcase class="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input v-model="profileForm.JobTitle" class="pl-9" />
                </div>
              </div>
              <div class="space-y-2">
                <Label>{{ t('settings.company') }}</Label>
                <Input v-model="profileForm.CurrentCompany" />
              </div>
            </div>

            <div class="space-y-2">
              <Label>{{ t('settings.bio') }}</Label>
              <textarea
                  v-model="profileForm.Description"
                  class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows="3"
              ></textarea>
            </div>

            <div class="space-y-2">
              <Label>{{ t('settings.website') }}</Label>
              <Input v-model="profileForm.Website" placeholder="https://" />
            </div>

          </CardContent>
          <CardFooter class="border-t bg-muted/20 px-6 py-4">
            <Button @click="saveProfile" :disabled="isSaving" class="font-bold">
              <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
              {{ t('common.save') }}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <!-- TAB: ACCOUNT -->
      <TabsContent value="account" class="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">

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
                <div class="flex gap-2">
                  <Input v-model="newEmail" placeholder="name@example.com" class="flex-1" />

                  <!-- Show Code Input only if Verification is Required -->
                  <Input
                      v-if="requiresVerification && (verifyCode || newEmail)"
                      v-model="verifyCode"
                      placeholder="Code"
                      class="w-24"
                  />

                  <Button @click="addEmail">
                    <!-- Button Label Logic -->
                    <template v-if="requiresVerification">
                      {{ verifyCode ? t('common.save') : t('auth.sendCode') }}
                    </template>
                    <template v-else>
                      {{ t('common.add') }}
                    </template>
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

        <!-- Danger Zone -->
        <Card class="border-destructive/30">
          <CardHeader>
            <CardTitle class="text-destructive flex items-center gap-2">
              <AlertTriangle class="size-5" />
              {{ t('settings.dangerZone') }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground mb-4">{{ t('settings.deleteAccountDesc') }}</p>
            <Button variant="destructive" @click="deleteAccount">{{ t('settings.deleteAccount') }}</Button>
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
    </Tabs>
  </div>
</template>
