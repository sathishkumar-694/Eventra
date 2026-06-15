import ApiError from "../utils/ApiError.js";

export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success)
            return next(new ApiError(400, "Validation failed", result.error.format()));
        req.body = result.data;
        next();
    }
}

export const validateQuery = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success)
            return next(new ApiError(400, "Validation failed", result.error.format()));
        Object.defineProperty(req, 'query', {
            value: result.data,
            writable: true,
            configurable: true,
        });
        next();
    }
}