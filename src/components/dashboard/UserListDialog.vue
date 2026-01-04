<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { FollowerDto } from '@/api/types';

// UI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import { Loader2, UserMinus, Ban } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  type: 'followers' | 'following';
}>();

const emit = defineEmits(['update:open', 'change']);

const { t } = useI18n();
const ui = useUIStore();

const users = ref<FollowerDto[]>([]);
const isLoading = ref(false);
const actionLoading = ref<string | null>(null);

const title = computed(() => props.type === 'followers' ? t('dashboard.followers') : t('dashboard.following'));
const emptyText = computed(() => props.type === 'followers' ? t('social.emptyFollowers') : t('social.emptyFollowing'));

// --- Data Fetching ---
const fetchList = async () => {
  isLoading.value = true;
  users.value = [];
  try {
    const endpoint = props.type === 'followers' ? '/me/followers' : '/me/following';
    const data = await httpClient<FollowerDto[]>(endpoint);
    users.value = data || [];
  } catch (e) {
    console.error(e);
    ui.notify('Failed to load list', 'error');
    users.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- Actions ---

const handleUnfollow = async (user: FollowerDto) => {
  if (!confirm(t('social.unfollowConfirm', { name: user.DisplayName }))) return;

  actionLoading.value = user.AccountId;
  try {
    await httpClient(`/profiles/${user.AccountName}/follow`, { method: 'DELETE' });
    users.value = users.value.filter(u => u.AccountId !== user.AccountId);
    ui.notify(t('common.success'), 'success');
    emit('change');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
  }
};

const handleBlock = async (user: FollowerDto) => {
  if (!confirm(t('social.blockConfirm', { name: user.DisplayName }))) return;

  actionLoading.value = user.AccountId;
  try {
    await httpClient(`/profiles/${user.AccountName}/block`, { method: 'POST' });
    users.value = users.value.filter(u => u.AccountId !== user.AccountId);
    ui.notify(t('common.success'), 'success');
    emit('change');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
  }
};

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    fetchList();
  } else {
    setTimeout(() => {
      users.value = [];
    }, 300);
  }
});

const close = () => emit('update:open', false);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
      <DialogHeader class="p-6 pb-2 shrink-0">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription class="hidden">List of users</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6 pt-2">
        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-4 mt-2">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3">
            <div class="size-10 rounded-full bg-muted animate-pulse" />
            <div class="space-y-1 flex-1">
              <div class="h-4 w-24 bg-muted animate-pulse rounded" />
              <div class="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!users || users.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div class="size-12 rounded-full bg-muted/50 flex items-center justify-center">
            <UserMinus class="size-6 text-muted-foreground/40" />
          </div>
          <p class="text-muted-foreground text-sm font-medium">{{ emptyText }}</p>
        </div>

        <!-- List State -->
        <div v-else class="space-y-4">
          <div v-for="user in users" :key="user.AccountId" class="flex items-center justify-between group">
            <div class="flex items-center gap-3 overflow-hidden">
              <router-link :to="`/u/${user.AccountName}`" @click="close">
                <div class="size-10 rounded-full bg-muted border border-border overflow-hidden shrink-0">
                  <AssetView :asset="user.Avatar" :fallback-name="user.DisplayName" class-name="w-full h-full" />
                </div>
              </router-link>
              <div class="min-w-0">
                <router-link :to="`/u/${user.AccountName}`" @click="close" class="font-bold truncate hover:underline block">
                  {{ user.DisplayName }}
                </router-link>
                <div class="text-xs text-muted-foreground truncate">@{{ user.AccountName }}</div>
              </div>
            </div>

            <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                  v-if="type === 'following'"
                  variant="ghost"
                  size="icon"
                  class="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  :title="t('profile.unfollow')"
                  :disabled="!!actionLoading"
                  @click="handleUnfollow(user)"
              >
                <Loader2 v-if="actionLoading === user.AccountId" class="size-4 animate-spin" />
                <UserMinus v-else class="size-4" />
              </Button>

              <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  :title="t('social.block')"
                  :disabled="!!actionLoading"
                  @click="handleBlock(user)"
              >
                <Ban class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
