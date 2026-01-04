<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { type OrganizationDto, MemberRole } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-vue-next';
import OrgProfileEditor from '@/components/org/OrgProfileEditor.vue';

const props = defineProps<{ accountName: string }>();
const router = useRouter();
const { t } = useI18n();

const isLoading = ref(true);
const isAdmin = ref(false);

const checkPermission = async () => {
  try {
    const org = await httpClient<OrganizationDto>(`/orgs/${props.accountName}`);
    if (org.MyRole === MemberRole.Owner || org.MyRole === MemberRole.Admin) {
      isAdmin.value = true;
    } else {
      // Redirect if not admin
      router.push(`/dashboard/orgs/${props.accountName}`);
    }
  } catch {
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
        <h1 class="text-2xl font-black tracking-tight">{{ t('profile.editProfile') }}</h1>
        <p class="text-sm text-muted-foreground">@{{ accountName }}</p>
      </div>
    </div>

    <div v-if="!isLoading && isAdmin">
      <OrgProfileEditor
          :account-name="accountName"
          :is-admin="isAdmin"
          @saved="router.push(`/dashboard/orgs/${accountName}`)"
      />
    </div>
  </div>
</template>
