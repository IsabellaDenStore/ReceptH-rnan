const express = require("express");
const router = express.Router();
const Cook = require("../models/cook");
const Recipe = require("../models/recipe");

//Kontroll till alla kockar
router.get("/", async (req, res) => {
  let searchOptions = {};
  // Om det finns ett namn i sökparametern, lägg till det i sökalternativen
  if (req.query.name != null && req.query.name !== "") {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  try {
    // Hämta alla kockar som matchar sökalternativen
    const cooks = await Cook.find(searchOptions);
    // Rendera sidan för att visa kockar och skicka med kockarna och sökalternativen
    res.render("cooks/index", {
      cooks: cooks,
      searchOptions: req.query,
    });
  } catch {
    // Om fel, omdirigera till hemsidan
    res.redirect("/");
  }
});

//Kontroll till att lägga till ny kock
router.get("/new", (req, res) => {
  res.render("cooks/new", { cook: new Cook() });
});

//Kontroll till att tillverka en kock
router.post("/", async (req, res) => {
  const cook = new Cook({
    name: req.body.name, // Skapa en ny kock med namnet från formuläret
  });
  try {
    // Försök att spara den nya kocken i databasen
    const newCook = await cook.save();
    // Vid sparning, omdirigera till sidan för den nya kocken
    res.redirect(`cooks/${newCook.id}`);
  } catch {
    // Om fel, rendera sidan för att skapa en ny kock igen med ett felmeddelande
    res.render("cooks/new", {
      cook: cook,
      errorMessage: "Error creating Cook",
    });
  }
});

//Visa en specifik kock och deras recept
router.get("/:id", async (req, res) => {
  try {
    // Hämta kocken med det angivna ID:t från URL:en
    const cook = await Cook.findById(req.params.id);
    // Hämta recept skapade av denna kock, begränsa till 6 st
    const recipes = await Recipe.find({ cook: cook.id }).limit(6).exec();
    // Rendera sidan för att visa kocken och deras recept
    res.render("cooks/show", {
      cook: cook,
      recipesByCook: recipes,
    });
  } catch {
    res.redirect("/");
  }
});

//Redigera/Ändra på infro om kock
router.get("/:id/edit", async (req, res) => {
  try {
    // Hämta kocken med det angivna ID:t från URL:en
    const cook = await Cook.findById(req.params.id);
    // Rendera sidan för att redigera kocken
    res.render("cooks/edit", { cook: cook });
  } catch {
    res.redirect("/cooks");
  }
});

//Updatera
router.put("/:id", async (req, res) => {
  let cook;
  try {
    cook = await Cook.findById(req.params.id);
    // Uppdatera kockens namn med värdet från formuläret
    cook.name = req.body.name;
    // Spara ändringarna i databasen
    await cook.save();
    res.redirect(`/cooks/${cook.id}`);
  } catch {
    if (cook == null) {
      // Om kocken inte hittas, omdirigera till hemsidan
      res.redirect("/");
    } else {
      // Om andra fel, rendera sidan för att redigera kocken igen med ett felmeddelande
      res.render("cooks/edit", {
        cook: cook,
        errorMessage: "Error updating Cook",
      });
    }
  }
});

//Radera en kock
router.delete("/:id", async (req, res) => {
  try {
    // Försök att radera kocken med det angivna ID:t från URL:en
    const response = await Cook.deleteOne({ _id: req.params.id });
    if (response.deletedCount === 0) {
      // Om ingen kock raderades, omdirigera till hemsidan
      res.redirect("/");
    } else {
      // Vid lyckad radering, omdirigera till listan över alla kockar
      res.redirect("/cooks");
    }
  } catch (err) {
    // Vid fel, omdirigera till listan över alla kockar
    res.redirect("/cooks");
  }
});

module.exports = router;
