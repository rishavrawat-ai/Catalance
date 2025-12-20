const TOKEN_KEY = "catalance.accessToken";
const USER_KEY = "catalance.user";

const isBrowser = () => typeof window !== "undefined";

export const persistSession = ({ accessToken, user }) => {
  if (!isBrowser()) {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
  }

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

export const getSession = () => {
  if (!isBrowser()) {
    return null;
  }

  const accessToken = window.localStorage.getItem(TOKEN_KEY);
  const user = window.localStorage.getItem(USER_KEY);

  if (!accessToken || !user) {
    return null;
  }

  try {
    return {
      accessToken,
      user: JSON.parse(user)
    };
  } catch {
    clearSession();
    return null;
  }
};

export const sessionStorageKeys = {
  token: TOKEN_KEY,
  user: USER_KEY
};
