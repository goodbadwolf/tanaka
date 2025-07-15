<template>
  <button
    :class="['button', variant]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'danger' | 'outline';
}

withDefaults(defineProps<Props>(), {
  variant: 'default'
});

defineEmits<{
  click: [event: MouseEvent]
}>();
</script>

<style scoped>
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
}

.default {
  background-color: #f3f4f6;
  color: #1f2937;
  border-color: #d1d5db;
}

.default:hover {
  background-color: #e5e7eb;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover {
  background-color: #2563eb;
}

.danger {
  background-color: #ef4444;
  color: white;
}

.danger:hover {
  background-color: #dc2626;
}

.outline {
  background-color: transparent;
  color: #3b82f6;
  border-color: #3b82f6;
}

.outline:hover {
  background-color: #3b82f6;
  color: white;
}
</style>
