import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2/promise';

// Initiera vår express-app
const app = express();
// Definera den port vi vill använda för vår server
const port = 3000;

// Middleware (vi går in på vad just middleware är senare i kursen - just här för cors och hantera parsa data som skickas med body)
app.use(cors());
app.use(bodyParser.json());

// Databasinställningar
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // windows kör ist "" (tomt lösenord)
  database: 'banksajtSolutionCodealong',
  port: 8889, // Obs! 3306 för windowsanvändare
});

// Funktion för att göra förfrågan till databas
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Generera engångslösenord
function generateOTP() {
  // Generera en sexsiffrig numerisk OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
  // Generera en sexsiffrig numerisk OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

//todo Din kod här. Skriv dina routes: ---------------------------------------

// Route för att skapa en användare
app.post('/users', async (req, res) => {
  // Hämta användarnamn och lösenord från förfrågans body
  const { username, password } = req.body;

  // Skapa användare i user-tabellen. Begränsning - just nu kan man inte spara unik användare. Inga dubletter
  // Så innan man sparar användaren kolla att usermname itne redan existerar.

  try {
    const userResult = await query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password]
    );

    const userId = userResult.insertId;

    const accountResult = await query(
      "INSERT INTO accounts (user_id, amount) VALUES (?, ?)",
      [userId, 0]
    );

    const accountId = accountResult.insertId;

    res
      .status(201)
      .json({
        message: "User and account created",
        userId: userId,
        accountId: accountId,
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error creating user");
  }
});

// Route för att logga in
app.post("/sessions", async (req, res) => {
  // Hämta användarnamn och lösenord från förfrågans body
  const { username, password } = req.body;

  try {
    const userResult = await query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    const user = userResult[0] // Obs! userResult returnerar en array, position 0 är första raden.

    if(!user) {
        return res.status(401).send("User not found");

    }

    if (user.password === password) {

      const token = generateOTP();

      // Lägg till user_id och token i session-tabellen
      const sessionResult = await query(
        "INSERT INTO sessions (user_id, token) VALUES (?, ?)",
        [user.id, token]
      );
      
      const sessionId = sessionResult.insertId;

      res.status(200).json({ message: "Login successful", token: token, sessionId: sessionId });

    } else {
      return res.status(401).send("Invalid password");
    }

  } catch (error) {
    console.error("Error:", error);
    return res.status(401).send("Error during login");
  }

  // Hitta användaren i users-arrayen som matchar användarnamn och lösenord
  // const user = users.find((user) => user.username === username && user.password === password);

  // // Om användaren hittas
  // if (user) {
  //     // Generera en engångskod (OTP)
  //     const otp = generateOTP();

  //     // Skapa en ny session för användaren
  //     const newSession = {
  //         id: sessions.length + 1,
  //         userId: user.id,
  //         token: otp,
  //     };

  //     // Lägg till den nya sessionen i sessions-arrayen
  //     sessions.push(newSession);

  //     // Logga data
  //     logCurrentData();

  //     // Skicka en HTTP-status 201 (Created) och den nya sessionen som svar
  //     res.status(201).json({newSession});
  // } else {
  //     // Logga data
  //     logCurrentData();

  //     // Skicka en HTTP-status 401 (Unauthorized) och ett felmeddelande som svar
  //     res.status(401).json({ message: 'Invalid username or password' });
  // }
});

// Route för att hämta användarens konton och visa saldo
app.post("/me/account", (req, res) => {
  // Extrahera token från Authorization-headern. Exempel på header: "Bearer 12313"
  const token = req.headers.authorization.split(" ")[1];
  console.log("Received token:", token);

  // Hitta sessionen i sessions-arrayen som matchar token
  const session = sessions.find((session) => session.token === token);
  console.log("Found session:", session);

  // Om sessionen hittas, extrahera userId från sessionen
  if (session) {
    const userId = session.userId;

    // Hitta kontot i accounts-arrayen som matchar userId
    const account = accounts.find((acc) => acc.userId === userId);
    if (account) {
      // Om kontot hittas, skicka tillbaka saldo som JSON-svar
      res.json({ balance: account.balance });
    } else {
      // Om kontot inte hittas, skicka tillbaka status 404 och ett felmeddelande
      res.status(404).json({ error: "Account not found" });
    }
  } else {
    // Om sessionen inte hittas, skicka tillbaka status 401 och ett felmeddelande
    res.status(401).json({ error: "Invalid session token" });
  }
});

app.post("/me/account/transaction", (req, res) => {
  // Extrahera token från Authorization-headern
  const token = req.headers.authorization.split(" ")[1]; // Extract token from Authorization header
  console.log("Received token:", token);

  // Hitta sessionen i sessions-arrayen som matchar token
  const session = sessions.find((session) => session.token === token);

  // Om sessionen hittas
  if (session) {
    // Hitta kontot i accounts-arrayen som matchar userId från sessionen
    const account = accounts.find(
      (account) => account.userId === session.userId
    );
    // Om kontot hittas
    if (account) {
      // Extrahera beloppet från förfrågans body
      const { amount } = req.body;

      // Uppdatera kontots saldo med beloppet
      account.balance += amount;

      // Skicka tillbaka det uppdaterade kontot som JSON-svar
      res.json(account);

      // Skicka tillbaka en 201-status och ett meddelande med det nya saldot
      res.status(201).json({ message: account.balance });
    } else {
      // Om kontot inte hittas, skicka tillbaka en 404-status och ett felmeddelande
      res.status(404).json({ message: "Account not found" });
    }
  } else {
    // Om sessionen inte hittas, skicka tillbaka en 401-status och ett felmeddelande
    res.status(401).json({ message: "Invalid Token" });
  }
});

// Startar servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});
