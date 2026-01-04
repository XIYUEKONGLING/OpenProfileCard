<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { type OrganizationDto, MemberRole } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-vue-next';
import OrgSettings from '@/components/org/OrgSettings.vue';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/stores/ui';

const props = defineProps<{ accountName: string }>();
const router = useRouter();
const { t } = useI18n();
const ui = useUIStore();

const myRole = ref<MemberRole | null>(null);
const isLoading = ref(true);
const isDeleting = ref(false);
const deleteConfirm = ref('');
const showDeleteModal = ref(false);

const checkPermission = async () => {
  try {
    const org = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    myRole.value = org.MyRole;

    // Client-side guard
    if (org.MyRole !== MemberRole.Owner && org.MyRole !== MemberRole.Admin) {
      router.push(`/dashboard/orgs/${props.accountName}`);
    }
  } catch (e) {
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
  }
};

const dissolveOrg = async () => {
  if (deleteConfirm.value !== props.accountName) return;

  isDeleting.value = true;
  try {
    await httpClient(`/orgs/${props.accountName}`, { method: 'DELETE' });
    ui.notify(t('common.success'), 'success');
    showDeleteModal.value = false;
    router.push('/dashboard');
  } catch (e: any) {
    ui.notify(e.message, 'error');
    isDeleting.value = false;
  }
};

onMounted(checkPermission);
</script>

<template>
  <div class="max-w-4xl mx-auto pb-10 space-y-6">
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" @click="router.back()" class="rounded-full">
        <ArrowLeft class="size-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-black tracking-tight">{{ t('organization.settings') }}</h1>
        <p class="text-sm text-muted-foreground">@{{ accountName }}</p>
      </div>
    </div>

    <div v-if="!isLoading && myRole !== null" class="space-y-8 animate-in fade-in slide-in-from-bottom-2">

      <!-- Normal Settings Component -->
      <OrgSettings
          :account-name="accountName"
          :my-role="myRole"
          @deleted="router.push('/dashboard')"
      />

      <!-- Danger Zone (Improved UI via View) -->
      <Card v-if="myRole === MemberRole.Owner" class="border-destructive/30 overflow-hidden">
        <CardHeader class="bg-destructive/10 py-6">
          <CardTitle class="flex items-center gap-2 text-destructive">
            <AlertTriangle class="size-5" />
            {{ t('settings.dangerZone') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 class="font-bold text-destructive mb-1">{{ t('organization.dissolve') }}</h4>
              <p class="text-sm text-muted-foreground">{{ t('organization.dissolveDesc') }}</p>
            </div>
            <Button variant="destructive" @click="showDeleteModal = true">
              {{ t('organization.dissolve') }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Teleport Modal for Deletion -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="w-full max-w-md bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-4 text-destructive">
                <div class="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle class="size-5" />
                </div>
                <div>
                  <h3 class="font-bold text-lg text-foreground">{{ t('organization.dissolve') }}?</h3>
                  <p class="text-xs text-destructive font-bold uppercase tracking-wide">{{ t('settings.dangerZone') }}</p>
                </div>
              </div>

              <p class="text-sm text-muted-foreground mb-4">
                {{ t('organization.dissolveDesc') }}
              </p>

              <div class="space-y-2">
                <Label>{{ t('organization.dissolveConfirm', { name: accountName }) }}</Label>
                <Input v-model="deleteConfirm" :placeholder="accountName" class="border-destructive/50 focus:border-destructive" />
              </div>
            </div>
            <div class="bg-muted/50 p-4 flex justify-end gap-3 border-t border-border">
              <Button variant="ghost" @click="showDeleteModal = false">{{ t('common.cancel') }}</Button>
              <Button variant="destructive" @click="dissolveOrg" :disabled="deleteConfirm !== accountName || isDeleting">
                {{ t('organization.dissolve') }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
