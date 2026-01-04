<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
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
  AccountType,
  AssetType
} from '@/api/types';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import ImageViewer from '@/components/ui/ImageViewer.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  MoreHorizontal, UserPlus, UserMinus, Ban,
  Briefcase, FolderGit2, Users, BookOpen, Heart,
  Image as ImageIcon, GraduationCap, Key, Mail, Phone, MessageSquare
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const auth = useAuthStore();
const ui = useUIStore();

// --- State ---
const isLoading = ref(true);
const notFound = ref(false);
const profile = ref<ProfileDto | null>(null);
const followStatus = ref<FollowStatusDto | null>(null);
const actionLoading = ref(false);

// Sub-resources
const projects = ref<ProjectDto[]>([]);
const members = ref<OrganizationMemberDto[]>([]);
const work = ref<WorkExperienceDto[]>([]);
const education = ref<EducationExperienceDto[]>([]);
const gallery = ref<GalleryItemDto[]>([]);
const sponsorships = ref<SponsorshipItemDto[]>([]);
const certificates = ref<CertificateDto[]>([]);
const contacts = ref<ContactMethodDto[]>([]);

// UI State
const showImageViewer = ref(false);
const selectedImage = ref<AssetDto | null>(null);
const showBlockDialog = ref(false);

// --- Computed ---
const isOrg = computed(() => profile.value?.Type === AccountType.Organization);
const isPersonal = computed(() => profile.value?.Type === AccountType.Personal);
const isMe = computed(() => auth.user && profile.value && auth.user.AccountName === profile.value.AccountName);
const renderedContent = computed(() => renderMarkdown(profile.value?.Content));

const joinDate = computed(() => {
  const dateStr = profile.value?.FoundedDate || (profile.value as any)?.CreatedAt;
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });
});

// --- Actions ---

const fetchPublicData = async () => {
  const id = route.params.id as string;
  if (!id) return;

  isLoading.value = true;
  notFound.value = false;

  try {
    // 1. Fetch Main Profile
    const profileData = await httpClient<ProfileDto>(`/profiles/${id}`);
    profile.value = profileData;

    // 2. Fetch Sub-resources (Parallel)
    const promises: Promise<any>[] = [
      httpClient<ProjectDto[]>(`/profiles/${id}/projects`).then(res => projects.value = res || []),
      httpClient<GalleryItemDto[]>(`/profiles/${id}/gallery`).then(res => gallery.value = res || []),
      httpClient<SponsorshipItemDto[]>(`/profiles/${id}/sponsorships`).then(res => sponsorships.value = res || []),
      httpClient<ContactMethodDto[]>(`/profiles/${id}/contacts`).then(res => contacts.value = res || []),
    ];

    if (profileData.Type === AccountType.Organization) {
      promises.push(
          httpClient<OrganizationMemberDto[]>(`/profiles/${id}/members`).then(res => members.value = res || [])
      );
    } else {
      // Personal Only
      promises.push(
          httpClient<WorkExperienceDto[]>(`/profiles/${id}/work`).then(res => work.value = res || []),
          httpClient<EducationExperienceDto[]>(`/profiles/${id}/education`).then(res => education.value = res || []),
          httpClient<CertificateDto[]>(`/profiles/${id}/certificates`).then(res => certificates.value = res || [])
      );
    }

    // 3. Check Follow Status (if logged in and not self)
    if (auth.isAuthenticated && auth.user?.AccountName !== profileData.AccountName) {
      promises.push(
          httpClient<FollowStatusDto>(`/profiles/${id}/follow`).then(res => followStatus.value = res)
      );
    }

    await Promise.all(promises);

  } catch (e) {
    console.error(e);
    notFound.value = true;
  } finally {
    isLoading.value = false;
  }
};

const handleFollow = async () => {
  if (!profile.value) return;
  actionLoading.value = true;
  try {
    if (followStatus.value?.IsFollowing) {
      await httpClient(`/profiles/${profile.value.AccountName}/follow`, { method: 'DELETE' });
      if (followStatus.value) followStatus.value.IsFollowing = false;
      profile.value.FollowersCount--;
    } else {
      await httpClient(`/profiles/${profile.value.AccountName}/follow`, { method: 'POST' });
      if (followStatus.value) followStatus.value.IsFollowing = true;
      profile.value.FollowersCount++;
    }
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = false;
  }
};

const confirmBlock = () => {
  showBlockDialog.value = true;
};

const executeBlock = async () => {
  if (!profile.value) return;
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
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
};

// Watch route change to refetch
watch(() => route.params.id, fetchPublicData, { immediate: true });
</script>

<template>
  <div class="w-full pb-20">

    <!-- Image Viewer -->
    <ImageViewer v-model:open="showImageViewer" :asset="selectedImage" />

    <!-- Block Confirmation -->
    <AlertDialog v-model:open="showBlockDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('publicProfile.blockConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('publicProfile.blockConfirmDesc', { name: profile?.DisplayName }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="executeBlock" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ t('publicProfile.block') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 404 State -->
    <div v-if="notFound" class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
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
          <div class="h-4 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div class="lg:col-span-3 h-96 bg-muted rounded-xl animate-pulse"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="animate-in fade-in duration-700">

      <!-- 1. Hero Banner -->
      <div class="h-48 md:h-80 w-full bg-muted overflow-hidden relative group">
        <div class="absolute inset-0 bg-linear-to-b from-transparent to-black/20 z-10 pointer-events-none"></div>
        <AssetView
            :asset="profile?.Background"
            class-name="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
            @click="openImage(profile?.Background)"
        />
      </div>

      <div class="container max-w-7xl mx-auto px-4 sm:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <!-- LEFT COLUMN: Sticky Info -->
          <div class="lg:col-span-4 xl:col-span-3 relative">
            <div class="lg:sticky lg:top-24 -mt-16 lg:-mt-20 mb-8 space-y-6">

              <!-- Avatar -->
              <div class="relative group w-fit">
                <div class="size-32 md:size-40 rounded-full border-[6px] border-background bg-background shadow-xl overflow-hidden cursor-pointer" @click="openImage(profile?.Avatar)">
                  <AssetView
                      :asset="profile?.Avatar"
                      :fallback-name="profile?.DisplayName"
                      class-name="w-full h-full object-cover"
                  />
                </div>
                <div v-if="isOrg" class="absolute bottom-2 right-2 bg-brand-purple text-white p-1.5 rounded-full border-4 border-background shadow-sm" title="Organization">
                  <Building2 class="size-4" />
                </div>
              </div>

              <!-- Identity -->
              <div class="space-y-1">
                <h1 class="text-3xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  {{ profile?.DisplayName }}
                  <Badge v-if="profile?.Pronouns" variant="secondary" class="text-xs font-normal">{{ profile.Pronouns }}</Badge>
                </h1>
                <p class="text-lg text-muted-foreground font-medium">@{{ profile?.AccountName }}</p>
              </div>

              <!-- Bio -->
              <p v-if="profile?.Description" class="text-base leading-relaxed text-foreground/80">
                {{ profile.Description }}
              </p>

              <!-- Actions -->
              <div class="flex flex-wrap gap-2">
                <template v-if="auth.isAuthenticated && !isMe">
                  <Button
                      :variant="followStatus?.IsFollowing ? 'outline' : 'default'"
                      class="flex-1 font-bold rounded-full"
                      :disabled="actionLoading"
                      @click="handleFollow"
                  >
                    <template v-if="followStatus?.IsFollowing">
                      <UserMinus class="size-4 mr-2" /> {{ t('publicProfile.unfollow') }}
                    </template>
                    <template v-else>
                      <UserPlus class="size-4 mr-2" /> {{ t('publicProfile.follow') }}
                    </template>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="outline" size="icon" class="rounded-full">
                        <MoreHorizontal class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem class="text-destructive focus:text-destructive cursor-pointer" @click="confirmBlock">
                        <Ban class="size-4 mr-2" /> {{ t('publicProfile.block') }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </template>

                <template v-else-if="isMe">
                  <Button variant="outline" class="w-full rounded-full font-bold" @click="router.push('/dashboard/profile/edit')">
                    {{ t('common.edit') }}
                  </Button>
                </template>
              </div>

              <!-- Metadata -->
              <div class="space-y-3 text-sm text-muted-foreground pt-2">
                <div v-if="profile?.CurrentCompany" class="flex items-center gap-3">
                  <Building2 class="size-4 shrink-0" />
                  <span class="text-foreground">{{ profile.CurrentCompany }}</span>
                </div>
                <div v-if="profile?.Location" class="flex items-center gap-3">
                  <MapPin class="size-4 shrink-0" />
                  <span>{{ profile.Location }}</span>
                </div>
                <div v-if="profile?.Website" class="flex items-center gap-3">
                  <LinkIcon class="size-4 shrink-0" />
                  <a :href="profile.Website" target="_blank" class="text-brand-blue hover:underline truncate">{{ profile.Website }}</a>
                </div>
                <div v-if="joinDate" class="flex items-center gap-3">
                  <Calendar class="size-4 shrink-0" />
                  <span>{{ t('publicProfile.joined', { date: joinDate }) }}</span>
                </div>
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-6 text-sm pt-2 border-t border-border/50">
                <div class="flex items-center gap-1">
                  <span class="font-black text-foreground">{{ profile?.FollowingCount }}</span>
                  <span class="text-muted-foreground">{{ t('publicProfile.following') }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-black text-foreground">{{ profile?.FollowersCount }}</span>
                  <span class="text-muted-foreground">{{ t('publicProfile.followers') }}</span>
                </div>
              </div>

              <!-- Contacts (Public) -->
              <div v-if="contacts.length > 0" class="pt-4 space-y-2">
                <h3 class="text-xs font-bold uppercase text-muted-foreground tracking-wider">{{ t('publicProfile.contact') }}</h3>
                <div class="flex flex-wrap gap-2">
                  <div v-for="c in contacts" :key="c.Id" class="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50 border border-border/50">
                    <AssetView v-if="c.Icon && c.Icon.Type !== 0" :asset="c.Icon" class-name="size-4" />
                    <Mail v-else class="size-4" />
                    <span class="font-medium select-all">{{ c.Value }}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- RIGHT COLUMN: Content Tabs -->
          <div class="lg:col-span-8 xl:col-span-9 pt-8 min-w-0">
            <Tabs defaultValue="overview" class="w-full">
              <TabsList class="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none gap-6 mb-8 overflow-x-auto no-scrollbar">
                <TabsTrigger value="overview" class="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
                  <BookOpen class="size-4 mr-2" /> {{ t('publicProfile.about') }}
                </TabsTrigger>

                <TabsTrigger value="projects" class="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
                  <FolderGit2 class="size-4 mr-2" /> {{ t('publicProfile.projects') }}
                  <Badge variant="secondary" class="ml-2">{{ projects.length }}</Badge>
                </TabsTrigger>

                <TabsTrigger v-if="isOrg" value="members" class="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
                  <Users class="size-4 mr-2" /> {{ t('publicProfile.members') }}
                  <Badge variant="secondary" class="ml-2">{{ members.length }}</Badge>
                </TabsTrigger>

                <TabsTrigger v-if="isPersonal" value="experience" class="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
                  <Briefcase class="size-4 mr-2" /> {{ t('publicProfile.experience') }}
                </TabsTrigger>

                <TabsTrigger value="resources" class="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">
                  <ImageIcon class="size-4 mr-2" /> {{ t('publicProfile.resources') }}
                </TabsTrigger>
              </TabsList>

              <!-- TAB: Overview -->
              <TabsContent value="overview" class="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                <!-- Readme -->
                <Card class="border-none shadow-none bg-transparent">
                  <CardContent class="p-0">
                    <div v-if="renderedContent" class="prose dark:prose-invert max-w-none prose-neutral prose-img:rounded-xl" v-html="renderedContent"></div>
                    <div v-else class="text-muted-foreground italic py-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center">
                      <BookOpen class="size-8 mb-2 opacity-20" />
                      {{ t('publicProfile.noDescription') }}
                    </div>
                  </CardContent>
                </Card>

                <!-- Sponsorships (Prominent) -->
                <div v-if="sponsorships.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Heart class="size-5 text-pink-500" /> {{ t('publicProfile.sponsorships') }}</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card v-for="spon in sponsorships" :key="spon.Id" class="hover:border-pink-500/30 transition-colors cursor-pointer" @click="openUrl(spon.Url)">
                      <CardContent class="p-4 flex items-center gap-4">
                        <AssetView :asset="spon.Icon" class-name="size-10 rounded-lg" />
                        <div class="min-w-0">
                          <div class="font-bold truncate">{{ spon.Platform }}</div>
                          <div class="text-xs text-muted-foreground truncate">{{ spon.Url }}</div>
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
                        <AssetView :asset="proj.Logo" :fallback-name="proj.Name" class-name="w-full h-full object-cover" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <h3 class="font-bold text-lg group-hover:text-brand-blue transition-colors truncate">{{ proj.Name }}</h3>
                        </div>
                        <p class="text-sm text-muted-foreground line-clamp-2">{{ proj.Summary }}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div v-else class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  {{ t('dashboard.noProjects') }}
                </div>
              </TabsContent>

              <!-- TAB: Members (Org Only) -->
              <TabsContent v-if="isOrg" value="members" class="animate-in fade-in slide-in-from-bottom-2">
                <div v-if="members.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <router-link v-for="member in members" :key="member.AccountId" :to="`/${member.AccountName}`">
                    <Card class="hover:bg-muted/50 transition-colors">
                      <CardContent class="p-4 flex items-center gap-4">
                        <div class="size-12 rounded-full bg-muted border overflow-hidden shrink-0">
                          <AssetView :asset="member.Avatar" :fallback-name="member.DisplayName" class-name="w-full h-full object-cover" />
                        </div>
                        <div class="min-w-0">
                          <div class="font-bold truncate">{{ member.DisplayName }}</div>
                          <div class="text-xs text-muted-foreground truncate">@{{ member.AccountName }}</div>
                          <Badge variant="outline" class="mt-1 text-[10px] h-5">{{ member.Role }}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </router-link>
                </div>
                <div v-else class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  {{ t('publicProfile.noMembers') }}
                </div>
              </TabsContent>

              <!-- TAB: Experience (Personal Only) -->
              <TabsContent v-if="isPersonal" value="experience" class="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                <!-- Work -->
                <div v-if="work.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Briefcase class="size-5" /> {{ t('publicProfile.work') }}</h3>
                  <div class="relative pl-6 border-l-2 border-muted space-y-8">
                    <div v-for="job in work" :key="job.Id" class="relative">
                      <div class="absolute -left-[29px] top-1 size-3.5 rounded-full bg-background border-2 border-muted-foreground"></div>
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div class="flex items-center gap-3">
                          <div class="size-10 rounded-lg border bg-white dark:bg-black p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            <AssetView :asset="job.Logo" :fallback-name="job.CompanyName" class-name="w-full h-full object-contain rounded-md" />
                          </div>
                          <div>
                            <h4 class="font-bold text-base leading-none">{{ job.Position }}</h4>
                            <div class="text-sm font-medium text-foreground/70 mt-1">{{ job.CompanyName }}</div>
                          </div>
                        </div>
                        <span class="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md whitespace-nowrap self-start">
                          {{ formatDate(job.StartDate) }} - {{ formatDate(job.EndDate) }}
                        </span>
                      </div>
                      <p v-if="job.Description" class="text-sm text-muted-foreground mt-2 ml-13">{{ job.Description }}</p>
                    </div>
                  </div>
                </div>

                <!-- Education -->
                <div v-if="education.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap class="size-5" /> {{ t('publicProfile.education') }}</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card v-for="edu in education" :key="edu.Id" class="border-border/60">
                      <CardContent class="p-5 flex gap-4">
                        <div class="size-12 rounded-xl bg-white dark:bg-zinc-900 border flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                          <AssetView :asset="edu.Logo" :fallback-name="edu.SchoolName" class-name="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h4 class="font-bold">{{ edu.SchoolName }}</h4>
                          <p class="text-sm font-medium text-foreground/70">{{ edu.Degree }}</p>
                          <p class="text-xs text-muted-foreground mt-1">{{ formatDate(edu.StartDate) }} - {{ formatDate(edu.EndDate) }}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <!-- TAB: Resources -->
              <TabsContent value="resources" class="animate-in fade-in slide-in-from-bottom-2 space-y-8">

                <!-- Gallery -->
                <div v-if="gallery.length > 0">
                  <h3 class="font-bold text-lg mb-4">{{ t('publicProfile.gallery') }}</h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="item in gallery" :key="item.Id" class="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted cursor-pointer" @click="openImage(item.Image)">
                      <AssetView :asset="item.Image" class-name="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div v-if="item.Caption" class="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-bold truncate">
                        {{ item.Caption }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Certificates -->
                <div v-if="certificates.length > 0">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2"><Key class="size-5" /> {{ t('publicProfile.certificates') }}</h3>
                  <div class="flex flex-col gap-3">
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
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div v-if="gallery.length === 0 && certificates.length === 0" class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  {{ t('dashboard.noAssets') }}
                </div>
              </TabsContent>

            </Tabs>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
