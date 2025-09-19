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
  <div class="p-4 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold text-gray-900">Kitchen Orchestration</h2>
      <p class="text-sm text-gray-600">Manage your cooking tasks and schedule</p>
    </div>
    <!-- Updated: Clean, compact styling -->

    <!-- Error Display -->
    <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
      {{ error }}
      <button @click="error = null" class="float-right text-red-500 hover:text-red-700">×</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="fixed top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded text-sm">
      Loading...
    </div>

    <!-- Session Info & Actions -->
    <div class="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center space-x-4 text-sm text-gray-600">
          <span>Session: {{ currentSession?.date || 'No session' }}</span>
          <span>Duration: {{ formatTime(sessionDuration) }}</span>
          <span>{{ tasks.length }} tasks</span>
        </div>
        <div class="flex space-x-2">
          <button
            @click="showAddRecipe = true"
            class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
            + Recipe
          </button>
          <button
            @click="showAddTask = true"
            class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            + Task
          </button>
          <button
            @click="optimizeSchedule"
            :disabled="tasks.length === 0"
            class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50">
            Optimize
          </button>
        </div>
      </div>

      <!-- Add Recipe Form -->
      <div v-if="showAddRecipe" class="p-4 bg-gray-50 rounded border mb-4">
        <h3 class="text-sm font-medium mb-3">Add Recipe</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            v-model="newRecipe.name"
            placeholder="Recipe name"
            class="px-3 py-2 border rounded text-sm">
          <input
            v-model.number="newRecipe.total_time"
            type="number"
            placeholder="Time (min)"
            class="px-3 py-2 border rounded text-sm">
          <input
            v-model.number="newRecipe.servings"
            type="number"
            placeholder="Servings"
            class="px-3 py-2 border rounded text-sm">
        </div>
        <div class="flex justify-end space-x-2 mt-3">
          <button @click="showAddRecipe = false" class="px-3 py-1 text-gray-600 text-sm">Cancel</button>
          <button @click="addRecipe" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Save</button>
        </div>
      </div>

      <!-- Add Task Form -->
      <div v-if="showAddTask" class="p-4 bg-gray-50 rounded border mb-4">
        <h3 class="text-sm font-medium mb-3">Add Task</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select
            v-model="newTask.recipe_id"
            class="px-3 py-2 border rounded text-sm">
            <option value="">Select Recipe</option>
            <option v-for="recipe in recipes" :key="recipe.id" :value="recipe.id">
              {{ recipe.name }}
            </option>
          </select>
          <input
            v-model="newTask.task_name"
            placeholder="Task name"
            class="px-3 py-2 border rounded text-sm">
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            v-model.number="newTask.duration_minutes"
            type="number"
            placeholder="Duration (min)"
            class="px-3 py-2 border rounded text-sm">
          <select
            v-model="newTask.appliance"
            class="px-3 py-2 border rounded text-sm">
            <option v-for="appliance in appliances" :key="appliance.id" :value="appliance.id">
              {{ appliance.name }}
            </option>
          </select>
          <label class="flex items-center space-x-2">
            <input
              v-model="newTask.can_parallel"
              type="checkbox"
              class="rounded">
            <span class="text-sm">Can parallel</span>
          </label>
        </div>
        <div class="flex justify-end space-x-2 mt-3">
          <button @click="showAddTask = false" class="px-3 py-1 text-gray-600 text-sm">Cancel</button>
          <button @click="addTask" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add</button>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h3 class="text-lg font-medium mb-4">Timeline</h3>

      <!-- Desktop Timeline -->
      <div class="hidden md:block">
        <!-- Time markers -->
        <div class="flex mb-2">
          <div class="w-24 flex-shrink-0"></div>
          <div class="flex-1 flex justify-between text-xs text-gray-600 px-2">
            <span v-for="hour in 4" :key="hour">{{ formatTime((hour - 1) * 60) }}</span>
          </div>
        </div>

        <!-- Appliance Rows -->
        <div class="space-y-2">
          <div v-for="appliance in appliances" :key="appliance.id" class="flex items-center">
            <div class="w-24 text-sm font-medium text-gray-700 flex-shrink-0">
              {{ appliance.name }}
            </div>
            <div class="flex-1 relative h-8 bg-gray-100 rounded ml-4">
              <div v-for="task in tasks.filter(t => t.appliance === appliance.id)"
                   :key="task.id"
                   :style="getTaskPosition(task)"
                   :class="[getApplianceColor(task.appliance), 'absolute top-0.5 h-7 rounded text-white text-xs flex items-center px-2']">
                <span class="truncate">{{ task.task_name }}</span>
                <button
                  v-if="task.id"
                  @click="deleteTask(task.id)"
                  class="ml-1 text-white hover:text-red-200 text-sm">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Timeline -->
      <div class="md:hidden">
        <!-- Time reference -->
        <div class="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
          Session Duration: {{ formatTime(sessionDuration) }}
        </div>

        <!-- Mobile appliance list -->
        <div class="space-y-3">
          <div v-for="appliance in appliances" :key="appliance.id">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-700">{{ appliance.name }}</h4>
              <span class="text-xs text-gray-500">
                {{ tasks.filter(t => t.appliance === appliance.id).length }} tasks
              </span>
            </div>
            <div class="space-y-1">
              <div v-if="tasks.filter(t => t.appliance === appliance.id).length === 0"
                   class="text-xs text-gray-400 italic py-2">
                No tasks scheduled
              </div>
              <div v-else
                   v-for="task in tasks.filter(t => t.appliance === appliance.id)"
                   :key="task.id"
                   :class="[getApplianceColor(task.appliance), 'p-2 rounded text-white text-xs flex justify-between items-center']">
                <div>
                  <div class="font-medium">{{ task.task_name }}</div>
                  <div class="opacity-75">{{ task.duration_minutes }}min • Start: {{ formatTime(task.start_time || 0) }}</div>
                </div>
                <button
                  v-if="task.id"
                  @click="deleteTask(task.id)"
                  class="text-white hover:text-red-200 text-sm ml-2">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task List -->
    <div class="bg-white rounded-lg shadow-sm border p-4">
      <h3 class="text-lg font-medium mb-3">Tasks ({{ tasks.length }})</h3>
      <div v-if="tasks.length === 0" class="text-center py-8 text-gray-500">
        No tasks yet. Add recipes and tasks to get started!
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="task in tasks" :key="task.id"
             class="border rounded p-3 hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium text-sm">{{ task.task_name }}</div>
              <div class="text-xs text-gray-600">
                {{ getRecipeName(task) }} • {{ task.duration_minutes }}min
              </div>
              <div class="flex items-center space-x-1 mt-1">
                <span :class="[getApplianceColor(task.appliance), 'text-xs text-white px-2 py-0.5 rounded']">
                  {{ appliances.find(a => a.id === task.appliance)?.name || task.appliance }}
                </span>
                <span v-if="task.can_parallel" class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                  Parallel
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium">{{ formatTime(task.start_time || 0) }}</div>
              <div class="text-xs text-gray-500">Start</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>