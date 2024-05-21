const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");

router.get("/", async (req, res) => {
  let recipes;
  try {
    // Försöker att hämta de senaste 10 recepten från databasen, sorterade efter datumet de skapades
    recipes = await Recipe.find().sort({ createdAt: "desc" }).limit(10).exec();
  } catch {
    // Om det uppstår ett fel när man hämtar recepten så sätts variabeln till en tom array
    recipes = [];
  }
  // Rendera "index"-sidan och skicka recepten till vyn
  res.render("index", { recipes: recipes });
});

module.exports = router;
