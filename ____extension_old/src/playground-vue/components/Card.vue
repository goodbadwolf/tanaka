<template>
  <div class="card">
    <slot />
  </div>
</template>

<script setup lang="ts">
// No props needed for basic card
</script>

<style scoped>
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: #d1d5db;
}
</style>
