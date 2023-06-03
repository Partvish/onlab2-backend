import User from "./user";
import { Request, Response } from "express";
import { Express } from "express";
import { authenticateToken } from "./token";
import UserService from "./user.service";
import cors from "cors";

const setUserController = (app: Express) => {
  const service = new UserService();
  app.post("/user", authenticateToken, (req: Request, res: Response) => {
    if (!req.user || !req.user.id) return res.status(401);
    console.log(req.user.id);
    res
      .status(200)
      .json({ id: req.user.id, name: req.user.name, emal: req.user.email });
  });

  app.delete("/user", (req: Request, res: Response) => {
    return res.send("<div>user delete</div>");
  });
  app.get("/users", (req: Request, res: Response) => {
    res.json({ id: 4 });
  });
  app.put("/user", (req: Request, res: Response) => {
    return res.send("<div>user rak</div>");
  });
};

export default setUserController;
