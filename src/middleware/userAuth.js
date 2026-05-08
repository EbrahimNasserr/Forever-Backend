import jwt from "jsonwebtoken";

const getTokenFromHeader = (authorizationHeader) => {
    if (!authorizationHeader) {
        return null;
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

const userAuth = (req, res, next) => {
    try {
        const token = getTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({ message: "Authorization token is required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(500).json({ message: error.message });
    }
};

export default userAuth;

