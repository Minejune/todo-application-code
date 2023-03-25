const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.get("/todos/", async (req, res) => {
  const {
    status = "Empty",
    priority = "Empty",
    search_q = "Empty",
  } = req.query;
  let detailsQuery = null;

  if (status !== "Empty" && priority !== "Empty") {
    detailsQuery = `
  SELECT
    *
  FROM
    todo
  WHERE status = '${status}'
  AND priority = '${priority}';
  `;
  } else if (status !== "Empty") {
    detailsQuery = `
  SELECT
    *
  FROM
    todo
  WHERE status = '${status}';
  `;
  } else if (priority !== "Empty") {
    detailsQuery = `
  SELECT
    *
  FROM
    todo
  WHERE priority = '${priority}';
  `;
  } else if (search_q !== "Empty") {
    detailsQuery = `
  SELECT
    *
  FROM
    todo
  WHERE todo LIKE '%${search_q}%';
  `;
  }

  const detailsResponse = await db.all(detailsQuery);
  res.send(detailsResponse);
});

//API 2
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;

  const getTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE id = ${todoId};
  `;

  const todoResponse = await db.get(getTodoQuery);
  res.send(todoResponse);
});

//API 3
app.post("/todos/", async (req, res) => {
  const newTodo = req.body;
  const { id, todo, priority, status } = newTodo;
  const createTodo = `
  INSERT INTO todo(id,todo,priority,status)
  VALUES(${id},'${todo}','${priority}','${status}');
  `;

  await db.run(createTodo);
  res.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const requestBody = req.body;

  let requestDetails = "";
  let requestValue = "";
  let responseText = "";

  switch (true) {
    case requestBody.status !== undefined:
      requestDetails = "status";
      requestValue = "DONE";
      responseText = "Status";
      break;
    case requestBody.priority !== undefined:
      requestDetails = "priority";
      requestValue = "HIGH";
      responseText = "Priority";
      break;
    case requestBody.todo !== undefined:
      requestDetails = "todo";
      requestValue = "Some task";
      responseText = "Todo";
      break;
  }

  const todoUpdateQuery = `
  UPDATE todo
  SET ${requestDetails} = '${requestValue}'
  WHERE id = ${todoId};
  `;

  await db.run(todoUpdateQuery);
  res.send(`${responseText} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;

  const deleteTodo = `
    DELETE FROM todo
    WHERE id = ${todoId};
    `;

  const delTodoResponse = await db.run(deleteTodo);
  res.send("Todo Deleted");
});

module.exports = app;
