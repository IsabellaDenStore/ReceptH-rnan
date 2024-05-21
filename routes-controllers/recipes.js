// Importera nödvändiga paket och modeller
const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const Cook = require("../models/cook");
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];

//Kontroll till alla recept/för att visa alla recept
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
    // Utför frågan och hämta recepten
    const recipes = await query.exec();
    // Rendera "recipes/index"-sidan med recepten och sökalternativen
    res.render("recipes/index", {
      recipes: recipes,
      searchOptions: req.query,
    });
  } catch {
    // Om det uppstår ett fel, omdirigera till startsidan
    res.redirect("/");
  }
});

//Kontroll till att lägga till nytt recept
router.get("/new", async (req, res) => {
  renderNewPage(res, new Recipe());
});

//Kontroll till att tillverka ett recept
router.post("/", async (req, res) => {
  // Skapa ett nytt recept med data från formuläret
  const recipe = new Recipe({
    title: req.body.title,
    cook: req.body.cook,
    publishDate: new Date(req.body.publishDate),
    time: req.body.time,
    description: req.body.description,
  });
  // Spara omslagsbilden om den finns
  saveCover(recipe, req.body.cover);
  try {
    // Försök att spara det nya receptet i databasen
    const newRecipe = await recipe.save();
    // Om det lyckas, omdirigera till den nya receptets sida
    res.redirect(`recipes/${newRecipe.id}`);
  } catch {
    // Om det uppstår ett fel, rendera "new"-sidan igen med felmeddelanden
    renderNewPage(res, recipe, true);
  }
});

//Visa recept
router.get("/:id", async (req, res) => {
  try {
    // Hitta receptet med ID och hämta också kockens information
    const recipe = await Recipe.findById(req.params.id).populate("cook").exec();
    // Rendera "recipes/show"-sidan med receptet
    res.render("recipes/show", { recipe: recipe });
  } catch {
    // Om det uppstår ett fel, omdirigera till startsidan
    res.redirect("/");
  }
});

//Redigera recept
router.get("/:id/edit", async (req, res) => {
  try {
    // Hitta receptet med ID
    const recipe = await Recipe.findById(req.params.id);
    // Rendera "edit"-sidan med receptet
    renderEditPage(res, recipe);
  } catch {
    // Om fel, tillbaka till start
    res.redirect("/");
  }
});

//Uppdatera ett recept
router.put("/:id", async (req, res) => {
  let recipe;

  try {
    // Hitta receptet med ID
    recipe = await Recipe.findById(req.params.id);
    // Uppdatera receptet med data från formuläret
    recipe.title = req.body.title;
    recipe.cook = req.body.cook;
    recipe.publishDate = new Date(req.body.publishDate);
    recipe.time = req.body.time;
    recipe.description = req.body.description;

    // Spara omslagsbilden om den finns
    if (req.body.cover != null && req.body.cover !== "") {
      saveCover(recipe, req.body.cover);
    }

    // Spara de uppdaterade receptet i databasen
    await recipe.save();
    // Om det lyckas, omdirigera till receptets sida
    res.redirect(`/recipes/${recipe.id}`);
  } catch {
    // Om det uppstår ett fel och receptet inte är null, rendera "edit"-sidan igen med felmeddelanden
    if (recipe != null) {
      renderEditPage(res, recipe, true);
    } else {
      // Om det uppstår ett fel och receptet är null, omdirigera till startsidan
      redirect("/");
    }
  }
});

//Radera ett recept
router.delete("/:id", async (req, res) => {
  let recipe;
  try {
    // Hitta receptet med ID
    recipe = await Recipe.findById(req.params.id);
    // Ta bort receptet från databasen
    await recipe.deleteOne();
    // Om det lyckas, omdirigera till receptlistan
    res.redirect("/recipes");
  } catch {
    // Om det uppstår ett fel och receptet inte är null, rendera "show"-sidan igen med felmeddelanden
    if (recipe != null) {
      res.render("recipes/show", {
        recipe: recipe,
        errorMessage: "Could not remove recipe",
      });
    } else {
      // Om det uppstår ett fel och receptet är null, omdirigera till startsidan
      res.redirect("/");
    }
  }
});

// Funktion för att rendera "new"-sidan med eller utan felmeddelanden
async function renderNewPage(res, recipe, hasError = false) {
  renderFormPage(res, recipe, "new", hasError);
}

// Funktion för att rendera "edit"-sidan med eller utan felmeddelanden
async function renderEditPage(res, recipe, hasError = false) {
  renderFormPage(res, recipe, "edit", hasError);
}

// Funktion för att rendera formulärsidorna ("new" och "edit") med kockdata och eventuella felmeddelanden
async function renderFormPage(res, recipe, form, hasError = false) {
  try {
    // Hämta alla kockar från databasen
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
    // Rendera formulärsidan (antingen "new" eller "edit") med kockdata och eventuella felmeddelanden
    res.render(`recipes/${form}`, params);
  } catch {
    // Om fel, rendera till receptsidan
    res.redirect("/recipes");
  }
}

// Funktion för att spara omslagsbilden till ett recept
function saveCover(recipe, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    recipe.coverImage = new Buffer.from(cover.data, "base64");
    recipe.coverImageType = cover.type;
  }
}
module.exports = router;
