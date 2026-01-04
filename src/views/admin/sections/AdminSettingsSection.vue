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
          <div class="space-y-1 flex-1">
            <div class="flex items-center gap-2">
              <Label class="text-base font-bold font-mono">{{ s.Key }}</Label>
              <span class="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground uppercase font-bold">
                {{ s.ValueType }}
              </span>
            </div>
            <p class="text-sm text-muted-foreground">{{ s.Description }}</p>
          </div>

          <div class="flex items-center gap-4 min-w-75 justify-end">
            <!-- Boolean Toggle -->
            <template v-if="s.ValueType === 'boolean'">
              <Switch
                  :checked="s.Value === 'true'"
                  @update:checked="(v) => updateSetting(s.Key, v ? 'true' : 'false')"
                  :disabled="savingKey === s.Key"
              />
            </template>

            <!-- Number/String Input -->
            <template v-else-if="s.ValueType === 'number' || s.ValueType === 'string'">
              <div class="flex gap-2 w-full">
                <Input
                    :value="s.Value"
                    @change="(e: any) => updateSetting(s.Key, e.target.value)"
                    class="h-9"
                    :type="s.ValueType === 'number' ? 'number' : 'text'"
                />
              </div>
            </template>

            <!-- HTML/Textarea -->
            <template v-else>
              <Button variant="outline" size="sm" @click="openEditDialog(s)">
                {{ t('admin.editContent') }}
              </Button>
            </template>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Edit Dialog -->
    <Dialog :open="!!editingSetting" @update:open="(v) => !v && (editingSetting = null)">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t('admin.editContent') }}</DialogTitle>
          <DialogDescription>{{ editingSetting?.Key }}</DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Textarea v-model="editValue" class="min-h-75 font-mono text-sm" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editingSetting = null">{{ t('common.cancel') }}</Button>
          <Button @click="saveDialog" :disabled="!!savingKey">{{ t('common.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
