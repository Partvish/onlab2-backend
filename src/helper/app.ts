import express, { Express, Request, Response } from "express";
import setUserController from "../auth/user.controller";
import cors from "cors";
import setAuthController from "../auth/auth.controller";
import MatchmakerService from "../matchmaking/matchmaker.service";
import bodyParser from "body-parser";

var app: Express;

function create_app() {
  const port = "5000";

  app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors({ origin: "*", allowedHeaders: "*" }));

  app.get("/", (req: Request, res: Response) => {
    res.send("<h1>Önlabor 2</h1><div>Express + TypeScript Server</div>");
  });

  setUserController(app);
  setAuthController(app);

  const server = app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
  });

  const matchmaking = new MatchmakerService(server);
}

export { create_app, app };
