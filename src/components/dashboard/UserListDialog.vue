<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import type { FollowerDto } from '@/api/types';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import AssetView from '@/components/ui/AssetView.vue';
import { Loader2, UserMinus, UserPlus, Ban } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  type: 'followers' | 'following';
}>();

const emit = defineEmits(['update:open', 'change']);

const { t } = useI18n();
const ui = useUIStore();

// --- State ---
const users = ref<FollowerDto[]>([]);
const myFollowingIds = ref<Set<string>>(new Set());
const isLoading = ref(false);
const actionLoading = ref<string | null>(null);

// Confirmation Dialog State
const confirmOpen = ref(false);
const pendingAction = ref<'unfollow' | 'block' | null>(null);
const pendingUser = ref<FollowerDto | null>(null);

// Computed
const title = computed(() => props.type === 'followers' ? t('dashboard.followers') : t('dashboard.following'));
const emptyText = computed(() => props.type === 'followers' ? t('social.emptyFollowers') : t('social.emptyFollowing'));

// --- Data Fetching ---
const fetchList = async () => {
  isLoading.value = true;
  users.value = [];
  myFollowingIds.value.clear();

  try {
    const endpoint = props.type === 'followers' ? '/me/followers' : '/me/following';

    const [listData, followingData] = await Promise.all([
      httpClient<FollowerDto[]>(endpoint),
      httpClient<FollowerDto[]>('/me/following')
    ]);

    users.value = listData || [];

    if (followingData) {
      followingData.forEach(u => myFollowingIds.value.add(u.AccountId));
    }

  } catch (e) {
    console.error(e);
    ui.notify('Failed to load list', 'error');
    users.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- Execution Logic (Called after confirmation) ---

const executeToggleFollow = async (user: FollowerDto) => {
  const isFollowing = myFollowingIds.value.has(user.AccountId);
  actionLoading.value = user.AccountId;

  try {
    if (isFollowing) {
      // Unfollow
      await httpClient(`/profiles/${user.AccountName}/follow`, { method: 'DELETE' });
      myFollowingIds.value.delete(user.AccountId);

      // If in "Following" list, remove the row
      if (props.type === 'following') {
        users.value = users.value.filter(u => u.AccountId !== user.AccountId);
      }
      ui.notify(t('common.success'), 'success');
    } else {
      // Follow
      await httpClient(`/profiles/${user.AccountName}/follow`, { method: 'POST' });
      myFollowingIds.value.add(user.AccountId);
      ui.notify(t('common.success'), 'success');
    }
    emit('change');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
    confirmOpen.value = false;
  }
};

const executeBlock = async (user: FollowerDto) => {
  actionLoading.value = user.AccountId;
  try {
    await httpClient(`/profiles/${user.AccountName}/block`, { method: 'POST' });
    users.value = users.value.filter(u => u.AccountId !== user.AccountId);
    myFollowingIds.value.delete(user.AccountId);

    ui.notify(t('common.success'), 'success');
    emit('change');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
    confirmOpen.value = false;
  }
};

// --- Interaction Handlers (Triggers Dialog) ---

const onToggleFollowClick = (user: FollowerDto) => {
  const isFollowing = myFollowingIds.value.has(user.AccountId);

  if (isFollowing) {
    // If Unfollowing, require confirmation
    pendingUser.value = user;
    pendingAction.value = 'unfollow';
    confirmOpen.value = true;
  } else {
    // If Following, do it immediately
    executeToggleFollow(user);
  }
};

const onBlockClick = (user: FollowerDto) => {
  pendingUser.value = user;
  pendingAction.value = 'block';
  confirmOpen.value = true;
};

const onConfirm = () => {
  if (!pendingUser.value || !pendingAction.value) return;

  if (pendingAction.value === 'unfollow') {
    executeToggleFollow(pendingUser.value);
  } else if (pendingAction.value === 'block') {
    executeBlock(pendingUser.value);
  }
};

// --- Watchers ---
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    fetchList();
  } else {
    setTimeout(() => { users.value = []; }, 300);
  }
});

const close = () => emit('update:open', false);
</script>

<template>
  <!-- Main List Dialog -->
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
      <DialogHeader class="p-6 pb-2 shrink-0">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription class="hidden">List of users</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6 pt-2">
        <!-- Loading -->
        <div v-if="isLoading" class="space-y-4 mt-2">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3">
            <div class="size-10 rounded-full bg-muted animate-pulse" />
            <div class="space-y-1 flex-1">
              <div class="h-4 w-24 bg-muted animate-pulse rounded" />
              <div class="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!users || users.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div class="size-12 rounded-full bg-muted/50 flex items-center justify-center">
            <UserMinus class="size-6 text-muted-foreground/40" />
          </div>
          <p class="text-muted-foreground text-sm font-medium">{{ emptyText }}</p>
        </div>

        <!-- List -->
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

            <div class="flex items-center gap-1">
              <!-- Follow / Unfollow Button -->
              <Button
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  :class="myFollowingIds.has(user.AccountId) 
                    ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10' 
                    : 'text-brand-blue hover:bg-brand-blue/10'"
                  :title="myFollowingIds.has(user.AccountId) ? t('profile.unfollow') : t('profile.follow')"
                  :disabled="!!actionLoading"
                  @click="onToggleFollowClick(user)"
              >
                <Loader2 v-if="actionLoading === user.AccountId" class="size-4 animate-spin" />
                <template v-else>
                  <UserMinus v-if="myFollowingIds.has(user.AccountId)" class="size-4" />
                  <UserPlus v-else class="size-4" />
                </template>
              </Button>

              <!-- Block Button -->
              <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  :title="t('social.block')"
                  :disabled="!!actionLoading"
                  @click="onBlockClick(user)"
              >
                <Ban class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Alert Dialog -->
  <AlertDialog v-model:open="confirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ pendingAction === 'block'
            ? t('social.block')
            : t('profile.unfollow')
          }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ pendingAction === 'block'
            ? t('social.blockConfirm', { name: pendingUser?.DisplayName })
            : t('social.unfollowConfirm', { name: pendingUser?.DisplayName })
          }}
          <span v-if="pendingAction === 'block'" class="block mt-2 text-destructive font-medium">
            {{ t('social.blockDesc') }}
          </span>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction @click="onConfirm" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {{ pendingAction === 'block' ? t('social.block') : t('common.remove') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
