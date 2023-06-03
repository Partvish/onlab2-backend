import "reflect-metadata"
import {AppDataSource} from "./database";
import {create_app} from "./helper/app";
import "./auth/user.controller"

create_app()

AppDataSource.initialize()
  .then(() => {
  })
  .catch((error) => console.log(error))