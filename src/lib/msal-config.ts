// msal-config.ts
import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "190c5bd6-ab69-4f8b-9165-4fca9c21c743",
    authority: "https://tanawal.b2clogin.com/tanawal.onmicrosoft.com/B2C_1_admin_signin",
    knownAuthorities: ["tanawal.b2clogin.com"],
    redirectUri: "http://localhost:3000",
    postLogoutRedirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// 🔴 EXACT SAME RESOURCE & SCOPE AS MOBILE
export const apiScopes = [
  "https://tanawal.onmicrosoft.com/71058b46-b73f-44c5-9327-a1216d9b712f/api.access",
];

export const loginRequest: PopupRequest = {
  // include API scope just like mobile did during the token exchange
  scopes: ["openid", "profile", "offline_access", ...apiScopes],
};

export const passwordResetAuthority =
  "https://tanawal.b2clogin.com/tanawal.onmicrosoft.com/B2C_1_password_reset";
