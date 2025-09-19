migrate((db) => {
  // Create recipes collection
  const recipesCollection = new Collection({
    "id": "recipes",
    "created": "2024-01-01 00:00:00.000Z",
    "updated": "2024-01-01 00:00:00.000Z",
    "name": "recipes",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "name_field",
        "name": "name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "total_time_field",
        "name": "total_time",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 5,
          "max": 300,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "servings_field",
        "name": "servings",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 20,
          "noDecimal": true
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  const sessionsCollection = new Collection({
    "id": "cooking_sessions",
    "created": "2024-01-01 00:00:00.000Z",
    "updated": "2024-01-01 00:00:00.000Z",
    "name": "cooking_sessions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "date_field",
        "name": "date",
        "type": "date",
        "required": true,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "duration_field",
        "name": "duration_minutes",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 30,
          "max": 360,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "status_field",
        "name": "status",
        "type": "select",
        "required": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "planned",
            "in_progress",
            "completed"
          ]
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  const tasksCollection = new Collection({
    "id": "cooking_tasks",
    "created": "2024-01-01 00:00:00.000Z",
    "updated": "2024-01-01 00:00:00.000Z",
    "name": "cooking_tasks",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "session_id_field",
        "name": "session_id",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "recipe_id_field",
        "name": "recipe_id",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "task_name_field",
        "name": "task_name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "duration_minutes_field",
        "name": "duration_minutes",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 180,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "appliance_field",
        "name": "appliance",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 20,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "start_time_field",
        "name": "start_time",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 1440,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "order_priority_field",
        "name": "order_priority",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 99,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "can_parallel_field",
        "name": "can_parallel",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(recipesCollection) &&
         Dao(db).saveCollection(sessionsCollection) &&
         Dao(db).saveCollection(tasksCollection);
}, (db) => {
  // Rollback
  const dao = new Dao(db);

  const recipesCollection = dao.findCollectionByNameOrId("recipes");
  const sessionsCollection = dao.findCollectionByNameOrId("cooking_sessions");
  const tasksCollection = dao.findCollectionByNameOrId("cooking_tasks");

  return dao.deleteCollection(recipesCollection) &&
         dao.deleteCollection(sessionsCollection) &&
         dao.deleteCollection(tasksCollection);
});