<script setup lang="ts">
import { useOptionsStore } from '@/stores/options.store'
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'

const optionsStore = useOptionsStore()
// const { toggleDark } = optionsStore
const { isDark, profile, others } = storeToRefs(optionsStore)

const formState = reactive({
  isDark: isDark.value,
  name: profile.value.name,
  age: profile.value.age,
  awesome: others.value.awesome,
  counter: others.value.counter
})

watch(formState, (newState) => {
  isDark.value = newState.isDark
  profile.value.name = newState.name
  profile.value.age = newState.age
  others.value.awesome = newState.awesome
  others.value.counter = newState.counter
})
</script>

<template>
  <div
    class="max-w-xl w-full mx-auto rounded-xl md:my-12 p-4 md:p-8 md:border border-base-200 md:shadow-lg bg-base-100"
  >
    <RouterLinkUp />

    <h1>Options</h1>
    <p>
      You can configure various options related to this extension here. These
      options/ settings are peristent, available in all contexts, implemented
      using Pinia and useBrowserStorage composable.
    </p>

    <h3>User Interface</h3>
    <p>Change application interface settings.</p>

    <UForm
      :state="formState"
      class="space-y-4"
    >
      <UFormField label="Theme">
        <USwitch v-model="formState.isDark" />
      </UFormField>

      <h3>Profile</h3>
      <p>Change your name and age.</p>

      <UFormField label="Name">
        <UInput v-model="formState.name" />
      </UFormField>

      <UFormField label="Age">
        <UInput v-model="formState.age" />
      </UFormField>

      <h3>Others</h3>
      <p>Some other settings related to extension usage.</p>

      <UFormField label="Awesome Feature">
        <USwitch v-model="formState.awesome" />
      </UFormField>

      <UFormField label="Counter">
        <UInput
          v-model="formState.counter"
          type="number"
        />
      </UFormField>

      <p>
        * You can also make this a compoenent and then able to use this in any
        context like Popup, Developer Tools UI etc
      </p>
      <p>Feel free to change groups or options as per your requirements.</p>
    </UForm>
  </div>
</template>
