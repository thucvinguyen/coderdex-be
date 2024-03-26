const express = require("express");
const router = express.Router();
const fs = require("fs");
const { faker } = require("@faker-js/faker");

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

          const prevIndex = (index - 1 + pokemon.length) % pokemon.length;
          const nextIndex = (index + 1) % pokemon.length;

          const prevPokemon = pokemon[prevIndex];
          const nextPokemon = pokemon[nextIndex];

          res.status(200).send(
            JSON.stringify({
              data: {
                pokemon: currentPokemon,
                previousPokemon: prevPokemon,
                nextPokemon: nextPokemon,
              },
            })
          );
        }
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
});
// API for creating new Pokémon

router.post("/", (req, res, next) => {
  const pokemonTypes = [
    "bug",
    "dragon",
    "fairy",
    "fire",
    "ghost",
    "ground",
    "normal",
    "psychic",
    "steel",
    "dark",
    "electric",
    "fighting",
    "flying",
    "grass",
    "ice",
    "poison",
    "rock",
    "water",
  ];

  try {
    let db = fs.readFileSync("pokemon.json", "utf-8");
    db = JSON.parse(db);

    const { name, types } = req.body;
    // const id = db.totalPokemons + 1; // Generate new ID based on totalPokemons count

    if (!name || !types || types.length === 0) {
      const exception = new Error(`Missing body info`);
      exception.statusCode = 400;
      throw exception;
    }

    if (types.length > 2) {
      const exception = new Error("Pokémon can only have one or two types");
      exception.statusCode = 400;
      throw exception;
    }

    types.forEach((type) => {
      if (!pokemonTypes.includes(type)) {
        const exception = new Error(`Type ${type} is not allowed`);
        exception.statusCode = 400;
        throw exception;
      }
    });

    // Check if the Pokémon already exists with the same name
    db.pokemon.forEach((existingPokemon) => {
      if (existingPokemon.name === name) {
        const exception = new Error("The Pokémon already exists");
        exception.statusCode = 400;
        throw exception;
      }
    });

    // Generate new ID and update totalPokemons count
    const id = db.totalPokemon + 1;
    db.totalPokemon++;

    // Create new Pokémon object
    const newPokemon = {
      id,
      name,
      types,
      url: faker.image.urlLoremFlickr(),
      weight: faker.number.int({ min: 10, max: 1000 }),
      height: faker.number.int({ min: 10, max: 1000 }),
      category: faker.animal.type(),
      abilities: faker.lorem.words(),
      description: faker.lorem.sentence(),
    };

    // Add new Pokémon to the database
    db.pokemon.push(newPokemon);

    // Write updated database back to file
    fs.writeFileSync("pokemon.json", JSON.stringify(db));

    // Send response
    res.status(201).json(newPokemon);
  } catch (error) {
    next(error);
  }
});

// API for updating a Pokémon
router.put("/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      types,
      url,
      weight,
      height,
      category,
      abilities,
      description,
    } = req.body;

    let data = fs.readFileSync("pokemon.json", "utf-8");
    let db = JSON.parse(data);

    const indexToUpdate = db.pokemon.findIndex(
      (pokemon) => pokemon.id === parseInt(id)
    );

    if (indexToUpdate === -1) {
      const error = new Error(`Pokemon not found`);
      error.statusCode = 404;
      throw error;
    }

    db.pokemon[indexToUpdate] = {
      id,
      name,
      types,
      url,
      weight,
      height,
      category,
      abilities,
      description,
    };

    fs.writeFileSync("pokemon.json", JSON.stringify(db));

    res.status(200).json({
      message: "Pokemon updated successfully",
      updatedPokemon: db.pokemon[indexToUpdate],
    });
  } catch (error) {
    next(error);
  }
});

// API for deleting a Pokémon by Id
router.delete("/:id", (req, res, next) => {
  try {
    const { id } = req.params;

    let data = fs.readFileSync("pokemon.json", "utf-8");
    let db = JSON.parse(data);

    const indexToDelete = db.pokemon.findIndex(
      (pokemon) => pokemon.id === parseInt(id)
    );

    if (indexToDelete === -1) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    db.pokemon.splice(indexToDelete, 1);

    db.totalPokemon--;

    fs.writeFileSync("pokemon.json", JSON.stringify(db));

    res.status(200).json({ message: "Pokemon deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
