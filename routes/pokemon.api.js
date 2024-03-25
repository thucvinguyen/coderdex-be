const express = require("express");
const router = express.Router();
const fs = require("fs");

const allowedFilter = ["search", "type", "page", "limit"];

// API for getting all Pokémons
router.get("/", (req, res, next) => {
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    // Number of items skip for selection
    let offset = limit * (page - 1);

    // Read data from pokemon.json then parse to JS object
    let db = fs.readFileSync("pokemon.json", "utf-8");
    db = JSON.parse(db);
    const { pokemon } = db;
    let result = [];
    result = pokemon;

    if (filterQuery.search) {
      result = result.filter((item) => item.name.includes(filterQuery.search));
    }

    if (filterQuery.type) {
      result = result.filter((item) => item.types.includes(filterQuery.type));
    }

    console.log("Result before pagination:", result); // Log 'result' before pagination

    if (result.length > 0) {
      result = result.slice(offset, offset + limit);
    }

    console.log("Final result:", result); // Log the final 'result' before sending the response

    res.status(200).send(JSON.stringify({ data: result }));
  } catch (error) {
    next(error);
  }
});

// API for getting a single Pokémon information together with the previous and next pokemon information.
router.get("/:id", (req, res, next) => {
  try {
    const { id } = req.params;

    fs.readFile("pokemon.json", "utf-8", (err, data) => {
      if (err) {
        throw err; // Forward error to error handler
      }

      try {
        const db = JSON.parse(data);
        const { pokemon } = db;

        const index = pokemon.findIndex((item) => item.id === parseInt(id));

        if (index === -1) {
          res.status(404).json({ message: "Pokemon not found" });
        } else {
          const currentPokemon = pokemon[index];

          // Calculate previous and next indices
          const prevIndex = (index - 1 + pokemon.length) % pokemon.length;
          const nextIndex = (index + 1) % pokemon.length;

          const prevPokemon = pokemon[prevIndex];
          const nextPokemon = pokemon[nextIndex];

          res.status(200).send(
            JSON.stringify({
              data: {
                current: currentPokemon,
                previous: prevPokemon,
                next: nextPokemon,
              },
            })
          );
        }
      } catch (error) {
        next(error); // Forward parsing error to error handler
      }
    });
  } catch (error) {
    next(error); // Forward synchronous errors to error handler
  }
});
// API for creating new Pokémon

module.exports = router;
