# Smart Kitchen Orchestration Schema

## Overview
Minimal schema for scheduling and coordinating cooking tasks to maximize appliance usage and ensure everything finishes on time.

## Collections

### 1. **cooking_sessions**
The main cooking session (e.g., Sunday 2-5pm meal prep)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| date | date | Session date | Required |
| duration_minutes | number | Total session length | 30-360 min |
| status | select | Current status | planned/in_progress/completed |

### 2. **recipes**
Simple recipe with essential timing information

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| name | text | Recipe name | Required, max 100 chars |
| total_time | number | Total cook time | 5-300 minutes |
| servings | number | Number of servings | 1-20 |

### 3. **cooking_tasks**
Individual tasks that need scheduling and coordination

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| session_id | relation | Link to cooking session | Required, cascade delete |
| recipe_id | relation | Link to recipe | Required |
| task_name | text | Task description | Required, max 100 chars |
| duration_minutes | number | Task duration | 1-180 minutes |
| appliance | select | Required appliance | oven/stovetop_1/stovetop_2/microwave/counter/fridge |
| start_time | number | Minutes from session start | Optional, 0-1440 |
| order_priority | number | Execution priority | 1-99 (lower = higher priority) |
| can_parallel | boolean | Can run with other tasks | Optional |

## Key Features

### Appliance Management
- **Oven**: Single resource, one task at a time
- **Stovetop**: Two burners (stovetop_1, stovetop_2)
- **Counter**: Prep work, multiple tasks possible
- **Microwave**: Quick tasks, single resource
- **Fridge**: Marinating, resting (passive tasks)

### Scheduling Logic
1. Tasks are sorted by `order_priority`
2. `start_time` is calculated to ensure:
   - Appliances aren't double-booked
   - Everything finishes within session duration
   - Tasks marked `can_parallel=true` can overlap on counter/fridge

### Example Workflow
```javascript
// Sunday Meal Prep Session
session = {
  date: "2025-01-19",
  duration_minutes: 180, // 3 hours
  status: "planned"
}

// Recipe: Roast Chicken
recipe = {
  name: "Roast Chicken",
  total_time: 90,
  servings: 4
}

// Tasks get scheduled automatically
tasks = [
  { task_name: "Prep chicken", duration: 15, appliance: "counter", priority: 1 },
  { task_name: "Roast chicken", duration: 75, appliance: "oven", priority: 2 },
  { task_name: "Boil rice", duration: 20, appliance: "stovetop_1", priority: 3, can_parallel: true },
  { task_name: "Steam vegetables", duration: 15, appliance: "stovetop_2", priority: 4, can_parallel: true }
]
```

## Benefits
- **No appliance conflicts**: System prevents double-booking
- **Optimal timing**: Tasks scheduled to finish together
- **Simple & extensible**: Easy to add new appliances or task types
- **Clear priorities**: Explicit ordering for critical tasks