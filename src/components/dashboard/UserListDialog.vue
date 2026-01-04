<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from '@/i18n';
import { httpClient } from '@/api/client';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useServerStore } from '@/stores/server';
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
import { Loader2, UserMinus, UserPlus, Ban, Lock, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  type: 'followers' | 'following';
  accountName?: string; // Optional: If viewing another user's list
  isMe?: boolean;
  isPrivate?: boolean;
}>();

const emit = defineEmits(['update:open', 'change']);

const { t } = useI18n();
const ui = useUIStore();
const auth = useAuthStore();
const server = useServerStore();

// --- State ---
const users = ref<FollowerDto[]>([]);
const myFollowingIds = ref<Set<string>>(new Set());
const isLoading = ref(false);
const actionLoading = ref<string | null>(null);

// Pagination State
const currentPage = ref(1);
const pageSize = 8;

// Confirmation Dialog State
const confirmOpen = ref(false);
const pendingAction = ref<'unfollow' | 'block' | null>(null);
const pendingUser = ref<FollowerDto | null>(null);

// --- Computed ---
const title = computed(() => props.type === 'followers' ? t('dashboard.followers') : t('dashboard.following'));

const totalPages = computed(() => Math.ceil(users.value.length / pageSize));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return users.value.slice(start, start + pageSize);
});

const canInteract = computed(() => auth.isAuthenticated && server.info?.Dynamic);

const emptyText = computed(() => {
  if (props.type === 'followers') {
    return props.isMe ? t('social.emptyFollowers') : t('social.emptyFollowersOther');
  }
  return props.isMe ? t('social.emptyFollowing') : t('social.emptyFollowingOther');
});

// --- Actions ---
const fetchList = async () => {
  isLoading.value = true;
  currentPage.value = 1;
  try {
    // Determine Endpoint
    const base = props.accountName ? `/profiles/${props.accountName}` : '/me';
    const endpoint = props.type === 'followers' ? `${base}/followers` : `${base}/following`;

    const [listData, followingData] = await Promise.all([
      httpClient<FollowerDto[]>(endpoint),
      canInteract.value ? httpClient<FollowerDto[]>('/me/following') : Promise.resolve([])
    ]);

    users.value = listData || [];
    myFollowingIds.value = new Set(followingData?.map(u => u.AccountId) || []);
  } catch (e) {
    console.error(e);
    ui.notify('Failed to load list', 'error');
    // users.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- Actions (Only if canInteract) ---
const executeToggleFollow = async (user: FollowerDto) => {
  const isFollowing = myFollowingIds.value.has(user.AccountId);
  actionLoading.value = user.AccountId;

  try {
    if (isFollowing) {
      await httpClient(`/profiles/${user.AccountName}/follow`, { method: 'DELETE' });
      myFollowingIds.value.delete(user.AccountId);
      // Only remove from list if we are viewing OUR OWN following list
      if (!props.accountName && props.type === 'following') {
        users.value = users.value.filter(u => u.AccountId !== user.AccountId);
      }
    } else {
      await httpClient(`/profiles/${user.AccountName}/follow`, { method: 'POST' });
      myFollowingIds.value.add(user.AccountId);
    }
    ui.notify(t('common.success'), 'success');
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
    ui.notify(t('common.success'), 'success');
    emit('change');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoading.value = null;
    confirmOpen.value = false;
  }
};

const onToggleFollowClick = (user: FollowerDto) => {
  if (myFollowingIds.value.has(user.AccountId)) {
    pendingUser.value = user;
    pendingAction.value = 'unfollow';
    confirmOpen.value = true;
  } else {
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
  if (pendingAction.value === 'unfollow') executeToggleFollow(pendingUser.value);
  else if (pendingAction.value === 'block') executeBlock(pendingUser.value);
};

watch(() => props.open, (val) => {
  if (val) fetchList();
});

const close = () => emit('update:open', false);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
      <DialogHeader class="p-6 pb-2 shrink-0">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription class="hidden">User list</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6 pt-2">
        <div v-if="isPrivate && !isMe" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div class="size-12 rounded-full bg-muted flex items-center justify-center">
            <Lock class="size-6 text-muted-foreground/40" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-bold">{{ t('social.privateList') }}</p>
            <p class="text-xs text-muted-foreground">{{ t('social.privateListDesc') }}</p>
          </div>
        </div>

        <div v-else-if="isLoading" class="space-y-4 mt-2">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3">
            <div class="size-10 rounded-full bg-muted animate-pulse" />
            <div class="space-y-1 flex-1">
              <div class="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        <div v-else-if="!users || users.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div class="size-12 rounded-full bg-muted/50 flex items-center justify-center">
            <UserMinus class="size-6 text-muted-foreground/40" />
          </div>
          <p class="text-muted-foreground text-sm font-medium">{{ emptyText }}</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="user in paginatedUsers" :key="user.AccountId" class="flex items-center justify-between group">
            <div class="flex items-center gap-3 min-w-0">
              <router-link :to="`/${user.AccountName}`" @click="close" class="shrink-0">
                <AssetView :asset="user.Avatar" :fallback-name="user.DisplayName" class-name="size-10 rounded-full border" />
              </router-link>
              <div class="min-w-0">
                <router-link :to="`/${user.AccountName}`" @click="close" class="font-bold truncate hover:underline block">
                  {{ user.DisplayName }}
                </router-link>
                <div class="text-xs text-muted-foreground truncate">@{{ user.AccountName }}</div>
              </div>
            </div>

            <!-- Actions (Only if logged in and dynamic) -->
            <div v-if="canInteract && user.AccountName !== auth.user?.AccountName" class="flex items-center gap-1">
              <Button variant="ghost" size="icon" class="size-8" @click="onToggleFollowClick(user)" :disabled="!!actionLoading">
                <Loader2 v-if="actionLoading === user.AccountId" class="size-4 animate-spin" />
                <component v-else :is="myFollowingIds.has(user.AccountId) ? UserMinus : UserPlus" class="size-4" :class="{'text-brand-blue': !myFollowingIds.has(user.AccountId)}" />
              </Button>
              <Button variant="ghost" size="icon" class="size-8 hover:text-destructive" @click="onBlockClick(user)">
                <Ban class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="p-4 border-t bg-muted/20 flex items-center justify-between shrink-0">
        <Button variant="ghost" size="sm" :disabled="currentPage === 1" @click="currentPage--">
          <ChevronLeft class="size-4 mr-1" /> {{ t('common.prev') || 'Prev' }}
        </Button>
        <span class="text-xs font-mono">{{ currentPage }} / {{ totalPages }}</span>
        <Button variant="ghost" size="sm" :disabled="currentPage === totalPages" @click="currentPage++">
          {{ t('common.next') || 'Next' }} <ChevronRight class="size-4 ml-1" />
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="confirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ pendingAction === 'block' ? t('social.block') : t('profile.unfollow') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ pendingAction === 'block' ? t('social.blockConfirm', { name: pendingUser?.DisplayName || '' }) : t('social.unfollowConfirm', { name: pendingUser?.DisplayName || '' }) }}
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
