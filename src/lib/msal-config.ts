// msal-config.ts
import { Configuration, PopupRequest } from "@azure/msal-browser";

const isProd = typeof window !== "undefined" &&
  window.location.origin.includes("azurestaticapps.net");

const redirectUri = "https://white-wave-0c4e4e61e.3.azurestaticapps.net/";
  
export const msalConfig: Configuration = {
  auth: {
    clientId: "190c5bd6-ab69-4f8b-9165-4fca9c21c743",
    authority:
      "https://tanawal.b2clogin.com/tanawal.onmicrosoft.com/B2C_1_admin_testing",
    knownAuthorities: ["tanawal.b2clogin.com"],
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const apiScopes = [
  "https://tanawal.onmicrosoft.com/71058b46-b73f-44c5-9327-a1216d9b712f/api.access",
];

export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "offline_access", ...apiScopes],
};

export const passwordResetAuthority =
  "https://tanawal.b2clogin.com/tanawal.onmicrosoft.com/B2C_1_password_reset";
