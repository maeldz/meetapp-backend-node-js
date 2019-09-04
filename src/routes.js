import { Router } from "express";

const routes = new Router();

import UserController from "./app/controllers/UserController";
import SessionController from "./app/controllers/SessionController";

import authMiddleware from "./app/middlewares/auth";

routes.post("/signup", UserController.store);

routes.post("/signin", SessionController.store);

routes.use(authMiddleware);

routes.put("/update", UserController.update);

export default routes;
