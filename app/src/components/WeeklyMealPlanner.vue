<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { weeklyMealService, type WeeklyMeal } from '../services/pocketbase'
import { mealDBService, type DetailedMeal } from '../services/mealdb'

// State
const meals = ref<WeeklyMeal[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const generatingMeal = ref<string | null>(null)

// Modal state
const showModal = ref(false)
const selectedMeal = ref<DetailedMeal | null>(null)
const loadingRecipe = ref(false)

// Shopping list state
const showShoppingList = ref(false)
const shoppingListDetails = ref<DetailedMeal[]>([])
const loadingShoppingList = ref(false)

// Week days
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

// Get start of current week (Monday)
const getCurrentWeekStart = (): string => {
  const today = new Date()
  const monday = new Date(today)
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

const currentWeekStart = ref(getCurrentWeekStart())

// Computed meal map for easy access
const mealMap = computed(() => {
  const map: Record<string, WeeklyMeal> = {}
  meals.value.forEach(meal => {
    map[meal.day_of_week] = meal
  })
  return map
})

// Shopping list interfaces
interface ShoppingListItem {
  ingredient: string
  measure: string
  category: string
  checked: boolean
}

interface ShoppingListCategory {
  name: string
  items: ShoppingListItem[]
  icon: string
}

// Helper function to categorize ingredients
const categorizeIngredient = (ingredient: string): string => {
  const ingredient_lower = ingredient.toLowerCase()

  if (ingredient_lower.includes('beef') || ingredient_lower.includes('chicken') ||
      ingredient_lower.includes('pork') || ingredient_lower.includes('lamb') ||
      ingredient_lower.includes('turkey') || ingredient_lower.includes('fish') ||
      ingredient_lower.includes('salmon') || ingredient_lower.includes('tuna') ||
      ingredient_lower.includes('shrimp') || ingredient_lower.includes('bacon')) {
    return 'Meat & Seafood'
  }

  if (ingredient_lower.includes('milk') || ingredient_lower.includes('cheese') ||
      ingredient_lower.includes('butter') || ingredient_lower.includes('yogurt') ||
      ingredient_lower.includes('cream') || ingredient_lower.includes('egg')) {
    return 'Dairy & Eggs'
  }

  if (ingredient_lower.includes('tomato') || ingredient_lower.includes('onion') ||
      ingredient_lower.includes('carrot') || ingredient_lower.includes('potato') ||
      ingredient_lower.includes('pepper') || ingredient_lower.includes('mushroom') ||
      ingredient_lower.includes('garlic') || ingredient_lower.includes('lettuce') ||
      ingredient_lower.includes('spinach') || ingredient_lower.includes('cabbage')) {
    return 'Fresh Produce'
  }

  if (ingredient_lower.includes('bread') || ingredient_lower.includes('pasta') ||
      ingredient_lower.includes('rice') || ingredient_lower.includes('flour') ||
      ingredient_lower.includes('oats') || ingredient_lower.includes('noodles')) {
    return 'Grains & Bread'
  }

  if (ingredient_lower.includes('oil') || ingredient_lower.includes('salt') ||
      ingredient_lower.includes('pepper') || ingredient_lower.includes('sugar') ||
      ingredient_lower.includes('vinegar') || ingredient_lower.includes('herbs') ||
      ingredient_lower.includes('spice') || ingredient_lower.includes('sauce')) {
    return 'Condiments & Spices'
  }

  return 'Pantry Items'
}

// Computed shopping list with aggregation and categorization
const shoppingList = computed((): ShoppingListCategory[] => {
  if (shoppingListDetails.value.length === 0) return []

  // Aggregate all ingredients
  const ingredientMap = new Map<string, { measure: string, category: string }>()

  shoppingListDetails.value.forEach(meal => {
    meal.ingredients.forEach(ing => {
      const key = ing.ingredient.toLowerCase().trim()
      const category = categorizeIngredient(ing.ingredient)

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!
        // Simple consolidation - for now just combine measures with "+"
        const newMeasure = existing.measure && ing.measure ?
          `${existing.measure} + ${ing.measure}` :
          existing.measure || ing.measure
        ingredientMap.set(key, { measure: newMeasure, category })
      } else {
        ingredientMap.set(key, { measure: ing.measure, category })
      }
    })
  })

  // Group by category
  const categories = new Map<string, ShoppingListItem[]>()

  ingredientMap.forEach((data, ingredient) => {
    const item: ShoppingListItem = {
      ingredient: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
      measure: data.measure,
      category: data.category,
      checked: false
    }

    if (!categories.has(data.category)) {
      categories.set(data.category, [])
    }
    categories.get(data.category)!.push(item)
  })

  // Convert to array with icons
  const categoryIcons = {
    'Meat & Seafood': '🥩',
    'Dairy & Eggs': '🥛',
    'Fresh Produce': '🥕',
    'Grains & Bread': '🍞',
    'Condiments & Spices': '🧂',
    'Pantry Items': '🏪'
  }

  return Array.from(categories.entries()).map(([name, items]) => ({
    name,
    items: items.sort((a, b) => a.ingredient.localeCompare(b.ingredient)),
    icon: categoryIcons[name as keyof typeof categoryIcons] || '📦'
  })).sort((a, b) => a.name.localeCompare(b.name))
})

// Total ingredient count
const totalIngredients = computed(() => {
  return shoppingList.value.reduce((total, category) => total + category.items.length, 0)
})

// Load meals for current week
const loadMealsForWeek = async () => {
  try {
    loading.value = true
    error.value = null

    const existingMeals = await weeklyMealService.getMealsForWeek(currentWeekStart.value)

    if (existingMeals.length === 0) {
      // Generate new meals for the week
      await generateMealsForWeek()
    } else {
      meals.value = existingMeals
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load meals'
    console.error('Error loading meals:', err)
  } finally {
    loading.value = false
  }
}

// Generate meals for the entire week
const generateMealsForWeek = async () => {
  try {
    loading.value = true
    error.value = null

    // First, delete any existing meals for this week
    await weeklyMealService.deleteMealsForWeek(currentWeekStart.value)

    // Generate new random meals
    const randomMeals = await mealDBService.getMultipleRandomMeals(5)

    const newMeals: WeeklyMeal[] = []

    for (let i = 0; i < weekDays.length; i++) {
      const meal = randomMeals[i]
      const weeklyMeal: Omit<WeeklyMeal, 'id'> = {
        meal_id: meal.id,
        meal_name: meal.name,
        meal_thumbnail: meal.thumbnail,
        day_of_week: weekDays[i],
        week_start: currentWeekStart.value
      }

      const savedMeal = await weeklyMealService.create(weeklyMeal)
      newMeals.push(savedMeal)
    }

    meals.value = newMeals
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to generate meals'
    console.error('Error generating meals:', err)
  } finally {
    loading.value = false
  }
}

// Randomize meal for a specific day
const randomizeMealForDay = async (dayOfWeek: typeof weekDays[number]) => {
  try {
    generatingMeal.value = dayOfWeek
    error.value = null

    const newMeal = await mealDBService.getRandomMeal()
    const existingMeal = mealMap.value[dayOfWeek]

    if (existingMeal) {
      // Update existing meal
      const updatedMeal = await weeklyMealService.updateMeal(existingMeal.id!, {
        meal_id: newMeal.id,
        meal_name: newMeal.name,
        meal_thumbnail: newMeal.thumbnail
      })

      // Update local state
      const index = meals.value.findIndex(m => m.id === existingMeal.id)
      if (index !== -1) {
        meals.value[index] = updatedMeal
      }
    } else {
      // Create new meal
      const weeklyMeal: Omit<WeeklyMeal, 'id'> = {
        meal_id: newMeal.id,
        meal_name: newMeal.name,
        meal_thumbnail: newMeal.thumbnail,
        day_of_week: dayOfWeek,
        week_start: currentWeekStart.value
      }

      const savedMeal = await weeklyMealService.create(weeklyMeal)
      meals.value.push(savedMeal)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to randomize meal'
    console.error('Error randomizing meal:', err)
  } finally {
    generatingMeal.value = null
  }
}

// Modal functions
const openRecipeModal = async (meal: WeeklyMeal) => {
  try {
    loadingRecipe.value = true
    showModal.value = true
    selectedMeal.value = null

    const detailedMeal = await mealDBService.getMealWithDetails(meal.meal_id)
    selectedMeal.value = detailedMeal
  } catch (err) {
    console.error('Error loading recipe details:', err)
    closeModal()
  } finally {
    loadingRecipe.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  selectedMeal.value = null
  loadingRecipe.value = false
}

// Shopping list functions
const generateShoppingList = async () => {
  try {
    loadingShoppingList.value = true
    const mealDetails: DetailedMeal[] = []

    // Fetch detailed information for all current meals
    for (const meal of meals.value) {
      const details = await mealDBService.getMealWithDetails(meal.meal_id)
      mealDetails.push(details)
    }

    shoppingListDetails.value = mealDetails
  } catch (err) {
    console.error('Error generating shopping list:', err)
  } finally {
    loadingShoppingList.value = false
  }
}

const toggleShoppingList = async () => {
  if (!showShoppingList.value) {
    // Generate shopping list when opening
    await generateShoppingList()
  }
  showShoppingList.value = !showShoppingList.value
}

// Initialize on mount
onMounted(() => {
  loadMealsForWeek()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="hero bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 relative overflow-hidden">
      <!-- Floating Pattern -->
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] [background-size:50px_50px] animate-[drift_20s_linear_infinite]"></div>
      </div>

      <div class="relative z-10 container mx-auto px-4 py-16 text-center text-white">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-5xl md:text-6xl font-bold mb-6">Your Weekly Meals, Planned in Seconds</h1>
          <p class="text-xl md:text-2xl mb-8 opacity-95">
            Your delicious meals for {{ new Date(currentWeekStart).toLocaleDateString() }} - {{ new Date(new Date(currentWeekStart).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString() }}
          </p>

        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div class="container mx-auto px-4">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-16">
          <div class="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-pink-500 to-purple-600">
            <svg class="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating your weekly meals...
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-16">
          <div class="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-red-800">Something went wrong</h3>
                <div class="mt-2 text-red-700">{{ error }}</div>
                <button
                  @click="loadMealsForWeek()"
                  class="mt-4 bg-red-100 hover:bg-red-200 text-red-800 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Cards Layout -->
        <div v-else class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div
              v-for="day in weekDays"
              :key="day"
              class="day-card bg-white rounded-xl p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
              @click="mealMap[day] ? openRecipeModal(mealMap[day]) : null"
            >
              <!-- Day Name -->
              <div class="day-name font-bold text-pink-600 mb-3 text-lg">{{ day }}</div>

              <!-- Meal Content -->
              <div v-if="mealMap[day]">
                <!-- Meal Image -->
                <div class="meal-preview mb-4">
                  <img
                    :src="mealMap[day].meal_thumbnail"
                    :alt="mealMap[day].meal_name"
                    class="w-20 h-20 mx-auto rounded-full object-cover shadow-md"
                    loading="lazy"
                  />
                </div>

                <!-- Meal Name -->
                <div class="meal-name text-gray-600 text-sm mb-4 h-10 flex items-center justify-center leading-tight">
                  {{ mealMap[day].meal_name }}
                </div>

                <!-- Randomize Button -->
                <button
                  @click.stop="randomizeMealForDay(day)"
                  :disabled="generatingMeal === day"
                  class="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <span v-if="generatingMeal === day" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding...
                  </span>
                  <span v-else class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Randomize
                  </span>
                </button>
              </div>

              <!-- Empty State -->
              <div v-else class="py-4">
                <div class="text-gray-400 mb-4">
                  <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-sm text-gray-500 mb-4 h-10 flex items-center justify-center">No meal planned</p>
                <button
                  @click.stop="randomizeMealForDay(day)"
                  :disabled="generatingMeal === day"
                  class="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Generate Meal
                </button>
              </div>
            </div>
          </div>

          <!-- Randomize Hint -->
          <p class="text-center mt-8 text-gray-600 italic">
            👆 Click any Randomize button to swap meals instantly
          </p>

          <!-- Shopping List Section -->
          <div class="mt-8">
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <!-- Shopping List Header -->
              <div
                class="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 cursor-pointer hover:from-green-100 hover:to-green-200 transition-all duration-200"
                @click="toggleShoppingList"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full mr-4">
                      <svg v-if="loadingShoppingList" class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8v6a2 2 0 002 2h6a2 2 0 002-2v-6m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-800">Weekly Shopping List</h3>
                      <p class="text-sm text-gray-600">
                        {{ totalIngredients }} ingredients from {{ meals.length }} meals
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <svg
                      class="w-5 h-5 text-gray-500 transform transition-transform duration-200"
                      :class="{ 'rotate-180': showShoppingList }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Shopping List Content -->
              <div v-if="showShoppingList" class="p-6">
                <div v-if="loadingShoppingList" class="text-center py-8">
                  <div class="inline-flex items-center text-gray-600">
                    <svg class="animate-spin -ml-1 mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating shopping list...
                  </div>
                </div>

                <div v-else-if="shoppingList.length === 0" class="text-center py-8 text-gray-500">
                  <p>No meals selected yet. Add some meals to generate a shopping list!</p>
                </div>

                <div v-else class="space-y-6">
                  <!-- Category Groups -->
                  <div v-for="category in shoppingList" :key="category.name" class="border border-gray-200 rounded-lg overflow-hidden">
                    <!-- Category Header -->
                    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 class="font-semibold text-gray-800 flex items-center">
                        <span class="text-xl mr-3">{{ category.icon }}</span>
                        {{ category.name }}
                        <span class="ml-2 text-sm text-gray-500">({{ category.items.length }} items)</span>
                      </h4>
                    </div>

                    <!-- Category Items -->
                    <div class="p-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div
                          v-for="item in category.items"
                          :key="item.ingredient"
                          class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div class="flex items-center flex-1">
                            <input
                              type="checkbox"
                              :id="`ingredient-${item.ingredient}`"
                              v-model="item.checked"
                              class="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            >
                            <label
                              :for="`ingredient-${item.ingredient}`"
                              class="flex-1 text-sm font-medium text-gray-800 cursor-pointer"
                              :class="{ 'line-through text-gray-500': item.checked }"
                            >
                              {{ item.ingredient }}
                            </label>
                          </div>
                          <span class="text-sm text-gray-600 ml-2">{{ item.measure }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Shopping List Actions -->
                  <div class="flex justify-center pt-4 border-t border-gray-200">
                    <button
                      @click="generateShoppingList"
                      class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Refresh List
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Generate New Week Button -->
          <div class="text-center mt-12">
            <button
              @click="generateMealsForWeek()"
              :disabled="loading"
              class="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-full text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Generate New Week
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Recipe Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        @click.stop
      >
        <!-- Loading State -->
        <div v-if="loadingRecipe" class="p-8 text-center">
          <div class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-lg text-purple-600">Loading recipe details...</span>
          </div>
        </div>

        <!-- Recipe Content -->
        <div v-else-if="selectedMeal" class="relative">
          <!-- Close Button -->
          <button
            @click="closeModal"
            class="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
          >
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Recipe Header -->
          <div class="relative">
            <img
              :src="selectedMeal.thumbnail"
              :alt="selectedMeal.name"
              class="w-full h-64 md:h-80 object-cover rounded-t-xl"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-t-xl"></div>
            <div class="absolute bottom-4 left-4 text-white">
              <h2 class="text-3xl md:text-4xl font-bold mb-2">{{ selectedMeal.name }}</h2>
              <div class="flex items-center gap-4 text-sm">
                <span class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{{ selectedMeal.category }}</span>
                <span class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{{ selectedMeal.area }} Cuisine</span>
              </div>
            </div>
          </div>

          <!-- Recipe Body -->
          <div class="p-6 md:p-8">
            <div class="grid md:grid-cols-2 gap-8">
              <!-- Ingredients -->
              <div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <svg class="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                  Ingredients
                </h3>
                <ul class="space-y-2">
                  <li
                    v-for="ingredient in selectedMeal.ingredients"
                    :key="ingredient.ingredient"
                    class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <span class="font-medium text-gray-800">{{ ingredient.ingredient }}</span>
                    <span class="text-purple-600 font-semibold">{{ ingredient.measure }}</span>
                  </li>
                </ul>
              </div>

              <!-- Instructions -->
              <div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <svg class="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  Instructions
                </h3>
                <div class="prose prose-gray max-w-none">
                  <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ selectedMeal.instructions }}</p>
                </div>
              </div>
            </div>

            <!-- Additional Links -->
            <div v-if="selectedMeal.youtubeUrl || selectedMeal.sourceUrl" class="mt-8 pt-6 border-t border-gray-200">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Additional Resources</h3>
              <div class="flex gap-4">
                <a
                  v-if="selectedMeal.youtubeUrl"
                  :href="selectedMeal.youtubeUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch Video
                </a>
                <a
                  v-if="selectedMeal.sourceUrl"
                  :href="selectedMeal.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  Source Recipe
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}

.hero {
  position: relative;
}

.day-card {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.day-name {
  color: #f5576c;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 12px;
}

.meal-preview img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
}

.meal-name {
  color: #666;
  font-size: 0.9rem;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.3;
  padding: 0 4px;
}

@keyframes drift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>