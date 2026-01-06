<script setup lang="ts">
import {ref, computed, watch, onUnmounted} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import { useUIStore } from '@/stores/ui';
import { renderMarkdown } from '@/lib/markdown';
import {
  type ProfileDto,
  type ProjectDto,
  type OrganizationMemberDto,
  type FollowStatusDto,
  type AssetDto,
  type WorkExperienceDto,
  type EducationExperienceDto,
  type GalleryItemDto,
  type SponsorshipItemDto,
  type CertificateDto,
  type ContactMethodDto,
  type SocialLinkDto,
  type FollowerDto,
  type PublicOrganizationMembershipDto,
  type AccountCreatedDateDto,
  AccountType,
  AssetType, type ProfilePrivacyDto, AccountStatus, Visibility
} from '@/api/types';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import ImageViewer from '@/components/ui/ImageViewer.vue';
import UserListDialog from '@/components/dashboard/UserListDialog.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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

// Icons
import {
  MapPin, Link as LinkIcon, Building2, Calendar,
  MoreHorizontal, UserPlus, UserMinus, Ban, Cake,
  Briefcase, FolderGit2, Users, BookOpen, Heart, Lock, ChevronLeft, ChevronRight, Landmark,
  Image as ImageIcon, GraduationCap, Key, Mail, Download, Copy, Check, User, Clock, ShieldCheck, Shield, AlertTriangle,
  Trash2
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const auth = useAuthStore();
const server = useServerStore();
const ui = useUIStore();

// --- State ---
const isLoading = ref(true);
const notFound = ref(false);
const profile = ref<ProfileDto | null>(null);
const followStatus = ref<FollowStatusDto | null>(null);
const actionLoading = ref(false);
const createdDate = ref<AccountCreatedDateDto | null>(null);

const privacy = ref<ProfilePrivacyDto | null>(null);

// Counts (Calculated from lists)
const followersCount = ref(0);
const followingCount = ref(0);

// Sub-resources
const projects = ref<ProjectDto[]>([]);
const members = ref<OrganizationMemberDto[]>([]);
const memberships = ref<PublicOrganizationMembershipDto[]>([]);
const work = ref<WorkExperienceDto[]>([]);
const education = ref<EducationExperienceDto[]>([]);
const gallery = ref<GalleryItemDto[]>([]);
const sponsorships = ref<SponsorshipItemDto[]>([]);
const certificates = ref<CertificateDto[]>([]);
const contacts = ref<ContactMethodDto[]>([]);
const socials = ref<SocialLinkDto[]>([]);

// UI State
const showImageViewer = ref(false);
const selectedImage = ref<AssetDto | null>(null);
const showBlockDialog = ref(false);
const showUserList = ref(false);
const userListType = ref<'followers' | 'following'>('followers');
const copiedId = ref<string | null>(null);

// --- Computed ---
const isOrg = computed(() => profile.value?.Type === AccountType.Organization);
const isPersonal = computed(() => profile.value?.Type === AccountType.Personal);
const isSystem = computed(() => profile.value?.Type === AccountType.System);
const isMe = computed(() => (auth.user && profile.value && auth.user.AccountName === profile.value.AccountName));
const isStatic = computed(() => server.info?.Static === true);
const renderedContent = computed(() => renderMarkdown(profile.value?.Content));

// Check if the profile is private (Visibility != Public)
const isPrivate = computed(() => profile.value?.Visibility !== Visibility.Public);

const joinDate = computed(() => {
  const dateStr = createdDate.value?.CreatedDate;
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });
});

const timeZoneDisplay = computed(() => {
  const tz = profile.value?.TimeZone;
  if (!tz) return null;

  const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isSame = systemTz === tz;

  if (isSame) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz
    });
    return `${timeString} (${tz})`;
  }

  return tz;
});

const hasBackground = computed(() =>
    profile.value?.Background && profile.value.Background.Type !== AssetType.Empty
);

const isFollowersHidden = computed(() => privacy.value?.ShowFollowers === false); // !isMe.value &&
const isFollowingHidden = computed(() => privacy.value?.ShowFollowing === false); // !isMe.value &&

// Check if the account is restricted by system status (Banned, Suspended, etc.)
const isRestricted = computed(() => {
  const status = Number(profile.value?.Status ?? AccountStatus.Active);
  return status !== AccountStatus.Active;
});

const isContentMasked = computed(() => isRestricted.value || isPrivate.value);

// Unified mask configuration
const maskNotice = computed(() => {
  if (isRestricted.value) {
    // Existing System Status Logic
    const status = Number(profile.value?.Status ?? AccountStatus.Active);
    switch (status) {
      case AccountStatus.Banned:
        return {
          title: t('publicProfile.accountBanned'),
          desc: t('publicProfile.accountBannedDesc'),
          icon: Ban,
          color: 'text-destructive',
          blur: 'blur-md'
        };
      case AccountStatus.Suspended:
        return {
          title: t('publicProfile.accountSuspended'),
          desc: t('publicProfile.accountSuspendedDesc'),
          icon: AlertTriangle,
          color: 'text-orange-500',
          blur: 'blur-sm'
        };
      case AccountStatus.PendingDeletion:
        return {
          title: t('publicProfile.accountPendingDeletion'),
          desc: t('publicProfile.accountPendingDeletionDesc'),
          icon: Trash2,
          color: 'text-muted-foreground',
          blur: 'blur-md'
        };
      default:
        return null;
    }
  } else if (isPrivate.value) {
    // New Private Profile Logic
    return {
      title: t('publicProfile.privateProfile'),
      desc: t('publicProfile.privateProfileDesc'),
      icon: Lock,
      color: 'text-brand-blue',
      blur: 'blur-sm'
    };
  }
  return null;
});

// --- Members Pagination & Actions State ---
const membersPage = ref(1);
const membersPageSize = 10;
const followingIds = ref<Set<string>>(new Set());
const blockedIds = ref<Set<string>>(new Set());
const memberActionLoading = ref<Record<string, boolean>>({});

const paginatedMembers = computed(() => {
  const start = (membersPage.value - 1) * membersPageSize;
  return members.value.slice(start, start + membersPageSize);
});

const totalMembersPages = computed(() => Math.ceil(members.value.length / membersPageSize));

const isFollowingMember = (accountId: string) => followingIds.value.has(accountId);
const isBlockedMember = (accountId: string) => blockedIds.value.has(accountId);

const handleMemberFollow = async (member: OrganizationMemberDto) => {
  if (!auth.isAuthenticated || isStatic.value) return;
  const id = member.AccountId;
  const name = member.AccountName;
  memberActionLoading.value[name] = true;
  try {
    if (isFollowingMember(id)) {
      await httpClient(`/profiles/${name}/follow`, { method: 'DELETE' });
      followingIds.value.delete(id);
    } else {
      await httpClient(`/profiles/${name}/follow`, { method: 'POST' });
      followingIds.value.add(id);
    }
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    memberActionLoading.value[name] = false;
  }
};

const handleMemberBlock = async (member: OrganizationMemberDto) => {
  if (!auth.isAuthenticated || isStatic.value) return;
  const id = member.AccountId;
  const name = member.AccountName;
  memberActionLoading.value[name] = true;
  try {
    if (isBlockedMember(id)) {
      await httpClient(`/profiles/${name}/block`, { method: 'DELETE' });
      blockedIds.value.delete(id);
    } else {
      await httpClient(`/profiles/${name}/block`, { method: 'POST' });
      blockedIds.value.add(id);
      followingIds.value.delete(id);
    }
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    memberActionLoading.value[name] = false;
  }
};

// --- Lifecycle: Dynamic Title ---
watch(profile, (newProfile) => {
  if (newProfile && newProfile.DisplayName) {
    const siteName = server.meta?.SiteName || 'OpenProfile';
    document.title = `${newProfile.DisplayName} - ${siteName}`;
  }
}, { immediate: true });

// Reset title when leaving the profile view
const originalTitle = ref(document.title);
onUnmounted(() => {
  if (server.meta?.SiteName) {
    document.title = server.meta.SiteName;
  } else {
    document.title = originalTitle.value;
  }
});


// --- Actions ---

const fetchPublicData = async () => {
  const id = route.params.id as string;
  if (!id) return;

  isLoading.value = true;
  notFound.value = false;

  try {
    const profileData = await httpClient<ProfileDto>(`/profiles/${id}`);
    profile.value = profileData;

    const safeFetch = async <T>(url: string, fallback: T): Promise<T> => {
      try {
        return await httpClient<T>(url);
      } catch (e) {
        console.warn(`Optional resource fetch failed: ${url}`, e);
        return fallback;
      }
    };

    const promises: Promise<any>[] = [
      safeFetch<ProjectDto[]>(`/profiles/${id}/projects`, []).then(res => projects.value = res),
      safeFetch<GalleryItemDto[]>(`/profiles/${id}/gallery`, []).then(res => gallery.value = res),
      safeFetch<SponsorshipItemDto[]>(`/profiles/${id}/sponsorships`, []).then(res => sponsorships.value = res),
      safeFetch<ContactMethodDto[]>(`/profiles/${id}/contacts`, []).then(res => contacts.value = res),
      safeFetch<SocialLinkDto[]>(`/profiles/${id}/socials`, []).then(res => socials.value = res),
      safeFetch<CertificateDto[]>(`/profiles/${id}/certificates`, []).then(res => certificates.value = res),
      safeFetch<FollowerDto[]>(`/profiles/${id}/followers`, []).then(res => followersCount.value = res.length),
      safeFetch<FollowerDto[]>(`/profiles/${id}/following`, []).then(res => followingCount.value = res.length),
      safeFetch<ProfilePrivacyDto>(`/profiles/${id}/privacy`, { ShowFollowers: true, ShowFollowing: true } as ProfilePrivacyDto).then(res => privacy.value = res),
      safeFetch<PublicOrganizationMembershipDto[]>(`/profiles/${id}/memberships`, []).then(res => memberships.value = res),
      safeFetch<AccountCreatedDateDto>(`/profiles/${id}/created-at`, null as unknown as AccountCreatedDateDto).then(res => createdDate.value = res),
    ];

    // Fetch current user's following list to populate followingIds for member follow buttons
    if (auth.isAuthenticated && !isStatic.value) {
      promises.push(
        safeFetch<FollowerDto[]>(`/me/following`, [])
          .then(res => {
            followingIds.value = new Set(res.map(f => f.AccountId));
          })
      );
    }

    if (profileData.Type === AccountType.Organization) {
      promises.push(safeFetch<OrganizationMemberDto[]>(`/profiles/${id}/members`, []).then(res => members.value = res));
    } else if (profileData.Type === AccountType.Personal) {
      promises.push(
          safeFetch<WorkExperienceDto[]>(`/profiles/${id}/work`, []).then(res => work.value = res),
          safeFetch<EducationExperienceDto[]>(`/profiles/${id}/education`, []).then(res => education.value = res),
      );
    }
    if (auth.isAuthenticated && !isStatic.value && auth.user?.AccountName !== profileData.AccountName) {
      promises.push(
          safeFetch<FollowStatusDto | null>(`/profiles/${id}/follow`, null)
              .then(res => followStatus.value = res)
      );
    }

    await Promise.all(promises);

  } catch (e) {
    console.error("Main profile fetch failed:", e);
    notFound.value = true;
  } finally {
    isLoading.value = false;
  }
};


const handleFollow = async () => {
  if (!profile.value || isStatic.value) return;
  actionLoading.value = true;
  try {
    if (followStatus.value?.IsFollowing) {
      await httpClient(`/profiles/${profile.value.AccountName}/follow`, { method: 'DELETE' });
      if (followStatus.value) followStatus.value.IsFollowing = false;
      followersCount.value = Math.max(0, followersCount.value - 1);
    } else {
      await httpClient(`/profiles/${profile.value.AccountName}/follow`, { method: 'POST' });
      if (followStatus.value) followStatus.value.IsFollowing = true;
      followersCount.value++;
    }
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = false;
  }
};

const executeBlock = async () => {
  if (!profile.value || isStatic.value) return;
  try {
    await httpClient(`/profiles/${profile.value.AccountName}/block`, { method: 'POST' });
    ui.notify(t('common.success'), 'success');
    router.push('/');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    showBlockDialog.value = false;
  }
};

const openUserList = (type: 'followers' | 'following') => {
  userListType.value = type;
  showUserList.value = true;
};

const openImage = (asset?: AssetDto) => {
  if (asset && asset.Type !== AssetType.Empty) {
    selectedImage.value = asset;
    showImageViewer.value = true;
  }
};

const openUrl = (url?: string) => {
  if (url) window.open(url, '_blank');
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return t('common.present');
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const downloadCert = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/\s+/g, '_')}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const copyToClipboard = async (text: string, id: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    setTimeout(() => copiedId.value = null, 2000);
    ui.notify(t('common.copied'), 'success');
  } catch (e) {
    console.error(e);
  }
};

watch(() => route.params.id, fetchPublicData, { immediate: true });
</script>

<template>
  <div class="w-full pb-20 relative min-h-screen">
    <div class="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-150 bg-linear-to-b from-brand-blue/4 via-transparent to-transparent"></div>
      <div class="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-brand-purple/3 blur-[120px] rotate-[-5deg]"></div>
    </div>
    
    <ImageViewer v-model:open="showImageViewer" :asset="selectedImage" />

    <UserListDialog
        v-model:open="showUserList"
        :type="userListType"
        :account-name="profile?.AccountName"
        :is-me="isMe ?? false"
        :is-private="userListType === 'followers' ? isFollowersHidden : isFollowingHidden"
        @change="fetchPublicData"
    />

    <AlertDialog v-model:open="showBlockDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('publicProfile.blockConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('publicProfile.blockConfirmDesc', { name: profile?.DisplayName || 'User' }) }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="executeBlock" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">{{ t('publicProfile.block') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 404 State -->
    <div v-if="notFound" class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
      <div class="size-20 rounded-full bg-muted flex items-center justify-center">
        <Ban class="size-10 text-muted-foreground" />
      </div>
      <h1 class="text-2xl font-black">{{ t('publicProfile.notFound') }}</h1>
      <p class="text-muted-foreground">{{ t('publicProfile.notFoundDesc') }}</p>
      <Button @click="router.push('/')">{{ t('publicProfile.backHome') }}</Button>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="container max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div class="h-64 bg-muted rounded-3xl animate-pulse"></div>
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="space-y-4">
          <div class="size-32 rounded-full bg-muted animate-pulse border-4 border-background -mt-16"></div>
          <div class="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
        </div>
        <div class="lg:col-span-3 h-96 bg-muted rounded-xl animate-pulse"></div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="profile" class="animate-in fade-in duration-700">
      <!-- Hero Banner (z-0 to prevent overlaying avatar) -->
      <div v-if="hasBackground" class="h-48 md:h-80 w-full bg-muted overflow-hidden relative group z-0">
        <div v-if="hasBackground" class="h-full w-full">
          <div class="absolute inset-0 bg-linear-to-b from-transparent to-black/30 z-10 pointer-events-none"></div>
          <AssetView
              :asset="profile.Background"
              class-name="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
              @click="openImage(profile.Background)"
          />
        </div>
        <div v-else class="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/50">
          <ImageIcon class="size-12 text-muted-foreground/20" />
        </div>
      </div>

      <!-- Main Container (z-10 to be above banner) -->
      <div class="container max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <!-- LEFT COLUMN -->
          <div class="lg:col-span-4 xl:col-span-3 relative">
            <div
                :class="[
                  'lg:sticky lg:top-24 mb-8 space-y-6',
                  hasBackground ? '-mt-16 lg:-mt-20' : 'mt-8' 
                ]"
            >
              <!-- Avatar (z-20 to be above everything) -->
              <div class="relative group w-fit z-20">
                <div class="size-32 md:size-40 rounded-full border-[6px] border-background bg-background shadow-xl overflow-hidden cursor-pointer flex items-center justify-center" @click="openImage(profile.Avatar)">
                  <AssetView v-if="profile.Avatar && profile.Avatar.Type !== AssetType.Empty" :asset="profile.Avatar" :fallback-name="profile.DisplayName" class-name="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-muted flex items-center justify-center"><User class="size-16 text-muted-foreground/40" /></div>
                </div>
                <div v-if="isOrg" class="absolute bottom-2 right-2 bg-brand-purple text-white p-1.5 rounded-full border-4 border-background shadow-sm" title="Organization">
                  <Building2 class="size-4" />
                </div>
                <div v-if="isSystem" class="absolute bottom-2 right-2 bg-brand-blue text-white p-1.5 rounded-full border-4 border-background shadow-sm" title="Organization">
                  <Shield class="size-4" />
                </div>
                <div v-if="isRestricted" class="absolute top-2 right-2 bg-background rounded-full p-1.5 shadow-lg border border-border">
                  <component :is="maskNotice?.icon" class="size-5" :class="maskNotice?.color" />
                </div>
              </div>

              <!-- Identity -->
              <div class="space-y-1">
                <h1 class="text-3xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  {{ profile.DisplayName }}
                  <Badge v-if="profile.Pronouns" variant="secondary" class="text-xs font-normal">{{ profile.Pronouns }}</Badge>
                </h1>
                <p class="text-lg text-muted-foreground font-medium">@{{ profile.AccountName }}</p>
              </div>

              <div v-if="isRestricted" class="mt-6 p-4 rounded-2xl bg-muted/30 border border-dashed border-border text-center">
                <p class="text-xs font-bold uppercase tracking-widest" :class="maskNotice?.color">
                  {{ maskNotice?.title }}
                </p>
              </div>

              <template v-else>
                <!-- Bio -->
                <p v-if="profile.Description" class="text-base leading-relaxed text-foreground/80">{{ profile.Description }}</p>

                <!-- Actions -->
                <div v-if="!isStatic" class="flex flex-wrap gap-2">
                  <template v-if="auth.isAuthenticated && !isMe">
                    <Button :variant="followStatus?.IsFollowing ? 'outline' : 'default'" class="flex-1 font-bold rounded-full" :disabled="actionLoading" @click="handleFollow">
                      <UserMinus v-if="followStatus?.IsFollowing" class="size-4 mr-2" />
                      <UserPlus v-else class="size-4 mr-2" />
                      {{ followStatus?.IsFollowing ? t('publicProfile.unfollow') : t('publicProfile.follow') }}
                    </Button>
                    <DropdownMenu :modal="false">
                      <DropdownMenuTrigger as-child><Button variant="outline" size="icon" class="rounded-full"><MoreHorizontal class="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem class="text-destructive focus:text-destructive cursor-pointer" @click="showBlockDialog = true"><Ban class="size-4 mr-2" /> {{ t('publicProfile.block') }}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </template>
                  <Button v-else-if="isMe" variant="outline" class="w-full rounded-full font-bold" @click="router.push('/dashboard/profile/edit')">{{ t('common.edit') }}</Button>
                </div>

                <!-- Metadata -->
                <div class="space-y-3 text-sm text-muted-foreground pt-2">

                  <div v-if="isPersonal && profile.JobTitle" class="flex items-center gap-3">
                    <Briefcase class="size-4 shrink-0" />
                    <span class="text-foreground font-medium">{{ profile.JobTitle }}</span>
                  </div>

                  <div v-if="profile.CurrentCompany" class="flex items-center gap-3">
                    <Building2 class="size-4 shrink-0" />
                    <span class="text-foreground">{{ profile.CurrentCompany }}</span>
                  </div>

                  <div v-if="isPersonal && profile.CurrentSchool" class="flex items-center gap-3">
                    <GraduationCap class="size-4 shrink-0" />
                    <span class="text-foreground">{{ profile.CurrentSchool }}</span>
                  </div>

                  <div v-if="profile.Location" class="flex items-center gap-3">
                    <MapPin class="size-4 shrink-0" />
                    <span>{{ profile.Location }}</span>
                  </div>

                  <div v-if="timeZoneDisplay" class="flex items-center gap-3">
                    <Clock class="size-4 shrink-0 opacity-70" />
                    <span>{{ timeZoneDisplay }}</span>
                  </div>

                  <div v-if="isPersonal && profile.Birthday" class="flex items-center gap-3">
                    <Cake class="size-4 shrink-0 opacity-70" />
                    <span>{{ formatDate(profile.Birthday) }}</span>
                  </div>

                  <div v-if="isOrg && profile.FoundedDate" class="flex items-center gap-3">
                    <Landmark class="size-4 shrink-0 opacity-70" />
                    <span>{{ t('publicProfile.founded', { date: profile.FoundedDate }) }}</span>
                  </div>

                  <div v-if="profile.Website" class="flex items-center gap-3">
                    <LinkIcon class="size-4 shrink-0" />
                    <a :href="profile.Website" target="_blank" class="text-brand-blue hover:underline truncate">{{ profile.Website }}</a>
                  </div>

                  <div v-if="joinDate" class="flex items-center gap-3">
                    <Calendar class="size-4 shrink-0" />
                    <span>{{ t('publicProfile.joined', { date: joinDate }) }}</span>
                  </div>
                </div>

                <!-- Stats (Using calculated counts) -->
                <div class="flex items-center gap-6 text-sm pt-2 border-t border-border/50">
                  <button class="flex items-center gap-1 hover:text-foreground transition-colors" @click="openUserList('following')">
                    <template v-if="isFollowingHidden">
                      <Lock class="size-3 text-muted-foreground" />
                      <span class="text-muted-foreground">{{ t('publicProfile.following') }}</span>
                    </template>
                    <template v-else>
                      <span class="font-black text-foreground">{{ followingCount }}</span>
                      <span class="text-muted-foreground">{{ t('publicProfile.following') }}</span>
                    </template>
                  </button>

                  <button class="flex items-center gap-1 hover:text-foreground transition-colors" @click="openUserList('followers')">
                    <template v-if="isFollowersHidden">
                      <Lock class="size-3 text-muted-foreground" />
                      <span class="text-muted-foreground">{{ t('publicProfile.followers') }}</span>
                    </template>
                    <template v-else>
                      <span class="font-black text-foreground">{{ followersCount }}</span>
                      <span class="text-muted-foreground">{{ t('publicProfile.followers') }}</span>
                    </template>
                  </button>
                </div>

                <!-- Organizations -->
                <div v-if="memberships.length > 0" class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-bold text-sm">{{ t('dashboard.organizations') }}</h3>
                  </div>

                  <div v-if="memberships.length > 0" class="flex flex-wrap gap-2">
                    <router-link
                        v-for="membership in memberships"
                        :key="membership.OrganizationId"
                        :to="`/${membership.AccountName}`"
                        class="relative group"
                    >
                      <div class="size-10 rounded-lg bg-muted border border-border overflow-hidden transition-transform group-hover:scale-110 shadow-sm" :title="membership.DisplayName">
                        <AssetView :asset="membership.Avatar" :fallback-name="membership.DisplayName" class-name="w-full h-full" />
                      </div>
                    </router-link>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- RIGHT COLUMN -->
          <div class="lg:col-span-8 xl:col-span-9 pt-8 min-w-0 relative">
            <div v-if="isContentMasked" class="absolute inset-0 z-30 flex flex-col items-center justify-start pt-20 text-center px-6 pointer-events-none">
              <div class="glass-card p-16 rounded-3xl border-border/50 shadow-2xl max-w-md animate-in zoom-in-95 duration-300 pointer-events-auto">
                <div class="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <component :is="maskNotice?.icon" class="size-8" :class="maskNotice?.color" />
                </div>
                <h2 class="text-xl font-black mb-2">{{ maskNotice?.title }}</h2>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {{ maskNotice?.desc }}
                </p>
              </div>
            </div>

            <Tabs
                defaultValue="overview"
                class="w-full"
                :class="[isContentMasked ? 'filter blur-lg pointer-events-none select-none opacity-40' : '']"
            >
              <TabsList class="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none gap-6 mb-8 overflow-x-auto no-scrollbar">
                <TabsTrigger value="overview" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"><BookOpen class="size-4 mr-2" /> {{ t('publicProfile.about') }}</TabsTrigger>
                <TabsTrigger value="projects" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"><FolderGit2 class="size-4 mr-2" /> {{ t('publicProfile.projects') }} <Badge variant="secondary" class="ml-2">{{ projects.length }}</Badge></TabsTrigger>
                <TabsTrigger v-if="isOrg" value="members" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"><Users class="size-4 mr-2" /> {{ t('publicProfile.members') }} <Badge variant="secondary" class="ml-2">{{ members.length }}</Badge></TabsTrigger>
                <TabsTrigger v-if="isPersonal" value="experience" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"><Briefcase class="size-4 mr-2" /> {{ t('publicProfile.experience') }}</TabsTrigger>
                <TabsTrigger value="resources" class="rounded-md border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"><ImageIcon class="size-4 mr-2" /> {{ t('publicProfile.resources') }}</TabsTrigger>
              </TabsList>

              <!-- TAB: Overview -->
              <TabsContent value="overview" class="animate-in fade-in slide-in-from-bottom-2 space-y-10">
                <Card class="border-none shadow-none bg-transparent">
                  <CardContent class="p-0">
                    <div v-if="renderedContent" class="prose dark:prose-invert max-w-none prose-neutral prose-img:rounded-xl" v-html="renderedContent"></div>
                    <div v-else class="text-muted-foreground italic py-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center"><BookOpen class="size-8 mb-2 opacity-20" /> {{ t('publicProfile.noDescription') }}</div>
                  </CardContent>
                </Card>

                <!-- Social Links -->
                <div v-if="socials.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><LinkIcon class="size-5" /> {{ t('dashboard.socials') }}</h3>
                  <div class="flex flex-wrap gap-3">
                    <a v-for="social in socials" :key="social.Id" :href="social.Url" target="_blank" class="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card hover:bg-muted transition-colors group">
                      <AssetView :asset="social.Icon" class-name="size-5" />
                      <span class="font-bold text-sm">{{ social.Platform }}</span>
                    </a>
                  </div>
                </div>

                <!-- Contacts -->
                <div v-if="contacts.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Mail class="size-5" /> {{ t('publicProfile.contact') }}</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="c in contacts" :key="c.Id" class="flex items-center gap-3 p-3 rounded-xl border bg-card">
                      <div class="size-10 flex items-center justify-center rounded-lg bg-muted shrink-0">
                        <AssetView v-if="c.Icon && c.Icon.Type !== AssetType.Empty" :asset="c.Icon" class-name="size-5" />
                        <Mail v-else class="size-5" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold uppercase text-muted-foreground">{{ c.Label }}</div>
                        <div class="font-medium truncate select-all">{{ c.Value }}</div>
                      </div>
                      <div v-if="c.Image && c.Image.Type !== AssetType.Empty" class="size-10 bg-white p-0.5 rounded border shrink-0 cursor-pointer hover:scale-105 transition-transform" @click.stop="openImage(c.Image)">
                        <AssetView :asset="c.Image" class-name="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sponsorships -->
                <div v-if="sponsorships.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Heart class="size-5 text-pink-500" /> {{ t('publicProfile.sponsorships') }}</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card v-for="spon in sponsorships" :key="spon.Id" class="hover:border-pink-500/30 transition-colors cursor-pointer" @click="openUrl(spon.Url)">
                      <CardContent class="p-4 flex items-center gap-4">
                        <AssetView :asset="spon.Icon" class-name="size-10 rounded-lg" />
                        <div class="min-w-0 flex-1">
                          <div class="font-bold truncate">{{ spon.Platform }}</div>
                          <div class="text-xs text-muted-foreground truncate">{{ spon.Url }}</div>
                        </div>
                        <div v-if="spon.QrCode && spon.QrCode.Type !== AssetType.Empty" class="size-10 bg-white p-0.5 rounded shrink-0" @click.stop="openImage(spon.QrCode)">
                          <AssetView :asset="spon.QrCode" class-name="w-full h-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <!-- TAB: Projects -->
              <TabsContent value="projects" class="animate-in fade-in slide-in-from-bottom-2">
                <div v-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card v-for="proj in projects" :key="proj.Id" class="group hover:border-brand-blue/50 transition-colors cursor-pointer" @click="openUrl(proj.Url)">
                    <CardContent class="p-6 flex gap-4 items-start">
                      <div class="size-12 rounded-lg bg-muted border shrink-0 flex items-center justify-center overflow-hidden">
                        <AssetView v-if="proj.Logo && proj.Logo.Type !== AssetType.Empty" :asset="proj.Logo" :fallback-name="proj.Name" class-name="w-full h-full object-cover" />
                        <FolderGit2 v-else class="size-6 text-muted-foreground/40" />
                      </div>
                      <div class="flex-1 min-w-0"><h3 class="font-bold text-lg group-hover:text-brand-blue transition-colors truncate mb-1">{{ proj.Name }}</h3><p class="text-sm text-muted-foreground line-clamp-2">{{ proj.Summary }}</p></div>
                    </CardContent>
                  </Card>
                </div>
                <div v-else class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">{{ t('dashboard.noProjects') }}</div>
              </TabsContent>

              <!-- TAB: Experience -->
              <TabsContent v-if="isPersonal" value="experience" class="animate-in fade-in slide-in-from-bottom-2 space-y-10">
                <div v-if="work.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Briefcase class="size-5" /> {{ t('publicProfile.work') }}</h3>
                  <div class="relative pl-6 border-l-2 border-muted space-y-8">
                    <div v-for="job in work" :key="job.Id" class="relative">
                      <div class="absolute -left-7.25 top-1 size-3.5 rounded-full bg-background border-2 border-muted-foreground"></div>
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <div class="size-10 rounded-lg border bg-white dark:bg-black p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            <AssetView v-if="job.Logo && job.Logo.Type !== AssetType.Empty" :asset="job.Logo" :fallback-name="job.CompanyName" class-name="w-full h-full object-contain rounded-md" />
                            <Building2 v-else class="size-5 text-muted-foreground/40" />
                          </div>
                          <div><h4 class="font-bold text-base leading-none">{{ job.Position }}</h4><div class="text-sm font-medium text-foreground/70 mt-1">{{ job.CompanyName }}</div></div>
                        </div>
                        <span class="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md whitespace-nowrap self-start">{{ formatDate(job.StartDate) }} - {{ formatDate(job.EndDate) }}</span>
                      </div>
                      <p v-if="job.Description" class="text-sm text-muted-foreground mt-2 ml-13 whitespace-pre-wrap">{{ job.Description }}</p>
                    </div>
                  </div>
                </div>

                <div v-if="education.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap class="size-5" /> {{ t('publicProfile.education') }}</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card v-for="edu in education" :key="edu.Id" class="border-border/60">
                      <CardContent class="p-5 flex gap-4">
                        <div class="size-12 rounded-xl bg-white dark:bg-zinc-900 border flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                          <AssetView v-if="edu.Logo && edu.Logo.Type !== AssetType.Empty" :asset="edu.Logo" :fallback-name="edu.SchoolName" class-name="w-full h-full object-contain" />
                          <GraduationCap v-else class="size-6 text-muted-foreground/40" />
                        </div>
                        <div class="min-w-0 flex-1"><h4 class="font-bold truncate">{{ edu.SchoolName }}</h4><p class="text-sm font-medium text-foreground/70">{{ edu.Degree }}</p><p v-if="edu.Major" class="text-xs font-medium text-muted-foreground italic">{{ edu.Major }}</p><p class="text-xs text-muted-foreground mt-1">{{ formatDate(edu.StartDate) }} - {{ formatDate(edu.EndDate) }}</p></div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <!-- TAB: Members (Organization Only) -->
              <TabsContent v-if="isOrg" value="members" class="animate-in fade-in slide-in-from-bottom-2">
                <div v-if="members.length > 0" class="space-y-4">
                  <div class="flex flex-col divide-y border rounded-xl overflow-hidden bg-card">
                    <div
                        v-for="member in paginatedMembers"
                        :key="member.AccountId"
                        class="group flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        :class="{ 'opacity-60': isBlockedMember(member.AccountId) }"
                    >
                      <router-link :to="`/${member.AccountName}`" class="flex items-center gap-4 min-w-0 flex-1">
                        <div class="size-12 rounded-full bg-muted border overflow-hidden shrink-0 relative">
                          <AssetView :asset="member.Avatar" :fallback-name="member.DisplayName" class-name="w-full h-full object-cover" />
                          <div v-if="isBlockedMember(member.AccountId)" class="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <Ban class="size-5 text-destructive" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <div class="font-bold truncate group-hover:text-brand-purple transition-colors flex items-center gap-2">
                            {{ member.DisplayName }}
                            <Badge v-if="isBlockedMember(member.AccountId)" variant="destructive" class="text-[10px] h-4 px-1">已拉黑</Badge>
                            <Badge v-else-if="member.Title" variant="secondary" class="text-[10px] px-1.5 py-0 h-4 font-medium">{{ member.Title }}</Badge>
                          </div>
                          <div class="text-xs text-muted-foreground truncate">@{{ member.AccountName }}</div>
                        </div>
                      </router-link>
                      
                      <div v-if="auth.isAuthenticated && auth.user?.AccountName !== member.AccountName" class="flex items-center gap-2 ml-4">
                        <Button
                            v-if="!isBlockedMember(member.AccountId)"
                            size="sm"
                            :variant="isFollowingMember(member.AccountId) ? 'outline' : 'default'"
                            class="h-8 rounded-full px-3 text-xs"
                            :disabled="memberActionLoading[member.AccountName]"
                            @click.stop="handleMemberFollow(member)"
                        >
                          <component :is="isFollowingMember(member.AccountId) ? UserMinus : UserPlus" class="size-3 mr-1" />
                          {{ isFollowingMember(member.AccountId) ? t('profile.unfollow') : t('profile.follow') }}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger as-child>
                            <Button variant="ghost" size="icon" class="size-8 rounded-full"><MoreHorizontal class="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                class="cursor-pointer"
                                :class="isBlockedMember(member.AccountId) ? 'text-foreground' : 'text-destructive focus:text-destructive'"
                                @click="handleMemberBlock(member)"
                            >
                              <Ban class="size-4 mr-2" />
                              {{ isBlockedMember(member.AccountId) ? t('social.unblock') : t('social.block') }}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  <div v-if="totalMembersPages > 1" class="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="icon"
                        :disabled="membersPage === 1"
                        @click="membersPage--"
                        class="rounded-full size-8"
                    >
                      <ChevronLeft class="size-4" />
                    </Button>
                    <span class="text-xs font-medium w-12 text-center">{{ membersPage }} / {{ totalMembersPages }}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        :disabled="membersPage === totalMembersPages"
                        @click="membersPage++"
                        class="rounded-full size-8"
                    >
                      <ChevronRight class="size-4" />
                    </Button>
                  </div>
                </div>

                <div v-else class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <Users class="size-8 mx-auto mb-2 opacity-20" />
                  <p>{{ t('publicProfile.noMembers') }}</p>
                </div>
              </TabsContent>
              <!-- TAB: Resources -->
              <TabsContent value="resources" class="animate-in fade-in slide-in-from-bottom-2 space-y-10">
                <!-- Gallery -->
                <div v-if="gallery.length > 0">
                  <h3 class="font-bold text-lg mb-4">{{ t('publicProfile.gallery') }}</h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="item in gallery" :key="item.Id" class="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted cursor-pointer" @click="openImage(item.Image)">
                      <AssetView :asset="item.Image" class-name="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div v-if="item.Caption" class="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-bold truncate">{{ item.Caption }}</div>
                    </div>
                  </div>
                </div>

                <!-- Certificates (Optimized Info Display) -->
                <div v-if="certificates.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Key class="size-5" /> {{ t('publicProfile.certificates') }}</h3>
                  <div class="flex flex-col gap-3">
                    <Card v-for="cert in certificates" :key="cert.Id" class="border-border/60">
                      <CardContent class="p-5 space-y-6">
                        <div class="flex flex-col md:flex-row justify-between gap-4">
                          <div class="space-y-3 flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <h4 class="font-bold font-mono text-xl">{{ cert.Name }}</h4>
                              <Badge variant="outline" class="font-mono">{{ cert.Type }}</Badge>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground">
                              <div v-if="cert.Email" class="flex items-center gap-2"><Mail class="size-4" /> {{ cert.Email }}</div>
                              <div v-if="cert.CreatedAt" class="flex items-center gap-2"><Clock class="size-4" /> {{ t('resources.createdAt') }}: {{ formatDate(cert.CreatedAt) }}</div>
                              <div v-if="cert.ExpiresAt" class="flex items-center gap-2"><Calendar class="size-4" /> {{ t('resources.expiresAt') }}: {{ formatDate(cert.ExpiresAt) }}</div>
                            </div>
                          </div>
                          <!-- Actions: Copy & Download Content -->
                          <div v-if="cert.Content" class="flex flex-wrap gap-2 shrink-0 self-start">
                            <Button variant="outline" size="sm" @click="downloadCert(cert.Content, cert.Name)"><Download class="size-4 mr-2" /> {{ t('common.download') }}</Button>
                            <Button variant="secondary" size="sm" @click="copyToClipboard(cert.Content, cert.Id + 'content')">
                              <Check v-if="copiedId === cert.Id + 'content'" class="size-4 mr-2 text-green-500" />
                              <Copy v-else class="size-4 mr-2" /> {{ t('common.copy') }}
                            </Button>
                          </div>
                        </div>

                        <!-- Fingerprint (Always visible) -->
                        <div class="space-y-2">
                          <div class="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><ShieldCheck class="size-3" /> {{ t('dashboard.fingerprint') }}</div>
                          <div class="flex items-center gap-2 bg-muted/50 p-3 rounded-lg border group">
                            <code class="text-xs font-mono break-all flex-1 text-muted-foreground">{{ cert.Fingerprint }}</code>
                            <Button variant="ghost" size="icon" class="size-8 shrink-0" @click="copyToClipboard(cert.Fingerprint, cert.Id + 'fp')">
                              <Check v-if="copiedId === cert.Id + 'fp'" class="size-4 text-green-500" />
                              <Copy v-else class="size-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div v-if="gallery.length === 0 && certificates.length === 0" class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">{{ t('dashboard.noAssets') }}</div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.ml-13 { margin-left: 3.25rem; }
</style>
