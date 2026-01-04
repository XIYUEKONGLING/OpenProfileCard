<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import { renderMarkdown } from '@/lib/markdown';
import {
  type OrganizationDto,
  type ProjectDto,
  type GalleryItemDto,
  type SocialLinkDto,
  type ContactMethodDto,
  type SponsorshipItemDto,
  type FollowCountsDto,
  MemberRole,
  AccountStatus
} from '@/api/types';

// UI Components
import AssetView from '@/components/ui/AssetView.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin, Link as LinkIcon, Users, Edit2, Plus,
  FolderGit2, Image as ImageIcon, Settings, BookOpen,
  Heart, ExternalLink, LogOut, ShieldAlert,
  Crown, Mail, Phone, MessageSquare, MapPin as MapIcon, Link as LinkIcon2
} from 'lucide-vue-next';

const OrgMembers = defineAsyncComponent(() => import('@/components/org/OrgMembers.vue'));

const props = defineProps<{ accountName: string }>();

const { t } = useI18n();
const ui = useUIStore();
const router = useRouter();

// --- State ---
const isLoading = ref(true);
const org = ref<OrganizationDto | null>(null);
const followStats = ref<FollowCountsDto | null>(null);

const projects = ref<ProjectDto[]>([]);
const gallery = ref<GalleryItemDto[]>([]);
const socials = ref<SocialLinkDto[]>([]);
const contacts = ref<ContactMethodDto[]>([]);
const sponsorships = ref<SponsorshipItemDto[]>([]);

// --- Computed Permissions ---
const isOwner = computed(() => org.value?.MyRole === MemberRole.Owner);
const isAdmin = computed(() => org.value?.MyRole === MemberRole.Admin || isOwner.value);
// Guest/Member can view everything, but cannot edit
const canEdit = computed(() => isAdmin.value);

const renderedContent = computed(() => renderMarkdown(org.value?.Description)); // Note: OrganizationDto needs full profile fetch for Content if distinct
const hasBackground = computed(() => org.value?.Avatar && !!org.value.Avatar.Value); // Fallback logic

// --- Actions ---
const fetchOrgData = async () => {
  isLoading.value = true;
  try {
    // 1. Fetch Basic Org Info (Dashboard Summary)
    const orgData = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    org.value = orgData;

    // 2. Fetch Sub-resources (Parallel)
    // Note: Guests CAN fetch these now based on updated spec
    const [
      followData,
      projectsData,
      galleryData,
      socialsData,
      contactsData,
      sponsorshipsData
    ] = await Promise.all([
      httpClient<FollowCountsDto>(`/orgs/${props.accountName}/follow-stats`),
      httpClient<ProjectDto[]>(`/orgs/${props.accountName}/projects`),
      httpClient<GalleryItemDto[]>(`/orgs/${props.accountName}/gallery`),
      httpClient<SocialLinkDto[]>(`/orgs/${props.accountName}/socials`),
      httpClient<ContactMethodDto[]>(`/orgs/${props.accountName}/contacts`),
      httpClient<SponsorshipItemDto[]>(`/orgs/${props.accountName}/sponsorships`),
    ]);

    followStats.value = followData;
    projects.value = projectsData || [];
    gallery.value = galleryData || [];
    socials.value = socialsData || [];
    contacts.value = contactsData || [];
    sponsorships.value = sponsorshipsData || [];

  } catch (e: any) {
    ui.notify(e.message || 'Failed to load organization', 'error');
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
  }
};

const goToEditProfile = (tab: string = 'basic') => {
  router.push({ name: 'org-profile-edit', params: { accountName: props.accountName }, query: { tab } });
};

const goToSettings = () => {
  router.push({ name: 'org-settings', params: { accountName: props.accountName } });
};

const goToManage = (resource: string) => {
  router.push(`/dashboard/orgs/${props.accountName}/manage/${resource}`);
};

const leaveOrg = async () => {
  if (!confirm(t('organization.leaveConfirm'))) return;
  try {
    await httpClient(`/orgs/${props.accountName}/members/me`, { method: 'DELETE' });
    router.push('/dashboard');
    ui.notify(t('common.success'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

// Helper for Icons
const getContactIcon = (type: any) => {
  switch (Number(type)) {
    case 0: return Mail;
    case 1: return Phone;
    case 2: return MessageSquare;
    case 3: return MapIcon;
    default: return LinkIcon2;
  }
};

watch(() => props.accountName, fetchOrgData, { immediate: true });
</script>

<template>
  <div class="relative min-h-[80vh] w-full pb-20">

    <!-- Loading State -->
    <div v-if="isLoading" class="container max-w-7xl mx-auto px-4 mt-6 space-y-8">
      <div class="h-64 bg-muted rounded-xl animate-pulse"></div>
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="space-y-4">
          <div class="size-32 rounded-full bg-muted animate-pulse -mt-16 border-4 border-background"></div>
          <div class="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
        </div>
        <div class="lg:col-span-3 h-96 bg-muted rounded-xl animate-pulse"></div>
      </div>
    </div>

    <div v-else-if="org" class="animate-in fade-in slide-in-from-bottom-4 duration-700">

      <!-- HEADER BANNER (Optional: Orgs might not have backgrounds in DTO yet, using muted fallback) -->
      <div class="w-full h-48 md:h-64 bg-muted relative overflow-hidden group rounded-4xl mb-6">
        <div class="absolute inset-0 bg-linear-to-br from-brand-blue/10 to-brand-purple/10"></div>
        <div v-if="canEdit" class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" class="shadow-lg backdrop-blur-md bg-background/50" @click="goToEditProfile('visuals')">
            <Edit2 class="size-3 mr-2" /> {{ t('common.edit') }}
          </Button>
        </div>
      </div>

      <!-- MAIN CONTAINER -->
      <div class="container max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- LEFT COLUMN: Org Identity -->
          <aside class="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 relative z-10 -mt-16 sm:-mt-20 mb-10">

            <!-- Avatar -->
            <div class="relative group mx-auto lg:mx-0 w-40 h-40 sm:w-48 sm:h-48">
              <div class="w-full h-full rounded-2xl border-[6px] border-background shadow-xl overflow-hidden bg-muted relative z-10">
                <AssetView :asset="org.Avatar" :fallback-name="org.DisplayName" class-name="w-full h-full object-cover" />
              </div>
              <!-- Role Badge -->
              <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20">
                <Badge variant="secondary" class="shadow-md border bg-background text-foreground px-3 py-1 text-xs uppercase tracking-wider font-black">
                  <Crown v-if="isOwner" class="size-3 mr-1 text-yellow-500 fill-yellow-500" />
                  <ShieldAlert v-else-if="isAdmin" class="size-3 mr-1 text-brand-blue" />
                  <Users v-else class="size-3 mr-1" />
                  {{ isOwner ? t('organization.roleOwner') : isAdmin ? t('organization.roleAdmin') : t('organization.roleMember') }}
                </Badge>
              </div>
            </div>

            <div class="flex flex-col gap-6 px-2 text-center lg:text-left pt-4">
              <div class="space-y-1">
                <h1 class="text-3xl font-black tracking-tight leading-tight">{{ org.DisplayName }}</h1>
                <p class="text-xl text-muted-foreground font-medium">@{{ org.AccountName }}</p>
                <div v-if="org.Status !== AccountStatus.Active" class="pt-2">
                  <Badge variant="destructive">{{ t('dashboard.accountStatus') }}: {{ org.Status }}</Badge>
                </div>
              </div>

              <!-- Follow Stats -->
              <div class="flex items-center justify-center lg:justify-start gap-6 text-sm">
                <div class="flex items-center gap-1">
                  <span class="font-black text-foreground">{{ followStats?.FollowersCount || 0 }}</span>
                  <span class="text-muted-foreground">{{ t('dashboard.followers') }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="space-y-3">
                <Button v-if="canEdit" variant="outline" class="w-full font-bold shadow-sm rounded-xl" @click="goToEditProfile('basic')">
                  {{ t('profile.editProfile') }}
                </Button>

                <Button v-if="isOwner" variant="outline" class="w-full font-bold shadow-sm rounded-xl border-dashed" @click="goToSettings">
                  <Settings class="size-4 mr-2" /> {{ t('organization.settings') }}
                </Button>

                <Button v-if="!isOwner" variant="ghost" class="w-full text-destructive hover:bg-destructive/10" @click="leaveOrg">
                  <LogOut class="size-4 mr-2" /> {{ t('organization.leave') }}
                </Button>
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
                <div v-if="socials.length > 0 || canEdit" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="font-bold text-sm text-muted-foreground uppercase tracking-wider">{{ t('dashboard.socials') }}</h3>
                    <Button v-if="canEdit" variant="ghost" size="sm" class="h-6 text-xs" @click="goToManage('socials')">
                      <Edit2 class="size-3 mr-1" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div v-if="socials.length > 0" class="flex flex-wrap gap-3">
                    <a v-for="social in socials" :key="social.Id" :href="social.Url" target="_blank" class="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card hover:bg-muted transition-colors">
                      <AssetView :asset="social.Icon" class-name="size-5" />
                      <span class="font-bold text-sm">{{ social.Platform }}</span>
                    </a>
                  </div>
                  <div v-else class="text-sm text-muted-foreground italic">{{ t('dashboard.noSocials') }}</div>
                </div>

                <!-- Contacts -->
                <div v-if="contacts.length > 0 || canEdit" class="space-y-3">
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
              </TabsContent>

              <!-- TAB: PROJECTS -->
              <TabsContent value="projects" class="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-2">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-lg">{{ t('dashboard.projects') }}</h3>
                  <Button v-if="canEdit" size="sm" @click="goToManage('projects')">
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
                    <a v-if="proj.Url" :href="proj.Url" target="_blank" class="text-xs text-brand-blue hover:underline flex items-center gap-1">
                      <LinkIcon class="size-3" /> Visit
                    </a>
                  </Card>
                </div>
                <div v-else class="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                  {{ t('dashboard.noProjects') }}
                </div>
              </TabsContent>

              <!-- TAB: MEMBERS -->
              <TabsContent value="members" class="pt-6 animate-in fade-in slide-in-from-bottom-2">
                <OrgMembers :account-name="accountName" :my-role="org.MyRole" />
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
                  <div v-if="sponsorships.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card v-for="spon in sponsorships" :key="spon.Id" class="hover:border-pink-500/30">
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
                </section>

                <!-- Gallery -->
                <section>
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2"><ImageIcon class="size-4 text-brand-blue" /> {{ t('dashboard.galleryItems') }}</h3>
                    <Button v-if="canEdit" size="sm" @click="goToManage('gallery')">
                      <Plus class="size-4 mr-2" /> {{ t('common.manage') }}
                    </Button>
                  </div>
                  <div v-if="gallery.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="item in gallery" :key="item.Id" class="group relative aspect-video rounded-xl overflow-hidden border bg-muted">
                      <AssetView :asset="item.Image" class-name="w-full h-full object-cover" />
                      <div v-if="item.Caption" class="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs font-bold truncate">
                        {{ item.Caption }}
                      </div>
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
