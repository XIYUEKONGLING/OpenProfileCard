<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue';
import {
  type OrganizationDto,
  type ProfileDto,
  type ProjectDto,
  type GalleryItemDto,
  type SocialLinkDto,
  type ContactMethodDto,
  type SponsorshipItemDto,
  type CertificateDto,
  type FollowCountsDto,
  type DeletionCountdownDto,
  MemberRole,
  AccountStatus,
  AssetType
} from '@/api/types';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import UserListDialog from '@/components/dashboard/UserListDialog.vue';

// Icons
import {
  MapPin, Link as LinkIcon, Users, Edit2, Plus,
  FolderGit2, Image as ImageIcon, Settings, BookOpen,
  Heart, ExternalLink, LogOut, ShieldAlert,
  Crown, Mail, Phone, MessageSquare, MapPin as MapIcon, Link as LinkIcon2,
  AlertTriangle, Ban, Trash2, Shield, Key, Copy, Check, Landmark, Clock,
} from 'lucide-vue-next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// Lazy Load
const OrgMembers = defineAsyncComponent(() => import('@/components/org/OrgMembers.vue'));

const props = defineProps<{ accountName: string }>();

const { t } = useI18n();
const ui = useUIStore();
const auth = useAuthStore();
const server = useServerStore();
const router = useRouter();
const route = useRoute();

// --- State ---
const isLoading = ref(true);
const org = ref<OrganizationDto | null>(null); // Roles, Status
const profile = ref<ProfileDto | null>(null); // Visuals (Background, Content)
const followStats = ref<FollowCountsDto | null>(null);
const deletionCountdown = ref<DeletionCountdownDto | null>(null);

const projects = ref<ProjectDto[]>([]);
const gallery = ref<GalleryItemDto[]>([]);
const socials = ref<SocialLinkDto[]>([]);
const contacts = ref<ContactMethodDto[]>([]);
const sponsorships = ref<SponsorshipItemDto[]>([]);
const certificates = ref<CertificateDto[]>([]);

const showUserList = ref(false);
const userListType = ref<'followers' | 'following'>('followers');
const copiedId = ref<string | null>(null);
const remainingSeconds = ref<number | null>(null);
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const showLeaveModal = ref(false);

// --- Computed Permissions ---
const isOwner = computed(() => org.value?.MyRole === MemberRole.Owner);
const isAdmin = computed(() => org.value?.MyRole === MemberRole.Admin || isOwner.value);
const canEdit = computed(() => isAdmin.value);

const description = computed(() => profile.value?.Description);

const supportEmail = computed(() => server.meta?.ContactEmail);
const contactSupportUrl = computed(() => {
  if (!supportEmail.value) return null;
  const subject = encodeURIComponent(t('dashboard.contactSupportSubject'));
  const body = encodeURIComponent(t('dashboard.contactSupportOrgBody', { org: org.value?.DisplayName || props.accountName }));
  return `mailto:${supportEmail.value}?subject=${subject}&body=${body}`;
});

const countdownDisplay = computed(() => {
  if (remainingSeconds.value === null || remainingSeconds.value < 0) return null;
  const days = Math.floor(remainingSeconds.value / 86400);
  const hours = Math.floor((remainingSeconds.value % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60);
  const seconds = remainingSeconds.value % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(t('dashboard.countdownDaysPart', { days }));
  if (hours > 0 || days > 0) parts.push(t('dashboard.countdownHoursPart', { hours }));
  parts.push(t('dashboard.countdownMinutesPart', { minutes }));
  parts.push(t('dashboard.countdownSecondsPart', { seconds }));
  return parts.join(' ');
});

const timeZoneDisplay = computed(() => {
  const tz = profile.value?.TimeZone;
  if (!tz) return null;

  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz
  });
  return `${timeString} (${tz})`;
});

// Check ProfileDto for background
const hasBackground = computed(() =>
    profile.value?.Background &&
    profile.value.Background.Type !== AssetType.Empty &&
    !!profile.value.Background.Value
);

// --- Status Logic ---
const blockReason = computed(() => {
  if (!org.value) return null;
  const status = Number(org.value.Status);
  switch (status) {
    case AccountStatus.Suspended:
      return {
        title: t('dashboard.accountSuspended'),
        desc: t('dashboard.accountSuspendedDesc'),
        icon: AlertTriangle,
        color: 'text-orange-500'
      };
    case AccountStatus.Banned:
      return {
        title: t('dashboard.accountBanned'),
        desc: t('dashboard.accountBannedDesc'),
        icon: Ban,
        color: 'text-destructive'
      };
    case AccountStatus.PendingDeletion:
      return {
        title: t('dashboard.accountPendingDeletion'),
        desc: t('dashboard.accountPendingDeletionDesc'),
        icon: Trash2,
        color: 'text-muted-foreground'
      };
    case AccountStatus.Deactivated:
      return {
        title: t('common.notice'),
        desc: t('dashboard.accountDeactivated'),
        icon: Shield,
        color: 'text-brand-blue'
      };
    default:
      return null;
  }
});

// --- Computed ---


// --- Actions ---
const startCountdownTimer = () => {
  // Clear existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  // Calculate initial remaining seconds
  if (deletionCountdown.value) {
    const { Days, Hours, Minutes, Seconds } = deletionCountdown.value;
    remainingSeconds.value = Days * 86400 + Hours * 3600 + Minutes * 60 + Seconds;

    // Start interval to update every second
    countdownInterval = setInterval(() => {
      if (remainingSeconds.value !== null && remainingSeconds.value > 0) {
        remainingSeconds.value--;
      } else {
        // Stop countdown when it reaches zero
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }
    }, 1000);
  }
};

const fetchDeletionCountdown = async () => {
  if (org.value?.Status !== AccountStatus.PendingDeletion) {
    // Clear countdown and stop timer if not in PendingDeletion status
    remainingSeconds.value = null;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    return;
  }
  try {
    const data = await httpClient<DeletionCountdownDto>(`/orgs/${props.accountName}/deletion-countdown`);
    deletionCountdown.value = data;
    startCountdownTimer();
  } catch (error) {
    console.error('Failed to fetch deletion countdown', error);
  }
};

const fetchOrgData = async () => {
  isLoading.value = true;
  try {
    // 1. Fetch Org Summary (Permissions, Status)
    const orgData = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    org.value = orgData;

    // 2. Fetch Profile Visuals (Background, Content) - Accessible to members
    const profileData = await httpClient<ProfileDto>(`/orgs/${props.accountName}/profile`);
    profile.value = profileData;

    // 3. Fetch Sub-resources
    const [
      followData,
      projectsData,
      galleryData,
      socialsData,
      contactsData,
      sponsorshipsData,
      certificatesData
    ] = await Promise.all([
      httpClient<FollowCountsDto>(`/orgs/${props.accountName}/follow-stats`),
      httpClient<ProjectDto[]>(`/orgs/${props.accountName}/projects`),
      httpClient<GalleryItemDto[]>(`/orgs/${props.accountName}/gallery`),
      httpClient<SocialLinkDto[]>(`/orgs/${props.accountName}/socials`),
      httpClient<ContactMethodDto[]>(`/orgs/${props.accountName}/contacts`),
      httpClient<SponsorshipItemDto[]>(`/orgs/${props.accountName}/sponsorships`),
      httpClient<CertificateDto[]>(`/orgs/${props.accountName}/certificates`),
    ]);

    followStats.value = followData;
    projects.value = projectsData || [];
    gallery.value = galleryData || [];
    socials.value = socialsData || [];
    contacts.value = contactsData || [];
    sponsorships.value = sponsorshipsData || [];
    certificates.value = certificatesData || [];

    // Fetch deletion countdown if org is in PendingDeletion status
    await fetchDeletionCountdown();

  } catch (e: any) {
    ui.notify(e.message || 'Failed to load organization', 'error');
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
  }
};

const openUserList = (type: 'followers' | 'following') => {
  userListType.value = type;
  showUserList.value = true;
};

const refreshStats = () => {
  httpClient<FollowCountsDto>(`/orgs/${props.accountName}/follow-stats`).then(data => {
    followStats.value = data;
  });
};

const restoreOrg = async () => {
  if (!org.value) return;
  try {
    await httpClient(`/orgs/@${org.value.Id}/restore`, { method: 'POST' });
    ui.notify(t('settings.accountRestored'), 'success');
    fetchOrgData();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const goToEditProfile = (tab: string = 'basic') => {
  router.push({ name: 'org-profile-edit', params: { accountName: props.accountName }, query: { tab } });
};

const goToSettings = () => {
  router.push({ name: 'org-settings', params: { accountName: props.accountName } });
};

const goToAssets = () => {
  router.push({ name: 'org-assets', params: { accountName: props.accountName } });
};

const goToManage = (resource: string) => {
  router.push(`/dashboard/orgs/${props.accountName}/manage/${resource}`);
};

const leaveOrg = async () => {
  try {
    await httpClient(`/orgs/${props.accountName}/members/me`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    showLeaveModal.value = false;
    router.push('/dashboard');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

const getContactIcon = (type: any) => {
  switch (Number(type)) {
    case 0: return Mail;
    case 1: return Phone;
    case 2: return MessageSquare;
    case 3: return MapIcon;
    default: return LinkIcon2;
  }
};

const contactSupport = () => {
  if (contactSupportUrl.value) {
    window.location.href = contactSupportUrl.value;
  }
};

// const formatDate = (dateString?: string) => {
//   if (!dateString) return t('common.present');
//   const date = new Date(dateString);
//   if (locale.value === 'zh') {
//     return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
//   }
//   return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
// };

const formatDate = (dateStr?: string) => {
  if (!dateStr) return t('common.present');
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const copyToClipboard = async (text: string, id: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    ui.notify(t('common.copied'), 'success');
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  } catch (e) {
    console.error(e);
  }
};

watch(() => props.accountName, fetchOrgData, { immediate: true });

// Watch for route changes to refresh data when returning from edit pages
watch(
  () => route.path,
  (newPath, oldPath) => {
    // When navigating back to org dashboard from edit page, refresh data
    if (newPath.includes(`/orgs/${props.accountName}`) && oldPath?.includes('/edit')) {
      fetchOrgData();
    }
  }
);

onUnmounted(() => {
  // Clear countdown interval when component is unmounted
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
});
</script>

<template>
  <div class="min-h-[80vh] w-full pb-20">

    <!-- User List Dialog -->
    <UserListDialog
        v-model:open="showUserList"
        :type="userListType"
        :account-name="accountName"
        :is-me="false"
        @change="refreshStats"
    />

    <!-- BLOCKER OVERLAY -->
    <div v-if="blockReason" class="fixed inset-0 z-40 backdrop-blur-xl bg-background/50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 pt-20 md:absolute md:inset-0 md:left-0 md:pt-6">
      <div class="max-w-md w-full bg-background border border-border shadow-2xl rounded-3xl p-8 flex flex-col items-center">
        <div class="size-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <component :is="blockReason.icon" class="size-10" :class="blockReason.color" />
        </div>
        <h2 class="text-2xl font-black tracking-tight mb-2">{{ blockReason.title }}</h2>
        <p class="text-muted-foreground font-medium mb-4 leading-relaxed">
          {{ blockReason.desc }}
        </p>

        <!-- Countdown for Pending Deletion -->
        <div v-if="org?.Status === AccountStatus.PendingDeletion && countdownDisplay" class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
          <p class="text-sm font-semibold text-destructive mb-1">{{ t('dashboard.accountWillBeDeleted') }}</p>
          <p class="text-2xl font-black text-destructive">{{ countdownDisplay }}</p>
        </div>

        <div class="flex flex-col gap-3 w-full">
          <!-- Allow Owners to restore pending deletion orgs -->
          <Button v-if="org?.Status === AccountStatus.PendingDeletion && isOwner" class="w-full font-bold" variant="default" @click="restoreOrg">
            {{ t('dashboard.restoreAccount') }}
          </Button>
          <Button v-if="contactSupportUrl" variant="outline" class="w-full font-bold" @click="contactSupport">
            {{ t('dashboard.contactSupport') }}
          </Button>
          <Button v-else variant="outline" class="w-full font-bold" disabled>
            {{ t('dashboard.contactSupport') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div
        class="w-full animate-in fade-in slide-in-from-bottom-4 duration-700"
        :class="{'opacity-20 pointer-events-none select-none filter blur-sm': !!blockReason}"
    >

      <!-- HEADER BANNER -->
      <div v-if="hasBackground" class="w-full h-48 md:h-64 bg-muted relative overflow-hidden group rounded-4xl mb-6">
        <AssetView :asset="profile?.Background" class-name="w-full h-full object-cover" />
        <div v-if="canEdit" class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" class="shadow-lg backdrop-blur-md bg-background/50" @click="goToEditProfile('visuals')">
            <Edit2 class="size-3 mr-2" /> {{ t('common.edit') }}
          </Button>
        </div>
      </div>

      <div class="container max-w-7xl mx-auto px-4">

        <!-- Skeleton -->
        <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-12 gap-8 -mt-16">
          <div class="lg:col-span-4 xl:col-span-3 space-y-4">
            <div class="size-40 rounded-full bg-muted animate-pulse border-6 border-background"></div>
            <div class="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
          </div>
          <div class="lg:col-span-8 xl:col-span-9 h-96 bg-muted rounded-xl animate-pulse mt-20"></div>
        </div>

        <!-- Content Grid -->
        <div v-else-if="org" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- LEFT COLUMN -->
          <aside
              class="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 relative z-10 mb-10"
              :class="hasBackground ? '-mt-16 sm:-mt-20' : 'mt-6'"
          >
            <!-- Avatar -->
            <div class="relative group mx-auto lg:mx-0 w-40 h-40 sm:w-48 sm:h-48">
              <div class="w-full h-full rounded-full border-[6px] border-background shadow-xl overflow-hidden bg-muted relative z-10">
                <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full object-cover" />
              </div>

              <!-- Role Badge -->
              <div class="absolute bottom-2 right-2 z-20">
                <div class="bg-background text-foreground p-1.5 rounded-full shadow-lg border-2 border-muted flex items-center" :title="t('organization.role')">
                  <Crown v-if="isOwner" class="size-4 text-yellow-500 fill-yellow-500" />
                  <ShieldAlert v-else-if="isAdmin" class="size-4 text-brand-blue" />
                  <Users v-else class="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-6 px-2 text-center lg:text-left pt-2">
              <div class="space-y-1">
                <h1 class="text-3xl font-black tracking-tight leading-tight">{{ org.DisplayName }}</h1>
                <p class="text-xl text-muted-foreground font-medium">@{{ org.AccountName }}</p>
              </div>

              <!-- Follow Stats -->
              <div class="flex items-center justify-center lg:justify-start gap-6 text-sm">
                <button class="flex items-center gap-1 hover:text-brand-blue transition-colors cursor-pointer group" @click="openUserList('followers')">
                  <span class="font-black text-foreground group-hover:text-brand-blue">{{ followStats?.FollowersCount || 0 }}</span>
                  <span class="text-muted-foreground group-hover:text-brand-blue/80">{{ t('dashboard.followers') }}</span>
                </button>
                <div class="w-px h-4 bg-border"></div>
                <button class="flex items-center gap-1 hover:text-brand-blue transition-colors cursor-pointer group" @click="openUserList('following')">
                  <span class="font-black text-foreground group-hover:text-brand-blue">{{ followStats?.FollowingCount || 0 }}</span>
                  <span class="text-muted-foreground group-hover:text-brand-blue/80">{{ t('dashboard.following') }}</span>
                </button>
              </div>

              <!-- Bio -->
              <div v-if="description" class="text-sm leading-relaxed text-foreground/80">
                {{ description }}
              </div>

              <!-- Actions -->
              <div class="space-y-3">
                <Button v-if="canEdit" variant="outline" class="w-full font-bold shadow-sm rounded-xl" @click="goToEditProfile('basic')">
                  {{ t('profile.editProfile') }}
                </Button>

                <Button v-if="canEdit" variant="outline" class="w-full font-bold shadow-sm rounded-xl" @click="goToAssets">
                  <ImageIcon class="size-4 mr-2" /> {{ t('assetLibrary.title') || 'Asset Library' }}
                </Button>

                <Button v-if="isOwner" variant="outline" class="w-full font-bold shadow-sm rounded-xl border-dashed" @click="goToSettings">
                  <Settings class="size-4 mr-2" /> {{ t('organization.settings') }}
                </Button>

                <Button v-if="!isOwner" variant="outline" class="w-full text-destructive hover:bg-destructive/10 rounded-xl" @click="showLeaveModal = true">
                  <LogOut class="size-4 mr-2" /> {{ t('organization.leave') }}
                </Button>
              </div>

              <!-- Metadata -->
              <div class="flex flex-col gap-3 text-sm text-muted-foreground text-left">
                <div v-if="profile?.Location" class="flex items-center gap-3">
                  <MapPin class="size-4 shrink-0 opacity-70" /> <span>{{ profile.Location }}</span>
                </div>
                <div v-if="timeZoneDisplay" class="flex items-center gap-3">
                  <Clock class="size-4 shrink-0 opacity-70" />
                  <span>{{ timeZoneDisplay }}</span>
                </div>
                <div v-if="profile?.FoundedDate" class="flex items-center gap-3">
                  <Landmark class="size-4 shrink-0 opacity-70" /> <span>{{ formatDate(profile.FoundedDate) }}</span>
                </div>
                <div v-if="profile?.Website" class="flex items-center gap-3">
                  <LinkIcon class="size-4 shrink-0 opacity-70" />
                  <a :href="profile.Website" target="_blank" class="hover:text-brand-blue hover:underline truncate">{{ profile.Website }}</a>
                </div>
              </div>
            </div>
          </aside>

          <!-- RIGHT COLUMN: Workspace -->
          <main class="lg:col-span-8 xl:col-span-9 min-w-0 pt-6">
            <Tabs default-value="overview" class="w-full">

              <!-- Tabs Navigation -->
              <div class="sticky top-0 z-30 bg-background/95 backdrop-blur-md pb-0 pt-2 -mt-2 border-b border-border/60">
                <TabsList class="w-full justify-start h-auto p-0 bg-transparent rounded-none gap-2 overflow-x-auto no-scrollbar">
                  <TabsTrigger value="overview" class="tab-item"><BookOpen class="size-4 mr-2" /> {{ t('dashboard.overview') }}</TabsTrigger>
                  <TabsTrigger value="projects" class="tab-item"><FolderGit2 class="size-4 mr-2" /> {{ t('dashboard.projects') }}</TabsTrigger>
                  <TabsTrigger value="members" class="tab-item"><Users class="size-4 mr-2" /> {{ t('organization.members') }}</TabsTrigger>
                  <TabsTrigger value="resources" class="tab-item"><ImageIcon class="size-4 mr-2" /> {{ t('dashboard.resources') }}</TabsTrigger>
                </TabsList>
              </div>

              <!-- TAB: OVERVIEW -->
              <TabsContent value="overview" class="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-2">

                <!-- Socials -->
                <div v-if="socials.length > 0" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="font-bold text-sm text-muted-foreground uppercase tracking-wider">{{ t('dashboard.socials') }}</h3>
                    <Button v-if="canEdit" variant="ghost" size="sm" class="h-6 text-xs" @click="goToManage('socials')">
                      <Edit2 class="size-3 mr-1" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <a v-for="social in socials" :key="social.Id" :href="social.Url" target="_blank" class="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-card hover:bg-muted transition-colors group">
                      <AssetView :asset="social.Icon" class-name="size-5 shrink-0" />
                      <span class="font-bold text-sm truncate">{{ social.Platform }}</span>
                    </a>
                  </div>
                </div>
                <div v-else-if="canEdit" class="flex justify-end">
                  <Button variant="ghost" size="sm" class="text-xs" @click="goToManage('socials')">
                    <Plus class="size-3 mr-1"/> {{ t('dashboard.addSocial') }}
                  </Button>
                </div>

                <!-- Contacts -->
                <div v-if="contacts.length > 0" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="font-bold text-sm text-muted-foreground uppercase tracking-wider">{{ t('common.contact') }}</h3>
                    <Button v-if="canEdit" variant="ghost" size="sm" class="h-6 text-xs" @click="goToManage('contacts')">
                      <Edit2 class="size-3 mr-1" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div v-for="c in contacts" :key="c.Id" class="flex items-center gap-3 p-3 rounded-xl border bg-card">
                      <div class="size-9 flex items-center justify-center rounded-lg bg-muted shrink-0">
                        <AssetView v-if="c.Icon && c.Icon.Type !== 0" :asset="c.Icon" class-name="size-5" />
                        <component v-else :is="getContactIcon(c.Type)" class="size-4 text-muted-foreground" />
                      </div>
                      <div class="min-w-0">
                        <div class="text-[10px] font-bold uppercase text-muted-foreground">{{ c.Label }}</div>
                        <div class="font-medium truncate select-all text-sm">{{ c.Value }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="canEdit" class="flex justify-start">
                  <Button variant="outline" size="sm" class="text-xs border-dashed" @click="goToManage('contacts')">
                    <Plus class="size-3 mr-1"/> {{ t('dashboard.addContact') }}
                  </Button>
                </div>

                <!-- Markdown Content -->
                <Card class="border-border/60 shadow-sm overflow-hidden">
                  <CardContent class="p-6 sm:p-8">
                    <MarkdownRenderer v-if="profile?.Content" :content="profile.Content" size="sm" />
                    <div v-else class="flex flex-col items-center justify-center py-10 text-center gap-4">
                      <div class="size-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <BookOpen class="size-8 text-muted-foreground/40" />
                      </div>
                      <p class="text-muted-foreground text-sm max-w-md">{{ t('dashboard.tellWorldDesc') }}</p>
                      <Button v-if="canEdit" variant="outline" class="mt-2" @click="goToEditProfile('content')">{{ t('dashboard.createReadme') }}</Button>
                      <p v-else class="text-xs text-muted-foreground italic">{{ t('common.noDescription') }}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <!-- TAB: PROJECTS -->
              <TabsContent value="projects" class="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div>
                    <h3 class="font-bold">{{ t('dashboard.repositories') }}</h3>
                    <p class="text-xs text-muted-foreground">{{ t('dashboard.repoSubtitle') }}</p>
                  </div>
                  <Button v-if="canEdit" class="font-bold bg-brand-purple hover:bg-brand-purple/90 text-white" @click="goToManage('projects')">
                    <Plus class="size-4 mr-2" /> {{ t('common.manage') }}
                  </Button>
                </div>

                <div v-if="projects.length > 0" class="grid gap-3">
                  <Card v-for="proj in projects" :key="proj.Id" class="flex flex-col sm:flex-row sm:items-center p-4 gap-4 border-border/60 hover:bg-muted/10 transition-colors">
                    <div class="size-12 rounded-xl bg-muted border flex items-center justify-center shrink-0 overflow-hidden">
                      <AssetView :asset="proj.Logo" :fallback-name="proj.Name" class-name="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h4 class="font-bold truncate">{{ proj.Name }}</h4>
                        <Badge variant="secondary" class="text-[10px] h-5">{{ proj.Visibility }}</Badge>
                      </div>
                      <p class="text-sm text-muted-foreground truncate">{{ proj.Summary }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <a v-if="proj.Url" :href="proj.Url" target="_blank" class="text-xs text-brand-blue hover:underline flex items-center gap-1">
                        <LinkIcon class="size-3" /> Visit
                      </a>
                      <Button v-if="canEdit" variant="ghost" size="icon" class="h-8 w-8" @click="goToManage('projects')">
                        <Settings class="size-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
                <div v-else class="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                  {{ t('dashboard.noProjects') }}
                </div>
              </TabsContent>

              <!-- TAB: MEMBERS -->
              <TabsContent value="members" class="pt-6 animate-in fade-in slide-in-from-bottom-2">
                <OrgMembers :account-name="accountName" :my-role="org.MyRole" :account-id="auth.user?.Id" />
              </TabsContent>

              <!-- TAB: RESOURCES -->
              <TabsContent value="resources" class="space-y-10 pt-6 animate-in fade-in slide-in-from-bottom-2">
                <!-- Sponsorships -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><Heart class="size-4 text-pink-500" /> {{ t('dashboard.sponsorships') }}</h3>
                    <Button v-if="canEdit" variant="ghost" size="sm" @click="goToManage('sponsorships')">
                      <ExternalLink class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div v-if="sponsorships.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Card v-for="spon in sponsorships" :key="spon.Id" class="hover:border-pink-500/30 transition-colors">
                      <CardContent class="p-4 flex items-center gap-4">
                        <AssetView :asset="spon.Icon" class-name="size-10 rounded-lg" />
                        <div class="min-w-0">
                          <div class="font-bold truncate">{{ spon.Platform }}</div>
                          <a v-if="spon.Url" :href="spon.Url" target="_blank" class="text-xs text-muted-foreground hover:text-foreground truncate block">
                            {{ spon.Url }}
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div v-else class="text-sm text-muted-foreground italic border border-dashed p-4 rounded-lg text-center">{{ t('dashboard.noSponsorships') }}</div>
                </section>

                <!-- Certificates -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><Key class="size-4 text-emerald-500" /> {{ t('dashboard.certificates') }}</h3>
                    <Button v-if="canEdit" size="sm" variant="outline" @click="goToManage('certificates')">
                      <Plus class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>

                  <div v-if="certificates.length > 0" class="flex flex-col gap-3">
                    <Card v-for="cert in certificates" :key="cert.Id" class="border-border/60">
                      <CardContent class="p-4">
                        <div class="flex items-start justify-between gap-4">
                          <div class="space-y-1 min-w-0">
                            <div class="flex items-center gap-2">
                              <h4 class="font-bold font-mono">{{ cert.Name }}</h4>
                              <Badge variant="outline" class="text-[10px]">{{ cert.Type }}</Badge>
                            </div>
                            <div class="flex items-center gap-2 bg-muted/50 p-1.5 rounded-md w-fit">
                              <code class="text-xs text-muted-foreground font-mono break-all">{{ cert.Fingerprint }}</code>
                              <button @click="copyToClipboard(cert.Fingerprint, cert.Id)" class="hover:text-foreground text-muted-foreground transition-colors">
                                <Check v-if="copiedId === cert.Id" class="size-3 text-emerald-500" />
                                <Copy v-else class="size-3" />
                              </button>
                            </div>
                          </div>
                          <div class="text-right text-xs text-muted-foreground">
                            <div v-if="cert.ExpiresAt">{{ t('dashboard.expiresAt', { date: formatDate(cert.ExpiresAt) }) }}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div v-else class="text-sm text-muted-foreground italic border border-dashed p-4 rounded-lg text-center">
                    {{ t('dashboard.noCertificates') }}
                  </div>
                </section>

                <!-- Gallery -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><ImageIcon class="size-4 text-brand-blue" /> {{ t('dashboard.galleryItems') }}</h3>
                    <Button v-if="canEdit" size="sm" @click="goToManage('gallery')">
                      <Plus class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div v-if="gallery.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div v-for="item in gallery" :key="item.Id" class="group relative aspect-video rounded-xl overflow-hidden border bg-muted">
                      <AssetView :asset="item.Image" class-name="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div v-if="canEdit" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" variant="secondary" class="size-8 rounded-full" @click="goToManage('gallery')"><Edit2 class="size-3" /></Button>
                      </div>
                      <div v-if="item.Caption" class="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-bold truncate">
                        {{ item.Caption }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/10">
                    <h3 class="font-bold">{{ t('dashboard.noAssets') }}</h3>
                    <Button v-if="canEdit" variant="outline" class="mt-4" @click="goToManage('gallery')">{{ t('dashboard.uploadFirst') }}</Button>
                  </div>
                </section>
              </TabsContent>

            </Tabs>
          </main>
        </div>
      </div>
    </div>
    
    <AlertDialog v-model:open="showLeaveModal">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('organization.leave') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('organization.leaveConfirm') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="leaveOrg" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ t('organization.leave') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
@reference '../../style.css';

.tab-item {
  @apply relative rounded-t-lg rounded-b-none border border-transparent
  data-[state=active]:border-border/60 data-[state=active]:border-b-background
  data-[state=active]:bg-background text-muted-foreground px-4 py-3
  font-bold text-sm transition-all -mb-px hover:text-foreground;
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
