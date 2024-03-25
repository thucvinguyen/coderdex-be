const express = require("express");
const router = express.Router();
const fs = require("fs");

const allowedFilter = ["search", "type", "page", "limit"];

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

    // Read data from db.json then parse to JS object
    let db = fs.readFileSync("pokemon.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    let result = [];
    result = data;

    if (filterQuery.search) {
      result = result.filter((item) => item.name.includes(filterQuery.search));
    }

    if (filterQuery.type) {
      result = result.filter((item) => item.types.includes(filterQuery.type));
    }

    result = result.slice(offset, offset + limit);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});
