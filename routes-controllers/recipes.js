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
    res.redirect(`recipes/${newRecipe.id}`);
  } catch {
    renderNewPage(res, recipe, true);
  }
});

//Visa recept
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate("cook").exec();
    res.render("recipes/show", { recipe: recipe });
  } catch {
    res.redirect("/");
  }
});

//Redigera recept
router.get("/:id/edit", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    renderEditPage(res, recipe);
  } catch {
    res.redirect("/");
  }
});

//Uppdatera ett recept
router.put("/:id", async (req, res) => {
  let recipe;

  try {
    recipe = await Recipe.findById(req.params.id);
    recipe.title = req.body.title;
    recipe.cook = req.body.cook;
    recipe.publishDate = new Date(req.body.publishDate);
    recipe.time = req.body.time;
    recipe.description = req.body.description;

    if (req.body.cover != null && req.body.cover !== "") {
      saveCover(recipe, req.body.cover);
    }
    await recipe.save();
    res.redirect(`/recipes/${recipe.id}`);
  } catch {
    if (recipe != null) {
      renderEditPage(res, recipe, true);
    } else {
      redirect("/");
    }
  }
});

//Radera ett recept
router.delete("/:id", async (req, res) => {
  let recipe;
  try {
    recipe = await Recipe.findById(req.params.id);
    await recipe.deleteOne();
    res.redirect("/recipes");
  } catch {
    if (recipe != null) {
      res.render("recipes/show", {
        recipe: recipe,
        errorMessage: "Could not remove recipe",
      });
    } else {
      res.redirect("/");
    }
  }
});

async function renderNewPage(res, recipe, hasError = false) {
  renderFormPage(res, recipe, "new", hasError);
}

async function renderEditPage(res, recipe, hasError = false) {
  renderFormPage(res, recipe, "edit", hasError);
}

async function renderFormPage(res, recipe, form, hasError = false) {
  try {
    const cooks = await Cook.find({});
    const params = {
      cooks: cooks,
      recipe: recipe,
    };
    if (hasError) {
      if (form === "edit") {
        params.errorMessage = "Error Updating Recipe";
      } else {
        params.errorMessage = "Error Creating Recipe";
      }
    }
    res.render(`recipes/${form}`, params);
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
