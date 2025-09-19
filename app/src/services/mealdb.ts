// TheMealDB API service
const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1'

export interface MealDBResponse {
  meals: MealDBMeal[]
}

export interface MealDBMeal {
  idMeal: string
  strMeal: string
  strDrinkAlternate?: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags?: string
  strYoutube?: string
  strIngredient1?: string
  strIngredient2?: string
  strIngredient3?: string
  strIngredient4?: string
  strIngredient5?: string
  strIngredient6?: string
  strIngredient7?: string
  strIngredient8?: string
  strIngredient9?: string
  strIngredient10?: string
  strIngredient11?: string
  strIngredient12?: string
  strIngredient13?: string
  strIngredient14?: string
  strIngredient15?: string
  strIngredient16?: string
  strIngredient17?: string
  strIngredient18?: string
  strIngredient19?: string
  strIngredient20?: string
  strMeasure1?: string
  strMeasure2?: string
  strMeasure3?: string
  strMeasure4?: string
  strMeasure5?: string
  strMeasure6?: string
  strMeasure7?: string
  strMeasure8?: string
  strMeasure9?: string
  strMeasure10?: string
  strMeasure11?: string
  strMeasure12?: string
  strMeasure13?: string
  strMeasure14?: string
  strMeasure15?: string
  strMeasure16?: string
  strMeasure17?: string
  strMeasure18?: string
  strMeasure19?: string
  strMeasure20?: string
  strSource?: string
  strImageSource?: string
  strCreativeCommonsConfirmed?: string
  dateModified?: string
}

export interface SimplifiedMeal {
  id: string
  name: string
  thumbnail: string
}

export interface DetailedMeal {
  id: string
  name: string
  thumbnail: string
  category: string
  area: string
  instructions: string
  ingredients: Array<{ingredient: string, measure: string}>
  youtubeUrl?: string
  sourceUrl?: string
}

class MealDBService {
  private async fetchFromAPI(endpoint: string): Promise<MealDBResponse> {
    try {
      const response = await fetch(`${MEALDB_BASE_URL}${endpoint}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching from MealDB API:', error)
      throw error
    }
  }

  async getRandomMeal(): Promise<SimplifiedMeal> {
    const data = await this.fetchFromAPI('/random.php')
    if (!data.meals || data.meals.length === 0) {
      throw new Error('No meals found')
    }

    const meal = data.meals[0]
    return {
      id: meal.idMeal,
      name: meal.strMeal,
      thumbnail: meal.strMealThumb
    }
  }

  async getMultipleRandomMeals(count: number): Promise<SimplifiedMeal[]> {
    const meals: SimplifiedMeal[] = []
    const promises: Promise<SimplifiedMeal>[] = []

    for (let i = 0; i < count; i++) {
      promises.push(this.getRandomMeal())
    }

    try {
      const results = await Promise.all(promises)
      meals.push(...results)
      return meals
    } catch (error) {
      console.error('Error fetching multiple random meals:', error)
      throw error
    }
  }

  async getMealById(id: string): Promise<SimplifiedMeal> {
    const data = await this.fetchFromAPI(`/lookup.php?i=${id}`)
    if (!data.meals || data.meals.length === 0) {
      throw new Error(`Meal with ID ${id} not found`)
    }

    const meal = data.meals[0]
    return {
      id: meal.idMeal,
      name: meal.strMeal,
      thumbnail: meal.strMealThumb
    }
  }

  async getMealWithDetails(id: string): Promise<DetailedMeal> {
    const data = await this.fetchFromAPI(`/lookup.php?i=${id}`)
    if (!data.meals || data.meals.length === 0) {
      throw new Error(`Meal with ID ${id} not found`)
    }

    const meal = data.meals[0]

    const ingredients: Array<{ingredient: string, measure: string}> = []
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof MealDBMeal] as string
      const measure = meal[`strMeasure${i}` as keyof MealDBMeal] as string

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure ? measure.trim() : ''
        })
      }
    }

    return {
      id: meal.idMeal,
      name: meal.strMeal,
      thumbnail: meal.strMealThumb,
      category: meal.strCategory,
      area: meal.strArea,
      instructions: meal.strInstructions,
      ingredients,
      youtubeUrl: meal.strYoutube || undefined,
      sourceUrl: meal.strSource || undefined
    }
  }
}

export const mealDBService = new MealDBService()