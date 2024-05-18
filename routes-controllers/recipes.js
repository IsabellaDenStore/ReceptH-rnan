const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Recipe = require("../models/recipe");
const Cook = require("../models/cook");
const uploadPath = path.join("public", Recipe.coverImageBasePath);
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

//Kontroll till alla recept
router.get("/", async (req, res) => {
  let query = Recipe.find();
  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
    query = query.lte("publishDate", req.query.publishedBefore);
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
    query = query.gte("publishDate", req.query.publishedAfter);
  }

  try {
    const recipes = await query.exec();
    res.render("recipes/index", {
      recipes: recipes,
      searchOptions: req.query,
    });
  } catch {
    res.redirect("/");
  }
});

//Kontroll till att lägga till nytt recept
router.get("/new", async (req, res) => {
  renderNewPage(res, new Recipe());
});

//Kontroll till att tillverka ett recept
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const recipe = new Recipe({
    title: req.body.title,
    cook: req.body.cook,
    publishDate: new Date(req.body.publishDate),
    time: req.body.time,
    coverImageName: fileName,
    description: req.body.description,
  });

  try {
    const newRecipe = await recipe.save();
    //res.redirect(`recipes/${newRecipe.id}`);
    res.redirect(`recipes`);
  } catch {
    if (recipe.coverImageName != null) {
      removeRecipeCover(recipe.coverImageName);
    }
    renderNewPage(res, recipe, true);
  }
});

function removeRecipeCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err);
  });
}

async function renderNewPage(res, recipe, hasError = false) {
  try {
    const cooks = await Cook.find({});
    const params = {
      cooks: cooks,
      recipe: recipe,
    };
    if (hasError) params.errorMessage = "Error Creating Recipe";
    res.render("recipes/new", params);
  } catch {
    res.redirect("/recipes");
  }
}

module.exports = router;
