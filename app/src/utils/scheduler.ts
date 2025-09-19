import type { CookingTask } from '../services/pocketbase'

interface ApplianceSlot {
  appliance: string
  busyUntil: number
}

/**
 * Automatically schedule tasks to avoid appliance conflicts
 * Core algorithm for Smart Kitchen Orchestration
 */
export function scheduleTasks(
  tasks: CookingTask[],
  sessionDuration: number
): CookingTask[] {
  // Initialize appliance availability tracker
  const applianceSlots: Record<string, number> = {
    'oven': 0,
    'stovetop_1': 0,
    'stovetop_2': 0,
    'microwave': 0,
    'counter': 0,
    'fridge': 0
  }

  // Sort tasks by priority
  const sortedTasks = [...tasks].sort((a, b) => a.order_priority - b.order_priority)

  const scheduledTasks: CookingTask[] = []

  for (const task of sortedTasks) {
    // For counter and fridge, check if we can parallel process
    if ((task.appliance === 'counter' || task.appliance === 'fridge') && task.can_parallel) {
      // Can start immediately or when current task on this appliance is free
      task.start_time = applianceSlots[task.appliance]
    } else {
      // Find earliest time this appliance is available
      task.start_time = applianceSlots[task.appliance]

      // Update appliance availability (it's busy until task completes)
      applianceSlots[task.appliance] = task.start_time + task.duration_minutes
    }

    // Check if task fits within session
    const endTime = task.start_time + task.duration_minutes
    if (endTime > sessionDuration) {
      console.warn(`Task "${task.task_name}" would exceed session duration. Scheduling at the limit.`)
      // Try to fit it earlier if possible
      task.start_time = Math.max(0, sessionDuration - task.duration_minutes)
    }

    scheduledTasks.push(task)
  }

  return scheduledTasks
}

/**
 * Find conflicts between tasks (same appliance, overlapping time)
 */
export function findConflicts(tasks: CookingTask[]): Array<[CookingTask, CookingTask]> {
  const conflicts: Array<[CookingTask, CookingTask]> = []

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const task1 = tasks[i]
      const task2 = tasks[j]

      // Skip if different appliances
      if (task1.appliance !== task2.appliance) continue

      // Skip if both can parallel on counter/fridge
      if ((task1.appliance === 'counter' || task1.appliance === 'fridge') &&
          task1.can_parallel && task2.can_parallel) continue

      // Check for time overlap
      const start1 = task1.start_time || 0
      const end1 = start1 + task1.duration_minutes
      const start2 = task2.start_time || 0
      const end2 = start2 + task2.duration_minutes

      if (start1 < end2 && start2 < end1) {
        conflicts.push([task1, task2])
      }
    }
  }

  return conflicts
}

/**
 * Calculate optimal session duration based on tasks
 */
export function calculateOptimalDuration(tasks: CookingTask[]): number {
  if (tasks.length === 0) return 120 // Default 2 hours

  // Group tasks by appliance
  const applianceTime: Record<string, number> = {}

  for (const task of tasks) {
    if (!applianceTime[task.appliance]) {
      applianceTime[task.appliance] = 0
    }

    // For parallel tasks, don't add full time
    if ((task.appliance === 'counter' || task.appliance === 'fridge') && task.can_parallel) {
      applianceTime[task.appliance] = Math.max(
        applianceTime[task.appliance],
        task.duration_minutes
      )
    } else {
      applianceTime[task.appliance] += task.duration_minutes
    }
  }

  // Return the maximum time needed for any single appliance
  // Add 15 minutes buffer for transitions
  return Math.max(...Object.values(applianceTime)) + 15
}