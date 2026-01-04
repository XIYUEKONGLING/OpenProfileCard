<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AssetView from '@/components/ui/AssetView.vue';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-vue-next';

const props = defineProps<{ resource: string }>();
const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();

// --- Dynamic Components ---
const forms: Record<string, any> = {
  work: defineAsyncComponent(() => import('@/components/resources/WorkForm.vue')),
  education: defineAsyncComponent(() => import('@/components/resources/EducationForm.vue')),
  projects: defineAsyncComponent(() => import('@/components/resources/ProjectForm.vue')),
  socials: defineAsyncComponent(() => import('@/components/resources/SocialForm.vue')),
  contacts: defineAsyncComponent(() => import('@/components/resources/ContactForm.vue')),
  gallery: defineAsyncComponent(() => import('@/components/resources/GalleryForm.vue')),
  certificates: defineAsyncComponent(() => import('@/components/resources/CertificateForm.vue')),
  sponsorships: defineAsyncComponent(() => import('@/components/resources/SponsorshipForm.vue')),
};

// --- State ---
const items = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const showDialog = ref(false);
const editingItem = ref<any>(null);

// --- Config ---
const config = computed(() => {
  const r = props.resource;
  const map: Record<string, { title: string, api: string }> = {
    work: { title: t('dashboard.workExp'), api: '/me/work' },
    education: { title: t('dashboard.education'), api: '/me/education' },
    projects: { title: t('dashboard.projects'), api: '/me/projects' },
    socials: { title: 'Social Links', api: '/me/socials' },
    contacts: { title: t('common.contact'), api: '/me/contacts' },
    gallery: { title: t('dashboard.galleryItems'), api: '/me/gallery' },
    certificates: { title: t('dashboard.certificates'), api: '/me/certificates' },
    sponsorships: { title: t('dashboard.sponsorships'), api: '/me/sponsorships' },
  };
  return map[r] || { title: 'Resource', api: `/me/${r}` };
});

const CurrentForm = computed(() => forms[props.resource]);

// --- Actions ---
const fetchItems = async () => {
  isLoading.value = true;
  try {
    items.value = await httpClient<any[]>(config.value.api);
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const openCreate = () => {
  editingItem.value = {};
  showDialog.value = true;
};

const openEdit = (item: any) => {
  editingItem.value = JSON.parse(JSON.stringify(item));
  showDialog.value = true;
};

// Helper to clean empty strings to null
const sanitizePayload = (obj: any) => {
  const clean = { ...obj };
  for (const key in clean) {
    if (clean[key] === '') clean[key] = null;
  }
  return clean;
};

const handleSave = async (payload: any) => {
  isSaving.value = true;
  const cleanPayload = sanitizePayload(payload);

  try {
    if (editingItem.value.Id) {
      await httpClient(`${config.value.api}/${editingItem.value.Id}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanPayload)
      });
    } else {
      await httpClient(config.value.api, {
        method: 'POST',
        body: JSON.stringify(cleanPayload)
      });
    }
    ui.notify(t('common.success'), 'success');
    showDialog.value = false;
    fetchItems();
  } catch (e: any) {
    ui.notify(e.message || 'Failed', 'error');
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm(t('common.deleteConfirm'))) return;
  try {
    await httpClient(`${config.value.api}/${id}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    fetchItems();
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

watch(() => props.resource, fetchItems, { immediate: true });
</script>

<template>
  <div class="max-w-4xl mx-auto pb-10 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" @click="router.push('/dashboard')" class="rounded-full">
          <ArrowLeft class="size-5" />
        </Button>
        <div>
          <h1 class="text-2xl font-black tracking-tight">{{ config.title }}</h1>
          <p class="text-muted-foreground text-sm">{{ t('common.manage') }} {{ config.title }}</p>
        </div>
      </div>
      <Button @click="openCreate" class="font-bold">
        <Plus class="mr-2 size-4" /> {{ t('common.add') }}
      </Button>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-24 bg-muted rounded-xl animate-pulse"></div>
    </div>

    <div v-else-if="items.length === 0" class="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/10">
      <p class="text-muted-foreground">{{ t('dashboard.noAssets') }}</p>
      <Button variant="link" @click="openCreate">{{ t('common.create') }}</Button>
    </div>

    <div v-else class="grid gap-4">
      <Card v-for="item in items" :key="item.Id" class="group">
        <CardContent class="p-4 flex items-center gap-4">
          <div v-if="item.Logo || item.Icon || item.Image" class="size-12 rounded-lg bg-muted border flex items-center justify-center shrink-0 overflow-hidden">
            <AssetView :asset="item.Logo || item.Icon || item.Image" class-name="w-full h-full object-contain" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-bold truncate">{{ item.Name || item.CompanyName || item.SchoolName || item.Platform || 'Item' }}</h3>
            <p class="text-sm text-muted-foreground truncate">
              {{ item.Position || item.Degree || item.Summary || item.Url || item.Caption }}
            </p>
          </div>

          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" @click="openEdit(item)">
              <Edit2 class="size-4" />
            </Button>
            <Button variant="ghost" size="icon" class="text-destructive hover:bg-destructive/10" @click="handleDelete(item.Id)">
              <Trash2 class="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingItem?.Id ? t('common.edit') : t('common.add') }} {{ config.title }}</DialogTitle>
          <DialogDescription>{{ t('common.manage') }}</DialogDescription>
        </DialogHeader>

        <component
            :is="CurrentForm"
            v-if="CurrentForm && showDialog"
            :model-value="editingItem"
            @save="handleSave"
            :is-saving="isSaving"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>
