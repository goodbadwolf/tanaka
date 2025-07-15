<template>
  <div class="container">
    <h1>Tanaka Vue Playground</h1>
    <p>Lightweight Vue Implementation (545KB vs 4.1MB)</p>

    <div class="section">
      <h2>Button Examples</h2>
      <div class="button-group">
        <Button>Default Button</Button>
        <Button variant="primary">Primary Button</Button>
        <Button variant="danger">Danger Button</Button>
        <Button variant="outline">Outline Button</Button>
      </div>
    </div>

    <div class="section">
      <h2>Card Examples</h2>
      <Card>
        <h3>Default Card</h3>
        <p>This is a simple card component using Vue's scoped styles.</p>
      </Card>

      <Card class="elevated-card">
        <h3>Elevated Card</h3>
        <p>This card has a shadow effect.</p>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './components/Button.vue';
import Card from './components/Card.vue';
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.section {
  margin: 2rem 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.elevated-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-top: 1rem;
}
</style>
