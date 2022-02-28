const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    res.locals.routeId = orderId;
    return next();
  }
  next({ status: 404, message: `Order ID not found: ${orderId}` });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function hasDeliverTo(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo && deliverTo.length > 0 && typeof deliverTo === "string") {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({ status: 400, message: `Order must include a deliverTo` });
}

function hasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber && mobileNumber.length > 0) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({ status: 400, message: "Order must include a mobileNumber" });
}

function hasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (!dishes) {
    return next({ status: 400, message: "Order must include a dish" });
  } else if (Array.isArray(dishes) && dishes.length > 0) {
    res.locals.dishes = dishes;
    return next();
  }
  next({ status: 400, message: "Order must include at least one dish" });
}

function dishHasQuantity(req, res, next) {
  const dishes = res.locals.dishes;

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const quantity = dish.quantity;
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
}

function create(req, res, next) {
  const { data: { status = "pending" } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: res.locals.deliverTo,
    mobileNumber: res.locals.mobileNumber,
    status,
    dishes: res.locals.dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function bodyIdMatchesRouteId(req, res, next) {
  const orderId = res.locals.routeId;
  const { data: { id } = {} } = req.body;
  if (orderId === id) {
    return next();
  } else if (!id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function hasStatusProperty(req, res, next) {
  const { data: { status } = {} } = req.body;
  const orderStatus = res.locals.order.status;
  if (orderStatus === "delivered") {
    return next({ staus: 400, message: "A delivered order cannot be changed" });
  } else if (
    status &&
    ["pending", "preparing", "out-for-delivery", "delivered"].includes(status)
  ) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function update(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const order = res.locals.order;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}

function orderPending(req, res, next) {
  if (res.locals.order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function destroy(req, res, next) {
  const index = orders.findIndex((order) => order.id === res.locals.order.id);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [hasDeliverTo, hasMobileNumber, hasDishes, dishHasQuantity, create],
  update: [
    orderExists,
    bodyIdMatchesRouteId,
    hasStatusProperty,
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    dishHasQuantity,
    update,
  ],
  delete: [orderExists, orderPending, destroy],
};
