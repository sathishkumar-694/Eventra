const TOKEN_KEY = 'eventra_token';
const USER_KEY = 'eventra_user';

const setCookie = (name, value, days = null) => {
    let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
    if(days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        cookie += `; expires=${expires}`;
    }
    document.cookie = cookie;
}

const getCookie = (name) => {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

const deleteCookie = (name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const setAuth = (token, user, remember = false) => {
    setCookie(TOKEN_KEY, token, remember ? 30 : null);
    setCookie(USER_KEY, JSON.stringify(user), remember ? 30 : null);
}

export const getToken = () => {
    return getCookie(TOKEN_KEY);
}

export const getUser = () => {
    try {
        const raw = getCookie(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export const isLoggedIn = () => {
    return !!getToken();
}

export const logout = () => {
    deleteCookie(TOKEN_KEY);
    deleteCookie(USER_KEY);
}
