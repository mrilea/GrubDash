const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: dishes });
}

function hasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name && name.length > 0) {
    res.locals.name = name;
    return next();
  }
  next({ status: 400, message: "Dish must include a name" });
}

function hasDescriptionProperty(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (
    description &&
    description.length > 0 &&
    typeof description === "string"
  ) {
    res.locals.description = description;
    return next();
  }
  next({ status: 400, message: "Dish must include a description" });
}

function hasPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (!price) {
    return next({ status: 400, message: "Dish must include a price" });
  } else if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  res.locals.price = price;
  next();
}

function hasImageUrl(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url && image_url.length > 0 && typeof image_url === "string") {
    res.locals.image_url = image_url;
    return next();
  }
  next({ status: 400, message: "Dish must include a image_url" });
}

function create(req, res, next) {
  const newDish = {
    id: nextId(),
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    res.locals.routeId = dishId;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}.` });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function bodyIdMatchesRouteId(req, res, next) {
  const dishId = res.locals.routeId;
  const { data: { id } = {} } = req.body;
  if (dishId === id) {
    return next();
  } else if (!id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function update(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const dish = res.locals.dish;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    hasNameProperty,
    hasDescriptionProperty,
    hasPriceProperty,
    hasImageUrl,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyIdMatchesRouteId,
    hasNameProperty,
    hasDescriptionProperty,
    hasPriceProperty,
    hasImageUrl,
    update,
  ],
};
