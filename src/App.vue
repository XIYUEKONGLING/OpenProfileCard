<script setup lang="ts">
import { onMounted } from 'vue';
import { useServerStore } from './stores/server';

const server = useServerStore();

onMounted(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
    if (localStorage.getItem('theme')) {
      const isDark = localStorage.getItem('theme') === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      server.isDark = isDark;
    } else {
      document.documentElement.classList.toggle('dark', e.matches);
      server.isDark = e.matches;
    }
  };
  updateTheme(mediaQuery);
  mediaQuery.addEventListener('change', updateTheme);
});
</script>

<template>
  <div class="theme-bg"></div>
  <div :class="{ 'opacity-0': !server.isInitialized }" class="transition-opacity duration-700 min-h-screen">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
