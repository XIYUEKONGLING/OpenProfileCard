<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { renderMarkdown } from '@/lib/markdown';
import type {
  ProfileDto,
  ProjectDto,
  WorkExperienceDto,
  EducationExperienceDto,
  OrganizationDto,
  GalleryItemDto,
  SocialLinkDto
} from '@/api/types';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent
} from '@/components/ui/card';

// Icons
import {
  MapPin, Link as LinkIcon, Building2, Clock,
  Edit2, Plus, Briefcase,
  FolderGit2, Image as ImageIcon,
  Settings, Shield, BookOpen
} from 'lucide-vue-next';

const { t, locale } = useI18n();
const auth = useAuthStore();

// --- State ---
const isLoading = ref(true);
const profile = ref<ProfileDto | null>(null);
const projects = ref<ProjectDto[]>([]);
const work = ref<WorkExperienceDto[]>([]);
const education = ref<EducationExperienceDto[]>([]);
const orgs = ref<OrganizationDto[]>([]);
const gallery = ref<GalleryItemDto[]>([]);
const socials = ref<SocialLinkDto[]>([]);

// --- Computed ---
const renderedContent = computed(() => renderMarkdown(profile.value?.Content));

const joinDate = computed(() => {
  if (!auth.user?.CreatedAt) return '';
  const date = new Date(auth.user.CreatedAt);
  if (locale.value === 'zh') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    const [
      profileData,
      projectsData,
      workData,
      eduData,
      orgsData,
      galleryData,
      socialsData
    ] = await Promise.all([
      httpClient<ProfileDto>('/me/profile'),
      httpClient<ProjectDto[]>('/me/projects'),
      httpClient<WorkExperienceDto[]>('/me/work'),
      httpClient<EducationExperienceDto[]>('/me/education'),
      httpClient<OrganizationDto[]>('/api/orgs'),
      httpClient<GalleryItemDto[]>('/me/gallery'),
      httpClient<SocialLinkDto[]>('/me/socials')
    ]);

    profile.value = profileData;
    projects.value = projectsData || [];
    work.value = workData || [];
    education.value = eduData || [];
    orgs.value = orgsData || [];
    gallery.value = galleryData || [];
    socials.value = socialsData || [];

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
</script>

<template>
  <div class="container max-w-full lg:max-w-7xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-4 xl:col-span-3 space-y-6">
        <div class="aspect-square rounded-full bg-muted animate-pulse"></div>
        <div class="h-8 bg-muted rounded w-3/4 animate-pulse"></div>
        <div class="h-4 bg-muted rounded w-full animate-pulse"></div>
      </div>
      <div class="lg:col-span-8 xl:col-span-9 space-y-6">
        <div class="h-12 bg-muted rounded-t-lg animate-pulse"></div>
        <div class="h-64 bg-muted rounded-b-lg animate-pulse"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      <!-- ========================================== -->
      <!-- LEFT COLUMN: Identity (Profile)           -->
      <!-- ========================================== -->
      <aside class="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-6">

        <!-- Avatar & Status -->
        <div class="relative group mx-auto lg:mx-0 w-full max-w-70">
          <div class="aspect-square rounded-full border-4 border-background shadow-2xl overflow-hidden bg-muted relative z-10">
            <AssetView
                :asset="profile?.Avatar"
                :fallback-name="profile?.DisplayName || auth.user?.AccountName"
                class-name="w-full h-full object-cover"
            />
          </div>
          <!-- Role Badge -->
          <div v-if="auth.isAdmin" class="absolute bottom-5 right-5 z-20">
            <div class="bg-brand-blue text-white p-1.5 rounded-full shadow-lg" title="Administrator">
              <Shield class="size-4" />
            </div>
          </div>
        </div>

        <!-- Names & Bio -->
        <div class="space-y-1 text-center lg:text-left">
          <h1 class="text-3xl font-black tracking-tight leading-tight">
            {{ profile?.DisplayName || auth.user?.AccountName }}
          </h1>
          <p class="text-xl text-muted-foreground font-medium">
            @{{ auth.user?.AccountName }}
          </p>
        </div>

        <!-- Bio Text -->
        <div v-if="profile?.Description" class="text-sm leading-relaxed text-foreground/80 text-center lg:text-left">
          {{ profile.Description }}
        </div>

        <Button class="w-full font-bold shadow-sm rounded-xl" variant="outline">
          {{ t('profile.editProfile') }}
        </Button>

        <!-- Metadata Grid -->
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

        <Separator />

        <!-- Organizations -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">{{ t('dashboard.organizations') }}</h3>
          </div>

          <div v-if="orgs.length > 0" class="flex flex-wrap gap-2">
            <router-link
                v-for="org in orgs"
                :key="org.Id"
                :to="`/orgs/${org.AccountName}`"
                class="relative group"
            >
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
      </aside>

      <!-- ========================================== -->
      <!-- RIGHT COLUMN: Workspace (Tabs)            -->
      <!-- ========================================== -->
      <main class="lg:col-span-8 xl:col-span-9 min-w-0">

        <Tabs default-value="overview" class="w-full">
          <!-- Sticky Tab Bar -->
          <div class="sticky top-0 z-30 bg-background/80 backdrop-blur-md pb-4 pt-2 -mt-2">
            <TabsList class="w-full justify-start h-auto p-0 bg-transparent border-b border-border/60 rounded-none gap-6 overflow-x-auto scrollbar-none">
              <TabsTrigger
                  value="overview"
                  class="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-purple data-[state=active]:text-foreground text-muted-foreground px-1 py-3 font-bold text-sm transition-all"
              >
                <BookOpen class="size-4 mr-2" />
                {{ t('dashboard.overview') }}
              </TabsTrigger>

              <TabsTrigger
                  value="projects"
                  class="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-purple data-[state=active]:text-foreground text-muted-foreground px-1 py-3 font-bold text-sm transition-all"
              >
                <FolderGit2 class="size-4 mr-2" />
                {{ t('dashboard.projects') }}
                <Badge variant="secondary" class="ml-2 rounded-full px-1.5 h-5 min-w-5 text-[10px] font-black">{{ projects.length }}</Badge>
              </TabsTrigger>

              <TabsTrigger
                  value="experience"
                  class="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-purple data-[state=active]:text-foreground text-muted-foreground px-1 py-3 font-bold text-sm transition-all"
              >
                <Briefcase class="size-4 mr-2" />
                {{ t('dashboard.experience') }}
              </TabsTrigger>

              <TabsTrigger
                  value="assets"
                  class="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-purple data-[state=active]:text-foreground text-muted-foreground px-1 py-3 font-bold text-sm transition-all"
              >
                <ImageIcon class="size-4 mr-2" />
                {{ t('dashboard.gallery') }}
              </TabsTrigger>
            </TabsList>
          </div>

          <!-- TAB: Overview (README) -->
          <TabsContent value="overview" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">

            <!-- README Card -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ t('dashboard.readme') }}</span>
                <Button variant="ghost" size="sm" class="h-6 text-xs">
                  <Edit2 class="size-3 mr-1" /> {{ t('common.edit') }}
                </Button>
              </div>

              <Card class="border-border/60 shadow-sm overflow-hidden">
                <CardContent class="p-6 sm:p-8">
                  <div v-if="renderedContent" class="prose dark:prose-invert prose-sm sm:prose-base max-w-none wrap-break-word">
                    <div v-html="renderedContent"></div>
                  </div>

                  <!-- Empty State for README -->
                  <div v-else class="flex flex-col items-center justify-center py-10 text-center gap-4">
                    <div class="size-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <BookOpen class="size-8 text-muted-foreground/40" />
                    </div>
                    <div class="space-y-1">
                      <h3 class="font-bold text-lg">{{ t('dashboard.tellWorld') }}</h3>
                      <p class="text-muted-foreground text-sm max-w-md">
                        {{ t('dashboard.tellWorldDesc') }}
                      </p>
                    </div>
                    <Button variant="outline" class="mt-2">{{ t('dashboard.createReadme') }}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Recent Projects Preview -->
            <div v-if="projects.length > 0">
              <h3 class="font-bold text-lg mb-4">{{ t('dashboard.recentProjects') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card v-for="proj in projects.slice(0, 4)" :key="proj.Id" class="group hover:border-brand-purple/50 transition-colors cursor-pointer border-border/60 bg-transparent">
                  <CardContent class="p-4 flex flex-col h-full">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2 font-bold text-base group-hover:text-brand-purple transition-colors">
                        <FolderGit2 class="size-4 text-muted-foreground" />
                        <span class="truncate">{{ proj.Name }}</span>
                      </div>
                      <Badge variant="outline" class="text-[10px] uppercase font-bold">{{ proj.Visibility }}</Badge>
                    </div>
                    <p class="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
                      {{ proj.Summary || t('common.noDescription') }}
                    </p>
                    <div class="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-yellow-400"></span> Mock Lang</span>
                      <span v-if="proj.Url" class="hover:text-foreground transition-colors">{{ t('common.website') }}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <!-- TAB: Projects (List View) -->
          <TabsContent value="projects" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div>
                <h3 class="font-bold">{{ t('dashboard.repositories') }}</h3>
                <p class="text-xs text-muted-foreground">{{ t('dashboard.repoSubtitle') }}</p>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1 sm:w-64">
                  <!-- Search input could go here -->
                </div>
                <Button class="font-bold gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white">
                  <Plus class="size-4" /> {{ t('common.create') }}
                </Button>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <Card v-for="proj in projects" :key="proj.Id" class="flex flex-col sm:flex-row sm:items-center p-4 gap-4 border-border/60 hover:bg-muted/10 transition-colors">
                <div class="size-12 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 shadow-sm">
                  <AssetView :asset="proj.Logo" :fallback-name="proj.Name" />
                </div>
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold truncate text-base hover:text-brand-purple cursor-pointer">{{ proj.Name }}</h4>
                    <Badge variant="secondary" class="text-[10px] h-5 font-bold">{{ proj.Visibility }}</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground truncate">{{ proj.Summary }}</p>
                  <div v-if="proj.Url" class="flex items-center gap-1 text-xs text-brand-blue font-medium">
                    <LinkIcon class="size-3" /> {{ proj.Url }}
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center">
                  <span class="text-xs text-muted-foreground mr-2 hidden sm:block">{{ t('dashboard.updatedRecently') }}</span>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Settings class="size-4" />
                  </Button>
                </div>
              </Card>

              <div v-if="projects.length === 0" class="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
                <p class="text-muted-foreground font-medium">{{ t('dashboard.noProjects') }}</p>
              </div>
            </div>
          </TabsContent>

          <!-- TAB: Experience (Timeline) -->
          <TabsContent value="experience" class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">

            <!-- Work -->
            <section>
              <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  {{ t('dashboard.workExp') }}
                </h3>
                <Button variant="outline" size="sm" class="h-8 gap-1">
                  <Plus class="size-3" /> {{ t('common.add') }}
                </Button>
              </div>

              <div class="relative pl-4 sm:pl-8 space-y-10 before:absolute before:left-2 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-linear-to-b before:from-border before:to-transparent">
                <div v-for="job in work" :key="job.Id" class="relative group">
                  <!-- Dot -->
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
                  <div v-if="job.Description" class="text-sm text-muted-foreground mt-3 leading-relaxed pl-[52px]">
                    {{ job.Description }}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <!-- Education -->
            <section>
              <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  {{ t('dashboard.education') }}
                </h3>
                <Button variant="outline" size="sm" class="h-8 gap-1">
                  <Plus class="size-3" /> {{ t('common.add') }}
                </Button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card v-for="edu in education" :key="edu.Id" class="border-border/60 hover:bg-muted/5 transition-colors">
                  <CardContent class="p-5 flex gap-4">
                    <div class="size-12 rounded-xl bg-white dark:bg-zinc-900 border flex items-center justify-center shrink-0 shadow-sm">
                      <AssetView :asset="edu.Logo" :fallback-name="edu.SchoolName" class-name="p-1" />
                    </div>
                    <div>
                      <h4 class="font-bold">{{ edu.SchoolName }}</h4>
                      <p class="text-sm font-medium text-foreground/70">{{ edu.Degree }} <span v-if="edu.Major">• {{ edu.Major }}</span></p>
                      <p class="text-xs text-muted-foreground mt-2 font-mono">{{ formatDate(edu.StartDate) }} - {{ formatDate(edu.EndDate) }}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <!-- TAB: Assets/Gallery -->
          <TabsContent value="assets" class="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold">{{ t('dashboard.galleryItems') }}</h3>
              <Button size="sm"><Plus class="size-4 mr-2" /> {{ t('common.upload') }}</Button>
            </div>

            <div v-if="gallery.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="item in gallery" :key="item.Id" class="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted">
                <AssetView :asset="item.Image" class-name="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div class="flex gap-2">
                    <Button size="icon" variant="secondary" class="size-8 rounded-full"><Edit2 class="size-3" /></Button>
                  </div>
                </div>
                <div v-if="item.Caption" class="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-bold truncate">
                  {{ item.Caption }}
                </div>
              </div>
            </div>

            <div v-else class="text-center py-16 border-2 border-dashed border-border rounded-xl bg-muted/10">
              <div class="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ImageIcon class="size-6 text-muted-foreground" />
              </div>
              <h3 class="font-bold">{{ t('dashboard.noAssets') }}</h3>
              <p class="text-sm text-muted-foreground mt-1 mb-4">{{ t('dashboard.noAssetsDesc') }}</p>
              <Button variant="outline">{{ t('dashboard.uploadFirst') }}</Button>
            </div>
          </TabsContent>

        </Tabs>

      </main>
    </div>
  </div>
</template>

<style scoped>
@reference '../style.css';

:deep(.prose) {
  font-size: 0.95rem;
  line-height: 1.7;
}

:deep(.prose a) {
  /* @apply text-brand-blue no-underline hover:underline;  <-- OLD (Caused error) */
  color: var(--color-brand-blue);
  text-decoration: none;
}

:deep(.prose a:hover) {
  text-decoration: underline;
}

:deep(.prose h1), :deep(.prose h2) {
  @apply font-black tracking-tight mt-8 mb-4;
}

:deep(.prose ul) {
  @apply list-disc pl-5;
}
</style>
