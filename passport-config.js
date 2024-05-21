// Importera nödvändiga moduler och modeller
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("./models/user");

// Funktion för att sätta igång autentisering med Passport.js
function initialize(passport, getUserByEmail, getUserById) {
  // Funktion för att autentisera användaren
  const authenticateUser = async (email, password, done) => {
    // Hämta användaren från databasen baserat på e-postadressen
    const user = await getUserByEmail(email);

    // Om ingen användare hittades med den angivna e-postadressen får man ett meddelande om att det inte finns någon användare med det mailet
    if (user == null) {
      return done(null, false, { message: "Ingen användare med detta mail" });
    }

    try {
      // Jämför lösenordet som användaren skickade med det hashade lösenordet i databasen
      if (await bcrypt.compare(password, user.password)) {
        // Om lösenorden matchar, skicka tillbaka användaren som autentiserad
        return done(null, user);
      } else {
        // Om lösenorden inte matchar, skicka ett felmeddelande om att lösenordet är fel
        return done(null, false, { message: "Lösenordet är fel" });
      }
    } catch (e) {
      // Hantera eventuella fel som kan uppstå under jämförelsen av lösenord
      return done(e);
    }
  };

  // Använda lokal autentisering med Passport.js
  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

  // Spara användarens ID i sessionen
  passport.serializeUser((user, done) => done(null, user.id));

  // Återskapa användaren från sessionens ID
  passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    done(null, user);
  });
}

module.exports = initialize;
