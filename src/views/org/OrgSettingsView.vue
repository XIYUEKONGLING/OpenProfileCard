<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { type OrganizationDto, MemberRole } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-vue-next';
import OrgSettings from '@/components/org/OrgSettings.vue';

const props = defineProps<{ accountName: string }>();
const router = useRouter();
const { t } = useI18n();

const myRole = ref<MemberRole | null>(null);
const isLoading = ref(true);

const checkPermission = async () => {
  try {
    const org = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    myRole.value = org.MyRole;

    // Client-side guard (API also checks)
    if (org.MyRole !== MemberRole.Owner && org.MyRole !== MemberRole.Admin) {
      router.push(`/dashboard/orgs/${props.accountName}`);
    }
  } catch (e) {
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
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

    <div v-if="!isLoading && myRole !== null">
      <OrgSettings
          :account-name="accountName"
          :my-role="myRole"
          @deleted="router.push('/dashboard')"
      />
    </div>
  </div>
</template>
