<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '@/lib/markdown';
import 'highlight.js/styles/github-dark.css';

interface Props {
  content?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg';
  neutral?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  size: 'base',
  neutral: false
});

const emit = defineEmits<{
  (e: 'image-click', src: string): void;
}>();

const renderedHtml = computed(() => renderMarkdown(props.content));

const handleImageClick = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.tagName === 'IMG') {
    const src = (target as HTMLImageElement).src;
    emit('image-click', src);
  }
};

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'prose-xs';
    case 'sm': return 'prose-sm';
    case 'lg': return 'prose-lg';
    default: return '';
  }
});

const colorVariant = computed(() => {
  return props.neutral ? 'prose-neutral' : '';
});
</script>

<template>
  <div
    v-if="renderedHtml"
    class="markdown-renderer prose dark:prose-invert max-w-none"
    :class="[sizeClasses, colorVariant]"
    v-html="renderedHtml"
    @click="handleImageClick"
  />
  <div v-else class="text-muted-foreground italic py-4">
    <slot />
  </div>
</template>

<style scoped>
@reference '../../style.css';

/* Base prose adjustments */
.markdown-renderer {
  @apply text-foreground leading-relaxed;
}

/* Headings */
.markdown-renderer :deep(h1) {
  @apply font-black text-3xl mt-8 mb-4 tracking-tight scroll-mt-24 first:mt-0;
}

.markdown-renderer :deep(h2) {
  @apply font-bold text-2xl mt-7 mb-3 tracking-tight scroll-mt-24;
}

.markdown-renderer :deep(h3) {
  @apply font-semibold text-xl mt-6 mb-2.5 scroll-mt-24;
}

.markdown-renderer :deep(h4) {
  @apply font-semibold text-lg mt-5 mb-2 scroll-mt-24;
}

.markdown-renderer :deep(h5),
.markdown-renderer :deep(h6) {
  @apply font-medium text-base mt-4 mb-1.5 scroll-mt-24;
}

/* Paragraphs */
.markdown-renderer :deep(p) {
  @apply my-4 leading-7;
}

/* Links */
.markdown-renderer :deep(a) {
  @apply text-brand-blue hover:text-brand-blue/80 underline underline-offset-2 transition-colors;
}

/* Lists */
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  @apply my-4 ml-6;
}

.markdown-renderer :deep(ul) {
  @apply list-disc space-y-1.5;
}

.markdown-renderer :deep(ol) {
  @apply list-decimal space-y-1.5;
}

.markdown-renderer :deep(li) {
  @apply leading-7;
}

.markdown-renderer :deep(li > ul),
.markdown-renderer :deep(li > ol) {
  @apply my-1.5;
}

.markdown-renderer :deep(li > p) {
  @apply my-0;
}

/* Blockquotes */
.markdown-renderer :deep(blockquote) {
  @apply my-6 pl-4 border-l-4 border-brand-blue/30 italic text-muted-foreground;
}

.markdown-renderer :deep(blockquote p) {
  @apply my-0;
}

/* Code inline */
.markdown-renderer :deep(code) {
  @apply px-1.5 py-0.5 rounded-md text-sm font-mono bg-muted/50 border border-border/50 text-foreground;
}

/* Code blocks with custom container from markdown.ts */
.markdown-renderer :deep(div[class*="group"]) {
  @apply my-6;
}

.markdown-renderer :deep(div[class*="group"] pre) {
  @apply my-0 p-4 overflow-x-auto;
}

.markdown-renderer :deep(div[class*="group"] pre code) {
  @apply bg-transparent border-0 p-0 text-sm leading-relaxed;
}

/* Tables */
.markdown-renderer :deep(table) {
  @apply my-6 w-full border-collapse overflow-hidden rounded-xl border border-border/50;
}

.markdown-renderer :deep(table thead) {
  @apply bg-muted/50;
}

.markdown-renderer :deep(table th) {
  @apply px-4 py-3 text-left font-semibold text-sm border-b border-border/50;
}

.markdown-renderer :deep(table td) {
  @apply px-4 py-3 text-sm border-b border-border/30;
}

.markdown-renderer :deep(table tr:last-child td) {
  @apply border-b-0;
}

.markdown-renderer :deep(table tbody tr:hover) {
  @apply bg-muted/20 transition-colors;
}

/* Horizontal rules */
.markdown-renderer :deep(hr) {
  @apply my-8 border-t border-border/50;
}

/* Images */
.markdown-renderer :deep(img) {
  @apply my-6 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg;
}

.markdown-renderer :deep(img[src*='="preview"']) {
  @apply rounded-lg;
}

/* Strong and emphasis */
.markdown-renderer :deep(strong) {
  @apply font-bold text-foreground;
}

.markdown-renderer :deep(em) {
  @apply italic;
}

/* Task lists */
.markdown-renderer :deep(input[type="checkbox"]) {
  @apply mr-2 size-4 accent-brand-blue cursor-pointer;
}

.markdown-renderer :deep(ul.contains-task-list) {
  @apply list-none ml-0;
}

.markdown-renderer :deep(li.task-list-item) {
  @apply flex items-start gap-2;
}

.markdown-renderer :deep(li.task-list-item input) {
  @apply mt-1.5;
}

/* Definition lists */
.markdown-renderer :deep(dt) {
  @apply font-semibold mt-4 mb-1;
}

.markdown-renderer :deep(dd) {
  @apply ml-4 mb-2 text-muted-foreground;
}

/* Dark mode specific adjustments */
.dark .markdown-renderer :deep(code) {
  @apply bg-muted/70 border-border/30;
}

.dark .markdown-renderer :deep(div[class*="group"]) {
  @apply border-border/30;
}

.dark .markdown-renderer :deep(div[class*="group"] > div:first-child) {
  @apply bg-muted/20;
}

.dark .markdown-renderer :deep(table thead) {
  @apply bg-muted/30;
}

.dark .markdown-renderer :deep(table tbody tr:hover) {
  @apply bg-muted/10;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .markdown-renderer :deep(table) {
    @apply text-sm;
  }

  .markdown-renderer :deep(table th),
  .markdown-renderer :deep(table td) {
    @apply px-3 py-2;
  }

  .markdown-renderer :deep(div[class*="group"] pre) {
    @apply p-3 text-xs;
  }
}

/* Print styles */
@media print {
  .markdown-renderer :deep(a) {
    @apply text-black no-underline;
  }

  .markdown-renderer :deep(a[href^="http"])::after {
    content: " (" attr(href) ")";
    @apply text-xs text-muted-foreground;
  }

  .markdown-renderer :deep(div[class*="group"]),
  .markdown-renderer :deep(blockquote) {
    @apply border-border;
  }

  .markdown-renderer :deep(img) {
    @apply shadow-none max-w-full;
  }
}
</style>
