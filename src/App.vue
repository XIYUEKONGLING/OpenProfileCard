<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import { useThemeStore } from '@/stores/theme'; 
import { useServerStore } from '@/stores/server';

const server = useServerStore();
const themeStore = useThemeStore();
</script>

<template>
  <Toaster
      position="top-center"
      :theme="themeStore.theme === 'auto' ? 'system' : themeStore.theme"
  />

  <div class="theme-bg"></div>
  <div :class="{ 'opacity-0': !server.isInitialized }" class="transition-opacity duration-700 min-h-screen">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
