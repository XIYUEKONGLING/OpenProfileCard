<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { SiteMetadataDto, UpdateSiteMetadataRequestDto } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import AssetEditor from '@/components/ui/AssetEditor.vue';
import { Loader2, Save } from 'lucide-vue-next';

const props = defineProps<{ initialMeta: SiteMetadataDto }>();
const emit = defineEmits(['updated']);
const { t } = useI18n();
const ui = useUIStore();

const isSaving = ref(false);
const form = reactive<UpdateSiteMetadataRequestDto>({ ...props.initialMeta });

watch(() => props.initialMeta, (newVal) => {
  Object.assign(form, newVal);
}, { deep: true });

const saveMeta = async () => {
  isSaving.value = true;
  try {
    await httpClient('/admin/meta', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    ui.notify(t('admin.metaSaved'), 'success');
    emit('updated');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <Card>
      <CardContent class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <Label>{{ t('admin.siteName') }}</Label>
            <Input v-model="form.SiteName" />
          </div>
          <div class="space-y-2">
            <Label>{{ t('admin.contactEmail') }}</Label>
            <Input v-model="form.ContactEmail" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label>{{ t('admin.siteDescription') }}</Label>
            <Input v-model="form.SiteDescription" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label>{{ t('admin.copyright') }}</Label>
            <Input v-model="form.Copyright" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <AssetEditor v-model="form.Logo" :label="t('admin.logo')" />
          <AssetEditor v-model="form.Favicon" :label="t('admin.favicon')" />
        </div>

        <div class="flex justify-end pt-4">
          <Button @click="saveMeta" :disabled="isSaving" class="min-w-32 font-bold">
            <Loader2 v-if="isSaving" class="mr-2 size-4 animate-spin" />
            <Save v-else class="mr-2 size-4" />
            {{ t('common.save') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
