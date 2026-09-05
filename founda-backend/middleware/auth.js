import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "founda_jwt_secret_change_in_production";

export function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
}

export { JWT_SECRET };
