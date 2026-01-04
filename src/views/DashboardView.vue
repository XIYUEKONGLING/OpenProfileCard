<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { renderMarkdown } from '@/lib/markdown';
import {
  type ProfileDto,
  type ProjectDto,
  type WorkExperienceDto,
  type EducationExperienceDto,
  type OrganizationDto,
  type GalleryItemDto,
  type SocialLinkDto,
  type CertificateDto,
  type SponsorshipItemDto,
  type FollowCountsDto,
  AccountStatus,
  AccountType,
  AssetType
} from '@/api/types';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

// Icons
import {
  MapPin, Link as LinkIcon, Building2, Clock,
  Edit2, Plus, Briefcase,
  FolderGit2, Image as ImageIcon,
  Settings, Shield, BookOpen, Key,
  Heart, Copy, Check, Ban, AlertTriangle, Trash2, ExternalLink, Users
} from 'lucide-vue-next';

const { t, locale } = useI18n();
const auth = useAuthStore();
const ui = useUIStore();
const router = useRouter();

// --- State ---
const isLoading = ref(true);
const profile = ref<ProfileDto | null>(null);
const followStats = ref<FollowCountsDto | null>(null); // Added
const projects = ref<ProjectDto[]>([]);
const work = ref<WorkExperienceDto[]>([]);
const education = ref<EducationExperienceDto[]>([]);
const orgs = ref<OrganizationDto[]>([]);
const gallery = ref<GalleryItemDto[]>([]);
const socials = ref<SocialLinkDto[]>([]);
const certificates = ref<CertificateDto[]>([]);
const sponsorships = ref<SponsorshipItemDto[]>([]);

const copiedId = ref<string | null>(null);

// --- Computed ---
const renderedContent = computed(() => renderMarkdown(profile.value?.Content));

const isPersonal = computed(() => {
  const type = profile.value?.Type ?? auth.user?.Type;
  return type === AccountType.Personal;
});

const hasBackground = computed(() => {
  const bg = profile.value?.Background;
  return bg && bg.Type !== AssetType.Empty && !!bg.Value;
});

const joinDate = computed(() => {
  if (!auth.user?.CreatedAt) return '';
  const date = new Date(auth.user.CreatedAt);
  if (locale.value === 'zh') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// --- Actions ---
const goToEditProfile = (tab: string) => {
  router.push({ path: '/dashboard/profile/edit', query: { tab } });
};

const goToManage = (resource: string) => {
  router.push(`/dashboard/manage/${resource}`);
};

// --- Blocking Logic ---
const isAccountBlocked = computed(() => {
  if (!auth.user) return false;
  return Number(auth.user.Status) !== AccountStatus.Active;
});

const blockReason = computed(() => {
  if (!auth.user) return null;
  const status = Number(auth.user.Status);
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

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    const [
      profileData,
      followData,
      projectsData,
      workData,
      eduData,
      orgsData,
      galleryData,
      socialsData,
      certsData,
      sponsorshipsData
    ] = await Promise.all([
      httpClient<ProfileDto>('/me/profile'),
      httpClient<FollowCountsDto>('/me/follow-stats'),
      httpClient<ProjectDto[]>('/me/projects'),
      httpClient<WorkExperienceDto[]>('/me/work'),
      httpClient<EducationExperienceDto[]>('/me/education'),
      httpClient<OrganizationDto[]>('/orgs'),
      httpClient<GalleryItemDto[]>('/me/gallery'),
      httpClient<SocialLinkDto[]>('/me/socials'),
      httpClient<CertificateDto[]>('/me/certificates'),
      httpClient<SponsorshipItemDto[]>('/me/sponsorships')
    ]);

    profile.value = profileData;
    followStats.value = followData;
    projects.value = projectsData || [];
    work.value = workData || [];
    education.value = eduData || [];
    orgs.value = orgsData || [];
    gallery.value = galleryData || [];
    socials.value = socialsData || [];
    certificates.value = certsData || [];
    sponsorships.value = sponsorshipsData || [];

  } catch (error) {
    console.error('Failed to load dashboard data', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// --- Helpers ---
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Present';
  const date = new Date(dateString);
  if (locale.value === 'zh') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
</script>

<template>
  <div class="relative min-h-[80vh] w-full">

    <!-- BLOCKER OVERLAY -->
    <div v-if="isAccountBlocked && blockReason" class="absolute inset-0 z-50 backdrop-blur-xl bg-background/50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div class="max-w-md w-full bg-background border border-border shadow-2xl rounded-3xl p-8 flex flex-col items-center">
        <div class="size-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <component :is="blockReason.icon" class="size-10" :class="blockReason.color" />
        </div>
        <h2 class="text-2xl font-black tracking-tight mb-2">{{ blockReason.title }}</h2>
        <p class="text-muted-foreground font-medium mb-8 leading-relaxed">
          {{ blockReason.desc }}
        </p>

        <div class="flex flex-col gap-3 w-full">
          <Button v-if="auth.user?.Status === AccountStatus.PendingDeletion" class="w-full font-bold" variant="default">
            {{ t('dashboard.restoreAccount') }}
          </Button>
          <Button variant="outline" class="w-full font-bold">
            {{ t('dashboard.contactSupport') }}
          </Button>
        </div>
      </div>
    </div>

    <div class="w-full animate-in fade-in slide-in-from-bottom-4 duration-700" :class="{'opacity-20 pointer-events-none select-none filter blur-sm': isAccountBlocked}">

      <!-- HEADER BANNER -->
      <div v-if="hasBackground" class="w-full h-48 md:h-64 bg-muted relative overflow-hidden group rounded-4xl">
        <AssetView :asset="profile?.Background" class-name="w-full h-full object-cover" />
        <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" class="shadow-lg backdrop-blur-md bg-background/50" @click="goToEditProfile('visuals')">
            <Edit2 class="size-3 mr-2" /> {{ t('common.edit') }}
          </Button>
        </div>
      </div>

      <!-- MAIN CONTAINER -->
      <div class="container max-w-full lg:max-w-7xl mx-auto px-4">

        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <div class="lg:col-span-4 xl:col-span-3 space-y-6">
            <div class="aspect-square rounded-full bg-muted animate-pulse -mt-20 border-4 border-background"></div>
            <div class="h-8 bg-muted rounded w-3/4 animate-pulse"></div>
            <div class="h-4 bg-muted rounded w-full animate-pulse"></div>
          </div>
          <div class="lg:col-span-8 xl:col-span-9 space-y-6">
            <div class="h-12 bg-muted rounded-t-lg animate-pulse"></div>
            <div class="h-64 bg-muted rounded-b-lg animate-pulse"></div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- LEFT COLUMN -->
          <aside class="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 relative z-10 mb-10" :class="hasBackground ? '-mt-16 sm:-mt-20' : 'mt-10'">

            <!-- Avatar -->
            <div class="relative group mx-auto lg:mx-0 w-40 h-40 sm:w-48 sm:h-48">
              <div class="w-full h-full rounded-full border-[6px] border-background shadow-xl overflow-hidden bg-muted relative z-10">
                <AssetView
                    :asset="profile?.Avatar"
                    :fallback-name="profile?.DisplayName || auth.user?.AccountName"
                    class-name="w-full h-full object-cover"
                />
              </div>
              <div v-if="auth.isAdmin" class="absolute bottom-2 right-2 z-20">
                <div class="bg-brand-blue text-white p-1.5 rounded-full shadow-lg border-2 border-background">
                  <Shield class="size-4" />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-6 px-2">
              <!-- Names -->
              <div class="space-y-1 text-center lg:text-left">
                <h1 class="text-3xl font-black tracking-tight leading-tight">
                  {{ profile?.DisplayName || auth.user?.AccountName }}
                </h1>
                <p class="text-xl text-muted-foreground font-medium">
                  @{{ auth.user?.AccountName }}
                </p>
              </div>

              <!-- Follow Stats (NEW) -->
              <div class="flex items-center justify-center lg:justify-start gap-6 text-sm">
                <div class="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                  <span class="font-black text-foreground">{{ followStats?.FollowingCount || 0 }}</span>
                  <span class="text-muted-foreground">{{ t('dashboard.following') }}</span>
                </div>
                <div class="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                  <span class="font-black text-foreground">{{ followStats?.FollowersCount || 0 }}</span>
                  <span class="text-muted-foreground">{{ t('dashboard.followers') }}</span>
                </div>
              </div>

              <!-- Bio -->
              <div v-if="profile?.Description" class="text-sm leading-relaxed text-foreground/80 text-center lg:text-left">
                {{ profile.Description }}
              </div>

              <!-- Edit Button -->
              <Button class="w-full font-bold shadow-sm rounded-xl" variant="outline" @click="goToEditProfile('basic')">
                {{ t('profile.editProfile') }}
              </Button>

              <!-- Metadata -->
              <div class="flex flex-col gap-3 text-sm text-muted-foreground">
                <div v-if="profile?.CurrentCompany" class="flex items-center gap-3">
                  <Building2 class="size-4 shrink-0 opacity-70" />
                  <span class="font-medium text-foreground">{{ profile.CurrentCompany }}</span>
                </div>
                <div v-if="profile?.Location" class="flex items-center gap-3">
                  <MapPin class="size-4 shrink-0 opacity-70" />
                  <span>{{ profile.Location }}</span>
                </div>
                <div v-if="profile?.Website" class="flex items-center gap-3">
                  <LinkIcon class="size-4 shrink-0 opacity-70" />
                  <a :href="profile.Website" target="_blank" class="hover:text-brand-blue hover:underline truncate">
                    {{ profile.Website }}
                  </a>
                </div>
                <div class="flex items-center gap-3">
                  <Clock class="size-4 shrink-0 opacity-70" />
                  <span>{{ t('dashboard.joined', { date: joinDate }) }}</span>
                </div>
              </div>

              <!-- Social Links -->
              <div class="flex flex-col gap-2">
                <div v-if="socials.length > 0" class="flex flex-wrap gap-2">
                  <a v-for="social in socials" :key="social.Id" :href="social.Url" target="_blank" class="size-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 hover:scale-110 transition-all border border-border">
                    <AssetView :asset="social.Icon" class-name="size-5" />
                  </a>
                </div>
                <!-- Manage Socials Button -->
                <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground border border-dashed border-border/50" @click="goToManage('socials')">
                  <Edit2 class="size-3 mr-2" /> {{ t('common.manage') }} Socials
                </Button>
              </div>

              <Separator />

              <!-- Organizations -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-sm">{{ t('dashboard.organizations') }}</h3>
                </div>
                <div v-if="orgs.length > 0" class="flex flex-wrap gap-2">
                  <router-link v-for="org in orgs" :key="org.Id" :to="`/orgs/${org.AccountName}`" class="relative group">
                    <div class="size-10 rounded-lg bg-muted border border-border overflow-hidden transition-transform group-hover:scale-110 shadow-sm" :title="org.DisplayName">
                      <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full" />
                    </div>
                  </router-link>
                </div>
                <div v-else class="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-lg border border-border/50 border-dashed">
                  {{ t('dashboard.noOrgs') }}
                </div>
                <Button variant="ghost" size="sm" class="w-full border border-dashed border-border text-muted-foreground hover:text-foreground">
                  <Plus class="size-3 mr-2" /> {{ t('dashboard.createOrg') }}
                </Button>
              </div>
            </div>
          </aside>

          <!-- RIGHT COLUMN -->
          <main class="lg:col-span-8 xl:col-span-9 min-w-0 pt-6">
            <Tabs default-value="overview" class="w-full">
              <!-- Tabs List (Same as before) -->
              <div class="sticky top-0 z-30 bg-background/95 backdrop-blur-md pb-0 pt-2 -mt-2 border-b border-border/60">
                <TabsList class="no-scrollbar w-full justify-start h-auto p-0 bg-transparent rounded-none gap-2 overflow-x-auto">
                  <TabsTrigger value="overview" class="relative rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/60 data-[state=active]:border-b-background data-[state=active]:bg-background text-muted-foreground px-4 py-3 font-bold text-sm transition-all -mb-px hover:text-foreground">
                    <BookOpen class="size-4 mr-2" /> {{ t('dashboard.overview') }}
                  </TabsTrigger>
                  <TabsTrigger value="projects" class="relative rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/60 data-[state=active]:border-b-background data-[state=active]:bg-background text-muted-foreground px-4 py-3 font-bold text-sm transition-all -mb-px hover:text-foreground">
                    <FolderGit2 class="size-4 mr-2" /> {{ t('dashboard.projects') }}
                  </TabsTrigger>
                  <TabsTrigger v-if="isPersonal" value="experience" class="relative rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/60 data-[state=active]:border-b-background data-[state=active]:bg-background text-muted-foreground px-4 py-3 font-bold text-sm transition-all -mb-px hover:text-foreground">
                    <Briefcase class="size-4 mr-2" /> {{ t('dashboard.experience') }}
                  </TabsTrigger>
                  <TabsTrigger value="resources" class="relative rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/60 data-[state=active]:border-b-background data-[state=active]:bg-background text-muted-foreground px-4 py-3 font-bold text-sm transition-all -mb-px hover:text-foreground">
                    <div class="flex items-center gap-2"><ImageIcon class="size-4" /> {{ t('dashboard.resources') }}</div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <!-- TAB: Overview -->
              <TabsContent value="overview" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-6">
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ t('dashboard.readme') }}</span>
                    <Button variant="ghost" size="sm" class="h-6 text-xs" @click="goToEditProfile('content')">
                      <Edit2 class="size-3 mr-1" /> {{ t('common.edit') }}
                    </Button>
                  </div>
                  <Card class="border-border/60 shadow-sm overflow-hidden">
                    <CardContent class="p-6 sm:p-8">
                      <div v-if="renderedContent" class="prose dark:prose-invert prose-sm sm:prose-base max-w-none wrap-break-word">
                        <div v-html="renderedContent"></div>
                      </div>
                      <div v-else class="flex flex-col items-center justify-center py-10 text-center gap-4">
                        <div class="space-y-1">
                          <h3 class="font-bold text-lg">{{ t('dashboard.tellWorld') }}</h3>
                          <p class="text-muted-foreground text-sm max-w-md">{{ t('dashboard.tellWorldDesc') }}</p>
                        </div>
                        <Button variant="outline" class="mt-2" @click="goToEditProfile('content')">{{ t('dashboard.createReadme') }}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <!-- Projects Preview (Same as before) -->
              </TabsContent>

              <!-- TAB: Projects -->
              <TabsContent value="projects" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div>
                    <h3 class="font-bold">{{ t('dashboard.repositories') }}</h3>
                    <p class="text-xs text-muted-foreground">{{ t('dashboard.repoSubtitle') }}</p>
                  </div>
                  <div class="flex gap-2">
                    <Button class="font-bold gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white" @click="goToManage('projects')">
                      <Plus class="size-4" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                </div>
                <!-- Project List (Same as before) -->
                <div class="flex flex-col gap-3">
                  <Card v-for="proj in projects" :key="proj.Id" class="flex flex-col sm:flex-row sm:items-center p-4 gap-4 border-border/60 hover:bg-muted/10 transition-colors">
                    <!-- ... Project Card Content ... -->
                    <div class="size-12 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 shadow-sm">
                      <AssetView :asset="proj.Logo" :fallback-name="proj.Name" />
                    </div>
                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex items-center gap-2">
                        <h4 class="font-bold truncate text-base">{{ proj.Name }}</h4>
                        <Badge variant="secondary" class="text-[10px] h-5 font-bold">{{ proj.Visibility }}</Badge>
                      </div>
                      <p class="text-sm text-muted-foreground truncate">{{ proj.Summary }}</p>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <!-- TAB: Experience -->
              <TabsContent v-if="isPersonal" value="experience" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-6">
                <!-- Work -->
                <section>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-lg flex items-center gap-2">{{ t('dashboard.workExp') }}</h3>
                    <Button variant="outline" size="sm" class="h-8 gap-1" @click="goToManage('work')">
                      <Plus class="size-3" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <!-- Work List (Same as before) -->
                  <div class="relative pl-4 sm:pl-8 space-y-10 before:absolute before:left-2 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-linear-to-b before:from-border before:to-transparent">
                    <div v-for="job in work" :key="job.Id" class="relative group">
                      <!-- ... Work Item ... -->
                      <div class="absolute -left-6.25 sm:-left-8.25 top-1.5 size-3.5 rounded-full bg-background border-[3px] border-muted-foreground group-hover:border-brand-purple transition-colors shadow-[0_0_0_4px_rgba(0,0,0,0)] group-hover:shadow-[0_0_0_4px_var(--color-muted)]"></div>
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <div class="size-10 rounded-lg border bg-white dark:bg-black p-1 shrink-0 flex items-center justify-center">
                            <AssetView :asset="job.Logo" :fallback-name="job.CompanyName" class-name="rounded" />
                          </div>
                          <div>
                            <h4 class="font-bold text-base leading-none">{{ job.Position }}</h4>
                            <div class="text-sm font-medium text-foreground/70 mt-1">{{ job.CompanyName }}</div>
                          </div>
                        </div>
                        <span class="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full whitespace-nowrap self-start">
                              {{ formatDate(job.StartDate) }} - {{ formatDate(job.EndDate) }}
                           </span>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Education -->
                <section>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-lg flex items-center gap-2">{{ t('dashboard.education') }}</h3>
                    <Button variant="outline" size="sm" class="h-8 gap-1" @click="goToManage('education')">
                      <Plus class="size-3" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <!-- Education List (Same as before) -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card v-for="edu in education" :key="edu.Id" class="border-border/60 hover:bg-muted/5 transition-colors">
                      <CardContent class="p-5 flex gap-4">
                        <div class="size-12 rounded-xl bg-white dark:bg-zinc-900 border flex items-center justify-center shrink-0 shadow-sm">
                          <AssetView :asset="edu.Logo" :fallback-name="edu.SchoolName" class-name="p-1" />
                        </div>
                        <div>
                          <h4 class="font-bold">{{ edu.SchoolName }}</h4>
                          <p class="text-sm font-medium text-foreground/70">{{ edu.Degree }}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              <!-- TAB: Resources -->
              <TabsContent value="resources" class="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-6 space-y-12">
                <!-- Sponsorships -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><Heart class="size-4 text-pink-500" /> {{ t('dashboard.sponsorships') }}</h3>
                    <Button variant="ghost" size="sm" @click="goToManage('sponsorships')">
                      <ExternalLink class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div v-if="sponsorships.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Card v-for="spon in sponsorships" :key="spon.Id" class="hover:border-pink-500/30 transition-colors">
                      <CardContent class="p-4 flex items-center gap-4">
                        <AssetView :asset="spon.Icon" class-name="size-10 rounded-lg" />
                        <div class="min-w-0">
                          <div class="font-bold truncate">{{ spon.Platform }}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div v-else class="text-sm text-muted-foreground italic border border-dashed p-4 rounded-lg text-center">
                    No sponsorships enabled.
                  </div>
                </section>

                <!-- Certificates -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><Key class="size-4 text-emerald-500" /> {{ t('dashboard.certificates') }}</h3>
                    <Button size="sm" variant="outline" @click="goToManage('certificates')">
                      <Plus class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <!-- Cert List (Same as before) -->
                  <div v-if="certificates.length > 0" class="flex flex-col gap-3">
                    <Card v-for="cert in certificates" :key="cert.Id" class="border-border/60">
                      <CardContent class="p-4">
                        <div class="flex items-start justify-between gap-4">
                          <div class="space-y-1 min-w-0">
                            <h4 class="font-bold font-mono">{{ cert.Name }}</h4>
                            <code class="text-xs text-muted-foreground font-mono break-all">{{ cert.Fingerprint }}</code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <!-- Gallery -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><ImageIcon class="size-4 text-brand-blue" /> {{ t('dashboard.galleryItems') }}</h3>
                    <Button size="sm" @click="goToManage('gallery')">
                      <Plus class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <!-- Gallery Grid (Same as before) -->
                  <div v-if="gallery.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div v-for="item in gallery" :key="item.Id" class="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted">
                      <AssetView :asset="item.Image" class-name="w-full h-full object-cover" />
                    </div>
                  </div>
                </section>
              </TabsContent>

            </Tabs>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
