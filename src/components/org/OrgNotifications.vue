<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from '@/i18n';
import type { NotificationDto, NotificationType } from '@/api/types';
import { organizationApi } from '@/api/services';
import { useUIStore } from '@/stores/ui';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bell, Check, Trash2, ChevronLeft, ChevronRight, ChevronsLeft,
  Info, ShieldAlert, Heart
} from 'lucide-vue-next';

const props = defineProps<{
  accountName: string;
}>();

const { t } = useI18n();
const ui = useUIStore();

// State
const notifications = ref<NotificationDto[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);
const actionLoadingId = ref<string | null>(null);

// Helpers
const getIcon = (type: NotificationType) => {
  switch (type) {
    case 0: return Info; // System
    case 1: return ShieldAlert; // Admin
    case 2: return ShieldAlert; // Security
    case 3: return Heart; // Interaction
    default: return Bell;
  }
};

const getTypeLabel = (type: NotificationType) => {
  switch (type) {
    case 0: return t('notifications.typeSystem');
    case 1: return t('notifications.typeAdmin');
    case 2: return t('notifications.typeSecurity');
    case 3: return t('notifications.typeInteraction');
    default: return 'Unknown';
  }
};

// Actions
const fetchNotifications = async () => {
  isLoading.value = true;
  try {
    const response = await organizationApi.getNotifications(props.accountName, {
      page: currentPage.value,
      unreadOnly: false
    });

    notifications.value = response.Data || [];
    totalPages.value = response.TotalPages;
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

const markAsRead = async (id: string) => {
  actionLoadingId.value = id;
  try {
    await organizationApi.markAsRead(props.accountName, id);
    const item = notifications.value.find(n => n.Id === id);
    if (item) item.IsRead = true;
    ui.notify(t('notifications.readSuccess'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const deleteNotification = async (id: string) => {
  actionLoadingId.value = id;
  try {
    await organizationApi.deleteNotification(props.accountName, id);
    notifications.value = notifications.value.filter(n => n.Id !== id);
    ui.notify(t('notifications.deleteSuccess'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const markAllRead = async () => {
  try {
    await organizationApi.markAllAsRead(props.accountName);
    notifications.value.forEach(n => n.IsRead = true);
    ui.notify(t('notifications.markAllReadSuccess'), 'success');
  } catch (e: any) {
    ui.notify(e.message, 'error');
  }
};

watch(currentPage, fetchNotifications);
onMounted(fetchNotifications);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold">{{ t('notifications.title') }}</h2>
        <p class="text-sm text-muted-foreground">{{ t('organization.manage') }}</p>
      </div>
      <Button variant="outline" size="sm" @click="markAllRead" :disabled="isLoading">
        <Check class="mr-2 size-4" />
        {{ t('common.markAllRead') }}
      </Button>
    </div>

    <!-- List -->
    <div class="space-y-4">
      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="h-24 bg-muted rounded-xl animate-pulse"></div>
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/10">
        <Bell class="size-12 mx-auto text-muted-foreground/20 mb-4" />
        <p class="font-bold">{{ t('notifications.empty') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('notifications.emptyDesc') }}</p>
      </div>

      <div v-else class="space-y-3">
        <Card v-for="notif in notifications" :key="notif.Id"
              class="group transition-all hover:shadow-md"
              :class="{'border-brand-blue/50 bg-brand-blue/5': !notif.IsRead}">
          <CardContent class="p-4 flex gap-4 items-start">
            <!-- Icon -->
            <div class="size-10 rounded-full shrink-0 flex items-center justify-center border"
                 :class="!notif.IsRead ? 'bg-brand-blue text-white border-brand-blue' : 'bg-muted text-muted-foreground'">
              <component :is="getIcon(notif.Type)" class="size-5" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm truncate" :class="{'text-foreground': notif.IsRead, 'text-brand-blue': !notif.IsRead}">
                  {{ notif.Title }}
                </h4>
                <div class="flex items-center gap-2">
                  <Badge variant="outline" class="text-[10px] h-5 px-1.5">
                    {{ getTypeLabel(notif.Type) }}
                  </Badge>
                  <span class="text-[10px] text-muted-foreground whitespace-nowrap">
                    {{ new Date(notif.CreatedAt).toLocaleString() }}
                  </span>
                </div>
              </div>
              <p class="text-sm text-muted-foreground line-clamp-2">{{ notif.Body }}</p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button v-if="!notif.IsRead" variant="ghost" size="icon" class="size-8" @click="markAsRead(notif.Id)" :disabled="actionLoadingId === notif.Id">
                <Check v-if="actionLoadingId !== notif.Id" class="size-4" />
                <div v-else class="size-4 border-2 border-t-foreground border-transparent rounded-full animate-spin"></div>
              </Button>
              <Button variant="ghost" size="icon" class="size-8 text-destructive hover:text-destructive hover:bg-destructive/10" @click="deleteNotification(notif.Id)" :disabled="actionLoadingId === notif.Id">
                <Trash2 class="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between gap-4 px-2 pt-4 border-t">
      <div class="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {{ t('admin.currentPage') }}: <span class="text-foreground">{{ currentPage }}</span> / {{ totalPages }}
      </div>

      <div class="flex items-center gap-2">
        <Button
            variant="outline"
            size="icon"
            class="size-9 rounded-lg"
            :disabled="currentPage === 1"
            @click="currentPage = 1"
        >
          <ChevronsLeft class="size-4" />
        </Button>
        <Button variant="outline" size="icon" class="size-9 rounded-lg" :disabled="currentPage === 1" @click="currentPage--">
          <ChevronLeft class="size-4" />
        </Button>
        <Button variant="outline" size="icon" class="size-9 rounded-lg" :disabled="currentPage >= totalPages" @click="currentPage++">
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
