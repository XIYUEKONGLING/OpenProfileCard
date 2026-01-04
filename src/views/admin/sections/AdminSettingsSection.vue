<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { SystemSettingDto } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const props = defineProps<{ settings: SystemSettingDto[] }>();
const emit = defineEmits(['updated']);
const { t } = useI18n();
const ui = useUIStore();

const savingKey = ref<string | null>(null);
const editingSetting = ref<SystemSettingDto | null>(null);
const editValue = ref('');

const updateSetting = async (key: string, value: string) => {
  savingKey.value = key;
  try {
    await httpClient(`/admin/system-settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ Value: value })
    });
    ui.notify(t('admin.settingsSaved'), 'success');
    emit('updated');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    savingKey.value = null;
  }
};

const openEditDialog = (setting: SystemSettingDto) => {
  editingSetting.value = setting;
  editValue.value = setting.Value;
};

const saveDialog = async () => {
  if (!editingSetting.value) return;
  await updateSetting(editingSetting.value.Key, editValue.value);
  editingSetting.value = null;
};
</script>

<template>
  <div class="grid gap-4">
    <Card v-for="s in settings" :key="s.Key" class="overflow-hidden">
      <CardContent class="p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-1 flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <Label class="text-base font-bold font-mono break-all">{{ s.Key }}</Label>
              <span class="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground uppercase font-bold shrink-0">
                {{ s.ValueType }}
              </span>
            </div>
            <p class="text-sm text-muted-foreground">{{ s.Description }}</p>
          </div>

          <div class="flex items-center gap-4 min-w-[200px] justify-end shrink-0">
            <!-- Boolean Toggle -->
            <template v-if="s.ValueType === 'boolean'">
              <Switch
                  :checked="s.Value === 'true'"
                  @update:checked="(v) => updateSetting(s.Key, v ? 'true' : 'false')"
                  :disabled="savingKey === s.Key"
              />
            </template>

            <!-- Number Input -->
            <template v-else-if="s.ValueType === 'number'">
              <div class="flex gap-2 w-full">
                <Input
                    :value="s.Value"
                    @change="(e: any) => updateSetting(s.Key, e.target.value)"
                    class="h-9 font-mono"
                    type="number"
                />
              </div>
            </template>

            <!-- String/HTML/Other -->
            <template v-else>
              <div class="flex gap-2 w-full justify-end">
                <Button variant="outline" size="sm" @click="openEditDialog(s)">
                  {{ t('admin.editContent') }}
                </Button>
              </div>
            </template>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Edit Dialog -->
    <Dialog :open="!!editingSetting" @update:open="(v) => !v && (editingSetting = null)">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ t('admin.editContent') }}</DialogTitle>
          <DialogDescription class="font-mono text-xs break-all">{{ editingSetting?.Key }}</DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Textarea v-model="editValue" class="min-h-[400px] font-mono text-sm leading-relaxed" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editingSetting = null">{{ t('common.cancel') }}</Button>
          <Button @click="saveDialog" :disabled="!!savingKey">{{ t('common.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
