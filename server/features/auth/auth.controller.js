import { loginService, logoutService, profileService, refreshService, registerService, updateProfileService } from "./auth.service.js";

export const registerController = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        await registerService(username, email, password);
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await loginService(email, password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: user,
            accessToken,
        });
    } catch (error) {
        next(error);
    }
};

export const refreshController = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        const { accessToken } = await refreshService(token);
        return res.status(200).json({ success: true, accessToken });
    } catch (error) {
        next(error);
    }
};

export const logoutController = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        await logoutService(token);
        res.clearCookie("refreshToken");
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

export const profileController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await profileService(userId);
        return res.status(200).json({
            success: true,
            message: "user valid",
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfileController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updatedUser = await updateProfileService(userId, req.body);
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};
