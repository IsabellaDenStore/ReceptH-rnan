if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/user");
const Recipe = require("./models/recipe"); // Import the Recipe model

// Initialize passport configuration
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  async (email) => await User.findOne({ email: email }),
  async (id) => await User.findById(id)
);

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Mongoose"));

// Set up view engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);

// Middleware
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", checkAuthenticated, async (req, res) => {
  try {
    // Fetch recipes from the database
    const recipes = await Recipe.find();

    // Render the index page with the user's name and recipes
    res.render("index", {
      name: req.user.name,
      recipes: recipes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

app.delete("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    res.redirect("/login");
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.use("/cooks", checkAuthenticated, require("./routes-controllers/cooks"));
app.use(
  "/recipes",
  checkAuthenticated,
  require("./routes-controllers/recipes")
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
