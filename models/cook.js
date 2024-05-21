const mongoose = require("mongoose");
const Recipe = require("./recipe");

const cookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Logik för att bestämma om man ska kunna radera en kock innan raderingen genomförs
// Så att man inte kan radera en kock som är kopplad till ett recept
cookSchema.pre("deleteOne", async function (next) {
  try {
    const query = this.getFilter();
    const hasRecipe = await Recipe.exists({ cook: query._id });

    if (hasRecipe) {
      next(new Error("This cook has recipes"));
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Cook", cookSchema);
