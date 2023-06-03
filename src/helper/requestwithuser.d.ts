import User from "../dtos/user.dto"
declare global {
    namespace Express {
      export interface Request {
        user?: User;
      }
    }
  }

export{}