const mongoose = require("mongoose");

const cookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Cook", cookSchema);
