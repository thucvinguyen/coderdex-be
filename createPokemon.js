const fs = require("fs");
const csv = require("csvtojson");
const path = require("path");
const { faker } = require("@faker-js/faker");

const createPokemon = async () => {
  let pokemonData = await csv().fromFile("pokemon.csv");
  console.log(pokemonData);
  // let pokemonImageData = fs.readdirSync("./public/images");
  // const pokemonName = pokemonImageData.map((item) => path.parse(item).name);
  // pokemonImageData.forEach((file, index) => {
  //   fs.renameSync(
  //     `./public/images/${file}`,
  //     `./public/images/${pokemonName[index]}.png`
  //   );
  // });
  // Read existing image files
  let pokemonImageData = fs.readdirSync("./public/images");
  const pokemonNamesWithImage = pokemonImageData.map(
    (item) => path.parse(item).name
  );

  // Filter Pokémon data based on existence of image files
  pokemonData = pokemonData.filter((item) =>
    pokemonNamesWithImage.includes(item.Name)
  );

  // Manipulate Pokemon data
  pokemonData.forEach((item, index) => {
    item.id = index + 1;
    item.name = item.Name;
    item.weight = faker.number.int({ min: 10, max: 1000 });
    item.height = faker.number.int({ min: 10, max: 1000 });
    item.category = faker.animal.type();
    item.abilities = faker.person.zodiacSign();
    item.description = faker.lorem.sentence();
    if (item.Type2) {
      item.types = [item.Type1.toLowerCase(), item.Type2.toLowerCase()];
    } else {
      item.types = [item.Type1.toLowerCase()];
    }
    item.url = `/images/${item.Name}.png`;
    delete item["Name"];
    delete item["Type1"];
    delete item["Type2"];
    delete item["Evolution"];
  });

  let data = JSON.parse(fs.readFileSync("pokemon.json"));
  // data.pokemon = pokemonData;
  // data.totalPokemon = pokemonData.length;
  const totalPokemon = pokemonData.length;
  fs.writeFileSync(
    "pokemon.json",
    JSON.stringify({ pokemon: pokemonData, totalPokemon })
  );
  console.log("done");
};
createPokemon();
