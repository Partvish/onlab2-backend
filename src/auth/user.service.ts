import { Repository } from "typeorm";
import User from "./user";
import { AppDataSource } from "../database";

class UserService {
  repository = AppDataSource.getRepository(User);

  checkIfUserExists(id: number): boolean {
    var user = this.repository.findOneBy({ id: id });
    return user != null;
  }

}

export default UserService;
