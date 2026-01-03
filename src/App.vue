<script setup lang="ts">
import { useServerStore } from './stores/server';
const server = useServerStore();
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
