<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  sessionService,
  recipeService,
  taskService,
  type CookingSession,
  type Recipe,
  type CookingTask
} from '../services/pocketbase'
import { scheduleTasks, findConflicts } from '../utils/scheduler'

// State
const tasks = ref<CookingTask[]>([])
const recipes = ref<Recipe[]>([])
const currentSession = ref<CookingSession | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Form state
const showAddTask = ref(false)
const newTask = ref({
  recipe_id: '',
  task_name: '',
  duration_minutes: 15,
  appliance: 'counter',
  order_priority: 1,
  can_parallel: false
})

// New recipe form
const showAddRecipe = ref(false)
const newRecipe = ref({
  name: '',
  total_time: 30,
  servings: 4
})

const appliances = [
  { id: 'oven', name: 'Oven', color: 'bg-orange-500' },
  { id: 'stovetop_1', name: 'Stovetop 1', color: 'bg-blue-500' },
  { id: 'stovetop_2', name: 'Stovetop 2', color: 'bg-blue-400' },
  { id: 'counter', name: 'Counter', color: 'bg-green-500' },
  { id: 'microwave', name: 'Microwave', color: 'bg-purple-500' },
  { id: 'fridge', name: 'Fridge', color: 'bg-gray-500' },
]

const sessionDuration = computed(() => currentSession.value?.duration_minutes || 180)
const timelineScale = computed(() => 800 / sessionDuration.value)

// Lifecycle
onMounted(async () => {
  await initializeSession()
  await loadRecipes()
  await loadTasks()
})

// Functions
async function initializeSession() {
  loading.value = true
  error.value = null

  try {
    let session = await sessionService.getActive()

    if (!session) {
      // Create a new session for today
      const today = new Date().toISOString().split('T')[0]
      session = await sessionService.create({
        date: today,
        duration_minutes: 180,
        status: 'planned'
      })
    }

    currentSession.value = session
  } catch (err: any) {
    error.value = `Failed to initialize session: ${err.message || 'Unknown error'}`
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadRecipes() {
  try {
    recipes.value = await recipeService.getAll()
  } catch (err: any) {
    error.value = `Failed to load recipes: ${err.message || 'Unknown error'}`
  }
}

async function loadTasks() {
  if (!currentSession.value) return

  loading.value = true
  try {
    tasks.value = await taskService.getBySession(currentSession.value.id!)
  } catch (err: any) {
    error.value = `Failed to load tasks: ${err.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

async function addRecipe() {
  if (!newRecipe.value.name) {
    error.value = 'Recipe name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    const recipe = await recipeService.create(newRecipe.value)
    recipes.value.push(recipe)

    // Reset form
    newRecipe.value = { name: '', total_time: 30, servings: 4 }
    showAddRecipe.value = false
  } catch (err: any) {
    error.value = `Failed to add recipe: ${err.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

async function addTask() {
  if (!currentSession.value) {
    error.value = 'No active session'
    return
  }

  if (!newTask.value.task_name || !newTask.value.recipe_id) {
    error.value = 'Task name and recipe are required'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Calculate priority based on existing tasks
    const maxPriority = Math.max(...tasks.value.map(t => t.order_priority), 0)

    const task = await taskService.create({
      ...newTask.value,
      session_id: currentSession.value.id!,
      order_priority: maxPriority + 1
    })

    tasks.value.push(task)

    // Reset form
    newTask.value = {
      recipe_id: '',
      task_name: '',
      duration_minutes: 15,
      appliance: 'counter',
      order_priority: 1,
      can_parallel: false
    }
    showAddTask.value = false

    // Auto-schedule after adding
    await optimizeSchedule()
  } catch (err: any) {
    error.value = `Failed to add task: ${err.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

async function optimizeSchedule() {
  if (tasks.value.length === 0) return

  loading.value = true
  error.value = null

  try {
    // Run scheduling algorithm
    const scheduledTasks = scheduleTasks(tasks.value, sessionDuration.value)

    // Update all tasks with new start times
    for (const task of scheduledTasks) {
      if (task.id) {
        await taskService.update(task.id, { start_time: task.start_time })
      }
    }

    tasks.value = scheduledTasks

    // Check for conflicts
    const conflicts = findConflicts(tasks.value)
    if (conflicts.length > 0) {
      error.value = `Warning: ${conflicts.length} scheduling conflicts detected`
    }
  } catch (err: any) {
    error.value = `Failed to optimize schedule: ${err.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

async function deleteTask(taskId: string) {
  if (!confirm('Delete this task?')) return

  loading.value = true
  error.value = null

  try {
    await taskService.delete(taskId)
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  } catch (err: any) {
    error.value = `Failed to delete task: ${err.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

// UI Helpers
function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

function getTaskPosition(task: CookingTask) {
  return {
    left: `${(task.start_time || 0) * timelineScale.value}px`,
    width: `${task.duration_minutes * timelineScale.value}px`
  }
}

function getApplianceColor(applianceId: string) {
  return appliances.find(a => a.id === applianceId)?.color || 'bg-gray-500'
}

function getRecipeName(task: CookingTask) {
  const recipe = recipes.value.find(r => r.id === task.recipe_id)
  return recipe?.name || 'Unknown Recipe'
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Error Display -->
    <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
      {{ error }}
      <button @click="error = null" class="ml-2 text-red-500 hover:text-red-700">×</button>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" class="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
      Loading...
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Kitchen Orchestration Timeline</h2>

      <!-- Session Info & Actions -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <span class="text-gray-600">Session: </span>
          <span class="font-semibold">{{ currentSession?.date || 'No session' }}</span>
          <span class="ml-4 text-gray-600">Duration: </span>
          <span class="font-semibold">{{ formatTime(sessionDuration) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="showAddRecipe = true"
            class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            + Recipe
          </button>
          <button
            @click="showAddTask = true"
            class="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            + Task
          </button>
          <button
            @click="optimizeSchedule"
            :disabled="tasks.length === 0"
            class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
            Optimize Schedule
          </button>
        </div>
      </div>

      <!-- Add Recipe Form -->
      <div v-if="showAddRecipe" class="mb-4 p-4 border rounded-lg bg-gray-50">
        <h3 class="font-semibold mb-2">Add Recipe</h3>
        <div class="grid grid-cols-3 gap-2">
          <input
            v-model="newRecipe.name"
            placeholder="Recipe name"
            class="px-3 py-2 border rounded">
          <input
            v-model.number="newRecipe.total_time"
            type="number"
            placeholder="Total time (min)"
            class="px-3 py-2 border rounded">
          <input
            v-model.number="newRecipe.servings"
            type="number"
            placeholder="Servings"
            class="px-3 py-2 border rounded">
        </div>
        <div class="mt-2 flex gap-2">
          <button @click="addRecipe" class="px-3 py-1 bg-blue-500 text-white rounded">Save</button>
          <button @click="showAddRecipe = false" class="px-3 py-1 bg-gray-500 text-white rounded">Cancel</button>
        </div>
      </div>

      <!-- Add Task Form -->
      <div v-if="showAddTask" class="mb-4 p-4 border rounded-lg bg-gray-50">
        <h3 class="font-semibold mb-2">Add Task</h3>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <select
            v-model="newTask.recipe_id"
            class="px-3 py-2 border rounded">
            <option value="">Select Recipe</option>
            <option v-for="recipe in recipes" :key="recipe.id" :value="recipe.id">
              {{ recipe.name }}
            </option>
          </select>
          <input
            v-model="newTask.task_name"
            placeholder="Task name"
            class="px-3 py-2 border rounded">
        </div>
        <div class="grid grid-cols-3 gap-2">
          <input
            v-model.number="newTask.duration_minutes"
            type="number"
            placeholder="Duration (min)"
            class="px-3 py-2 border rounded">
          <select
            v-model="newTask.appliance"
            class="px-3 py-2 border rounded">
            <option v-for="appliance in appliances" :key="appliance.id" :value="appliance.id">
              {{ appliance.name }}
            </option>
          </select>
          <label class="flex items-center gap-2">
            <input
              v-model="newTask.can_parallel"
              type="checkbox">
            <span>Can parallel</span>
          </label>
        </div>
        <div class="mt-2 flex gap-2">
          <button @click="addTask" class="px-3 py-1 bg-blue-500 text-white rounded">Add</button>
          <button @click="showAddTask = false" class="px-3 py-1 bg-gray-500 text-white rounded">Cancel</button>
        </div>
      </div>

      <!-- Timeline Grid -->
      <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <!-- Time markers -->
        <div class="relative h-6 mb-4 border-b border-gray-300">
          <div v-for="hour in 4" :key="hour"
               :style="{ left: `${(hour - 1) * 60 * timelineScale}px` }"
               class="absolute text-xs text-gray-600">
            {{ formatTime((hour - 1) * 60) }}
          </div>
        </div>

        <!-- Appliance Rows -->
        <div class="space-y-3">
          <div v-for="appliance in appliances" :key="appliance.id" class="relative">
            <div class="absolute left-0 top-0 w-24 text-sm font-medium text-gray-700">
              {{ appliance.name }}
            </div>
            <div class="ml-28 relative h-10 bg-gray-100 rounded border border-gray-200">
              <div v-for="task in tasks.filter(t => t.appliance === appliance.id)"
                   :key="task.id"
                   :style="getTaskPosition(task)"
                   :class="[getApplianceColor(task.appliance), 'absolute top-1 h-8 rounded text-white text-xs flex items-center justify-between px-2 cursor-pointer hover:opacity-90']">
                <span class="truncate">{{ task.task_name }}</span>
                <button
                  v-if="task.id"
                  @click="deleteTask(task.id)"
                  class="ml-1 text-white hover:text-red-200">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Task List -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Scheduled Tasks ({{ tasks.length }})</h3>
        <div v-if="tasks.length === 0" class="text-gray-500">
          No tasks scheduled. Add recipes and tasks to get started!
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="task in tasks" :key="task.id"
               class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ task.task_name }}</div>
                <div class="text-sm text-gray-600">
                  {{ getRecipeName(task) }} • {{ task.duration_minutes }} min
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium">{{ formatTime(task.start_time || 0) }}</div>
                <div :class="[getApplianceColor(task.appliance), 'text-xs text-white px-2 py-1 rounded mt-1']">
                  {{ task.appliance }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>