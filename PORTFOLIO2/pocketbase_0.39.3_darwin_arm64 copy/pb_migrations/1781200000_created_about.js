/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210001",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "Main heading (e.g. 'Dominik Oswald — @hearthead.ozzy')",
        "hidden": false,
        "id": "text1001000001",
        "max": 0,
        "min": 0,
        "name": "heading",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "Short intro paragraph shown in large text",
        "hidden": false,
        "id": "text1001000002",
        "max": 0,
        "min": 0,
        "name": "lede",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "convertURLs": false,
        "help": "Body copy (supports HTML). Use two <p> tags for two paragraphs.",
        "hidden": false,
        "id": "editor1001000003",
        "maxSize": 0,
        "name": "copy",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "help": "Portrait photo",
        "hidden": false,
        "id": "file1001000004",
        "maxSelect": 1,
        "maxSize": 0,
        "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/avif"],
        "name": "portrait",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": null,
        "type": "file"
      },
      {
        "exceptDomains": null,
        "help": "Contact email address",
        "hidden": false,
        "id": "email1001000005",
        "name": "email",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "email"
      },
      {
        "exceptDomains": null,
        "help": "Instagram profile URL",
        "hidden": false,
        "id": "url1001000006",
        "name": "instagram",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "autodate1001000007",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate1001000008",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_about_000001",
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "name": "about",
    "system": false,
    "type": "base"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_about_000001");
  return app.delete(collection);
})
