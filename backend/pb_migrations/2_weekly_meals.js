migrate((db) => {
  // Create weekly_meals collection
  const weeklyMealsCollection = new Collection({
    "id": "weekly_meals",
    "created": "2024-01-01 00:00:00.000Z",
    "updated": "2024-01-01 00:00:00.000Z",
    "name": "weekly_meals",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "meal_id_field",
        "name": "meal_id",
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
        "id": "meal_name_field",
        "name": "meal_name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "meal_thumbnail_field",
        "name": "meal_thumbnail",
        "type": "url",
        "required": true,
        "unique": false,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "system": false,
        "id": "day_of_week_field",
        "name": "day_of_week",
        "type": "select",
        "required": true,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
          ]
        }
      },
      {
        "system": false,
        "id": "week_start_field",
        "name": "week_start",
        "type": "date",
        "required": true,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_weekly_meals_week_day` ON `weekly_meals` (`week_start`, `day_of_week`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(weeklyMealsCollection);
}, (db) => {
  // Rollback
  const dao = new Dao(db);
  const weeklyMealsCollection = dao.findCollectionByNameOrId("weekly_meals");
  return dao.deleteCollection(weeklyMealsCollection);
});