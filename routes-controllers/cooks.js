const express = require("express");
const router = express.Router();
const Cook = require("../models/cook");
const Recipe = require("../models/recipe");

//Kontroll till alla kockar
router.get("/", async (req, res) => {
  let searchOptions = {};
  if (req.query.name != null && req.query.name !== "") {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  try {
    const cooks = await Cook.find(searchOptions);
    res.render("cooks/index", {
      cooks: cooks,
      searchOptions: req.query,
    });
  } catch {
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
    name: req.body.name,
  });
  try {
    const newCook = await cook.save();
    res.redirect(`cooks/${newCook.id}`);
  } catch {
    res.render("cooks/new", {
      cook: cook,
      errorMessage: "Error creating Cook",
    });
  }
});

//Show
router.get("/:id", async (req, res) => {
  try {
    const cook = await Cook.findById(req.params.id);
    const recipes = await Recipe.find({ cook: cook.id }).limit(6).exec();
    res.render("cooks/show", {
      cook: cook,
      recipesByCook: recipes,
    });
  } catch {
    res.redirect("/");
  }
});

//Edit
router.get("/:id/edit", async (req, res) => {
  try {
    const cook = await Cook.findById(req.params.id);
    res.render("cooks/edit", { cook: cook });
  } catch {
    res.redirect("/cooks");
  }
});

//Update
router.put("/:id", async (req, res) => {
  let cook;
  try {
    cook = await Cook.findById(req.params.id);
    cook.name = req.body.name;
    await cook.save();
    res.redirect(`/cooks/${cook.id}`);
  } catch {
    if (cook == null) {
      res.redirect("/");
    } else {
      res.render("cooks/edit", {
        cook: cook,
        errorMessage: "Error updating Cook",
      });
    }
  }
});

//Delete
router.delete("/:id", async (req, res) => {
  try {
    const response = await Cook.deleteOne({ _id: req.params.id });
    if (response.deletedCount === 0) {
      res.redirect("/");
    } else {
      res.redirect("/cooks");
    }
  } catch (err) {
    res.redirect("/cooks");
  }
});

module.exports = router;
