<script setup lang="ts">
import { ref } from 'vue'
import PocketBase from 'pocketbase'
import KitchenOrchestrator from './components/KitchenOrchestrator.vue'

// Initialize PocketBase client (you can configure the URL later)
const pb = new PocketBase('http://127.0.0.1:8090') // Default PocketBase URL

const showOrchestrator = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
    <!-- Landing/Welcome Screen -->
    <div v-if="!showOrchestrator" class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 class="text-3xl font-bold text-gray-800 mb-4">MealPrepper</h1>
        <p class="text-gray-600 mb-6">
          Smart Kitchen Orchestration - Cook efficiently, eat well all week!
        </p>
        <div class="space-y-2 text-sm text-gray-500">
          <p>✅ Schedule cooking tasks automatically</p>
          <p>✅ Maximize appliance usage</p>
          <p>✅ Everything finishes on time</p>
        </div>
        <button
          @click="showOrchestrator = true"
          class="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
          View Kitchen Timeline
        </button>
      </div>
    </div>

    <!-- Orchestrator View -->
    <div v-else>
      <nav class="bg-white shadow-md px-6 py-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-800">MealPrepper</h1>
          <button
            @click="showOrchestrator = false"
            class="text-gray-600 hover:text-gray-800 transition">
            Back to Home
          </button>
        </div>
      </nav>
      <KitchenOrchestrator />
    </div>
  </div>
</template>