import { createUser, deleteRefreshTokenRepository, findRefreshTokenRepository, findUserById, saveRefreshTokenRepository, userExists, usernameExists, updateUserRepository } from "./auth.repository.js";
import ApiError from "../../utils/ApiError.js";
import { comparePassword, hashPassword } from "../../utils/bcrypt.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { randomUUID } from "crypto";

const DUMMY_HASH = process.env.DUMMY_HASH

export const registerService = async(username, email, password) => {
    const user = await userExists(email);
    if(user.length > 0)
        throw new ApiError(400, "User already exists");

    const takenUsername = await usernameExists(username);
    if(takenUsername.length > 0)
        throw new ApiError(400, "Username is already taken");

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

export const updateProfileService = async (userId, { username, email, currentPassword, newPassword }) => {
    const user = await findUserById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const updateFields = {};

    if (username && username !== user.username) {
        const taken = await usernameExists(username);
        if (taken.length > 0) {
            throw new ApiError(400, "Username is already taken");
        }
        updateFields.username = username;
    }

    if (email && email !== user.email) {
        const taken = await userExists(email);
        if (taken.length > 0) {
            throw new ApiError(400, "Email is already registered");
        }
        updateFields.email = email;
    }

    if (newPassword) {
        if (!currentPassword) {
            throw new ApiError(400, "Current password is required to set a new password");
        }
        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            throw new ApiError(400, "Incorrect current password");
        }
        updateFields.password = await hashPassword(newPassword);
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "No fields updated");
    }

    await updateUserRepository(userId, updateFields);

    const updatedUser = await findUserById(userId);
    delete updatedUser.password;
    return updatedUser;
};
