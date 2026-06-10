/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853")

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "file1194031162",
    "maxSelect": 20,
    "maxSize": 100000000,
    "mimeTypes": null,
    "name": "gallery",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853")

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "file1194031162",
    "maxSelect": 10,
    "maxSize": 50000000,
    "mimeTypes": null,
    "name": "gallery",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
})
