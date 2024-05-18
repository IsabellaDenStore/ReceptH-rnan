const express = require("express");
const router = express.Router();
const Cook = require("../models/cook");

//Kontroll till alla kokar
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

//Kontroll till att lägga till ny kok
router.get("/new", (req, res) => {
  res.render("cooks/new", { cook: new Cook() });
});

//Kontroll till att tillverka en kok
router.post("/", async (req, res) => {
  const cook = new Cook({
    name: req.body.name,
  });
  try {
    const newCook = await cook.save();
    //res.redirect(`cooks/${newCook.id}`);
    res.redirect(`cooks`);
  } catch {
    res.render("cooks/new", {
      cook: cook,
      errorMessage: "Error creating Cook",
    });
  }
});

module.exports = router;
