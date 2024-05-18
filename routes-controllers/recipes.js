const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const Cook = require("../models/cook");
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];

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
router.post("/", async (req, res) => {
  const recipe = new Recipe({
    title: req.body.title,
    cook: req.body.cook,
    publishDate: new Date(req.body.publishDate),
    time: req.body.time,
    description: req.body.description,
  });
  saveCover(recipe, req.body.cover);
  try {
    const newRecipe = await recipe.save();
    //res.redirect(`recipes/${newRecipe.id}`);
    res.redirect(`recipes`);
  } catch {
    renderNewPage(res, recipe, true);
  }
});

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

function saveCover(recipe, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    recipe.coverImage = new Buffer.from(cover.data, "base64");
    recipe.coverImageType = cover.type;
  }
}
module.exports = router;
