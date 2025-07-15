<script lang="ts" setup>
import { applyTheme, useTheme } from '@/composables/useTheme';

const { isDark, toggleDark } = useTheme()
applyTheme(isDark ? "dark" : "light")
</script>

<template>
  <UButton
    :icon="isDark ? 'lucide:moon' : 'lucide:sun'"
    variant="ghost"
    @click="toggleDark"
  />
</template>
