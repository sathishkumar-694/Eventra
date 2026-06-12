import { createUser, deleteRefreshTokenRepository, findRefreshTokenRepository, findUserById, saveRefreshTokenRepository, userExists } from "./auth.repository.js";
import ApiError from "../../utils/ApiError.js";
import { comparePassword, hashPassword } from "../../utils/bcrypt.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { randomUUID } from "crypto";

const DUMMY_HASH = process.env.DUMMY_HASH

export const registerService = async(username, email, password) => {
    const user = await userExists(email);
    if(user.length > 0)
        throw new ApiError(400, "User already exists");

    const hashedPass = await hashPassword(password);
    const userId = randomUUID();
    const result = await createUser(userId, username, email, hashedPass);

    if(result.affectedRows === 0)
        throw new ApiError(500, "Server error");

    return result;
}

export const loginService = async(email, password) => {
    const [user] = await userExists(email);

    const userPass = user ? user.password : DUMMY_HASH;
    const isMatch = await comparePassword(password, userPass);

    if(!user || !isMatch)
        throw new ApiError(400, "Invalid credentials");

    delete user.password;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshTokenRepository(tokenId, user.id, refreshToken, expiresAt);

    return { user, accessToken, refreshToken };
}

export const refreshService = async (token) => {
    if(!token) 
        throw new ApiError(401, "Refresh token missing");

    const stored = await findRefreshTokenRepository(token);
    if(!stored) 
        throw new ApiError(401, "Invalid refresh token");

    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken({ id: payload.id, role: payload.role });

    return { accessToken };
}

export const logoutService = async (token) => {
    if(!token) throw new ApiError(400, "Refresh token missing");
    await deleteRefreshTokenRepository(token);
}

export const profileService = async(id) => {
    const user = await findUserById(id);
    return user;
}
