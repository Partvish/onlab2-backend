import jwt from "jsonwebtoken";

const secretKey = "RandomSecretKey";

const getToken = (id: number, email: string): string => {
  const token = jwt.sign({ userId: id, email: email }, secretKey, {
    expiresIn: "1h",
  });
  return token;
};

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secretKey as string, (err: any, user: any) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }

    req.user = user;

    next();
  });
}

export { getToken, authenticateToken };
