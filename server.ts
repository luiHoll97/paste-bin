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

  // hey database (client - has connection string which is unique to DB and a ssl key for access), 
  // we're gunna pass you a query(some SQL)
  const dbres = await client.query('select * from pastebin order by paste_id asc');
  // when you've done that, can you give me back the results of the query and only give me the rows
  // from the database?
  res.json(dbres.rows);
});

/*app.post("/pastes", async (req, res) => {
  const dbres = await client.query('select * from pastebin');
  res.json(dbres.rows);
});
*/

// get a todo by id

app.get("/pastes/:id", async (req, res) => {
  try {
    const { id } = req.params
    const getPasteById = await client.query(
      "select * from pastebin where paste_id = $1", [id]
    )
    res.json(getPasteById.rows)
  } catch (error) {
    console.log(error.message)

  }
})

// edit an existing paste

app.put("/pastes/:id", async (req, res) => {
  try {
    const { id } = req.params // get the id to pass to SQL
    const { snippet } = req.body // get the values for snippet/owner to pass to SQL
    const editPaste = await client.query(
      "update pastebin set snippet = $1 where paste_id = $2 returning *", [snippet, id]
    )
    res.json(editPaste.rows)
    // update todo set description = $1 where todo_id = $2", [description, id]
  } catch (error) {
    console.log(error.message)

  }
})

// delete a paste

app.delete("/pastes/:id", async (req, res) => {
  try {
    const { id } = req.params // get the id to pass to sequal
    const deletePaste = await client.query(
      "delete from pastebin where paste_id = $1 returning *", [id]
    )
    res.send(`paste successfully deleted`)
    // res.json(deletePaste.rows) **NOTE: only sends 1 response - this is unreadable 
  } catch (error) {
    console.log(error.message)

  }
})


// post an id

app.post("/pastes", async (req, res) => {
  try {
    const { snippet, owner, posted } = req.body; // this takes JSON data to use
    const newSnippet = await client.query
      (
        "insert into pastebin (snippet, owner, posted) values ($1, $2, $3) returning *", [snippet, owner, posted]
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
