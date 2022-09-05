import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/pastes", async (req, res) => {
  const dbres = await client.query('select * from pastebin');
  res.json(dbres.rows);
});

/*app.post("/pastes", async (req, res) => {
  const dbres = await client.query('select * from pastebin');
  res.json(dbres.rows);
});
*/
app.post("/pastes", async (req, res) => {
  try {
    const { snippet, owner } = req.body; // this takes JSON data to use
    const newSnippet = await client.query
      (
        "insert into pastebin (snippet, owner) values ($1, $2) returning *", [snippet, owner]
      )
    // returning * always do this when updating or deleting to return back the data
    res.json(newSnippet.rows); // * newTodo.rows[0] will return item added
    console.log("We added a new task")
  }
  catch (err) {
    console.log(err)
    res.status(500).send("sorry bud, error on server")
    console.log("didnt work mate");
  }
})



//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
