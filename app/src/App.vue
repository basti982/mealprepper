<script setup lang="ts">
import PocketBase from 'pocketbase'
import WeeklyMealPlanner from './components/WeeklyMealPlanner.vue'

// Initialize PocketBase client
const pb = new PocketBase('http://127.0.0.1:8090')
</script>

<template>
  <!-- Meal Planner View -->
  <WeeklyMealPlanner />
</template>