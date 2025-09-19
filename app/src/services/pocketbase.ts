import PocketBase from 'pocketbase'

export const pb = new PocketBase('http://127.0.0.1:8090')

// Types
export interface CookingSession {
  id?: string
  date: string
  duration_minutes: number
  status: string
}

export interface Recipe {
  id?: string
  name: string
  total_time: number
  servings: number
}

export interface CookingTask {
  id?: string
  session_id: string
  recipe_id: string
  task_name: string
  duration_minutes: number
  appliance: string
  start_time?: number
  order_priority: number
  can_parallel?: boolean
}

// Service functions
export const sessionService = {
  async create(data: Omit<CookingSession, 'id'>): Promise<CookingSession> {
    try {
      return await pb.collection('cooking_sessions').create(data)
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  },

  async getActive(): Promise<CookingSession | null> {
    try {
      const records = await pb.collection('cooking_sessions').getList(1, 1, {
        filter: 'status != "completed"',
        sort: '-created'
      })
      return records.items[0] || null
    } catch (error) {
      console.error('Failed to get active session:', error)
      return null
    }
  }
}

export const recipeService = {
  async create(data: Omit<Recipe, 'id'>): Promise<Recipe> {
    try {
      return await pb.collection('recipes').create(data)
    } catch (error) {
      console.error('Failed to create recipe:', error)
      throw error
    }
  },

  async getAll(): Promise<Recipe[]> {
    try {
      const records = await pb.collection('recipes').getFullList({
        sort: 'name'
      })
      return records
    } catch (error) {
      console.error('Failed to get recipes:', error)
      return []
    }
  }
}

export const taskService = {
  async create(data: Omit<CookingTask, 'id'>): Promise<CookingTask> {
    try {
      return await pb.collection('cooking_tasks').create(data)
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  },

  async getBySession(sessionId: string): Promise<CookingTask[]> {
    try {
      const records = await pb.collection('cooking_tasks').getFullList({
        filter: `session_id = "${sessionId}"`,
        sort: 'start_time,order_priority'
      })
      return records
    } catch (error) {
      console.error('Failed to get tasks:', error)
      return []
    }
  },

  async update(id: string, data: Partial<CookingTask>): Promise<CookingTask> {
    try {
      return await pb.collection('cooking_tasks').update(id, data)
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('cooking_tasks').delete(id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    }
  }
}