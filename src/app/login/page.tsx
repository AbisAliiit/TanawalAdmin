// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   PublicClientApplication,
//   InteractionRequiredAuthError,
//   type IPublicClientApplication,
// } from "@azure/msal-browser";
// import { MsalProvider, useMsal } from "@azure/msal-react";
// import { msalConfig, loginRequest, apiScopes, passwordResetAuthority } from "@/lib/msal-config";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";

// async function getApiAccessToken(instance: IPublicClientApplication) {
//   const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
//   if (!account) throw new Error("No signed-in account");
//   try {
//     const s = await instance.acquireTokenSilent({ scopes: apiScopes, account });
//     return s.accessToken;
//   } catch (e) {
//     if (e instanceof InteractionRequiredAuthError) {
//       const i = await instance.acquireTokenPopup({ scopes: apiScopes, account });
//       return i.accessToken;
//     }
//     throw e;
//   }
// }

// function LoginContent() {
//   const { instance, accounts } = useMsal();
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   const handleLogin = async () => {
//     setErr(null);
//     setLoading(true);
//     try {
//       // 1) Interactive login (includes SAME api scope as mobile)
//       const res = await instance.loginPopup(loginRequest);
//       const account = res.account ?? accounts[0];
//       if (!account) throw new Error("Login succeeded but no account");
//       instance.setActiveAccount(account);

//       // 2) Get API access token for the SAME resource & scope
//       const accessToken = await getApiAccessToken(instance);
//       if (!accessToken) throw new Error("No access token returned");

//       // 3) Store like you do on mobile
//       localStorage.setItem("tanawal_admin_token", accessToken);
//       localStorage.setItem("tanawal_admin_user", JSON.stringify(account));

//       router.replace("/");
//     } catch (e: any) {
//       if (e?.errorCode === "AADB2C90118") {
//         await instance.loginPopup({ ...loginRequest, authority: passwordResetAuthority });
//       } else {
//         console.error(e);
//         setErr(e?.message ?? "Login failed");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen grid place-items-center">
//       <Button onClick={handleLogin} disabled={loading} className="h-11">
//         {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>) : "Sign In with Azure AD B2C"}
//       </Button>
//       {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
//     </div>
//   );
// }

// export default function LoginPage() {
//   const [instance, setInstance] = useState<IPublicClientApplication | null>(null);
//   useEffect(() => {
//     const i = new PublicClientApplication(msalConfig);
//     const accts = i.getAllAccounts();
//     if (accts.length === 1) i.setActiveAccount(accts[0]);
//     setInstance(i);
//   }, []);
//   if (!instance) return (<div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>);
//   return (<MsalProvider instance={instance}><LoginContent /></MsalProvider>);
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import {
  msalConfig,
  loginRequest,
  apiScopes,
  passwordResetAuthority,
} from "@/lib/msal-config";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";

async function getApiAccessToken(instance: IPublicClientApplication) {
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
  if (!account) throw new Error("No signed-in account");
  try {
    const s = await instance.acquireTokenSilent({ scopes: apiScopes, account });
    return s.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      const i = await instance.acquireTokenPopup({ scopes: apiScopes, account });
      return i.accessToken;
    }
    throw e;
  }
}

function LoginContent() {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await instance.loginPopup(loginRequest);
      const account = res.account ?? accounts[0];
      if (!account) throw new Error("Login succeeded but no account");
      instance.setActiveAccount(account);
      const accessToken = await getApiAccessToken(instance);
      if (!accessToken) throw new Error("No access token returned");
      localStorage.setItem("tanawal_admin_token", accessToken);
      localStorage.setItem("tanawal_admin_user", JSON.stringify(account));
      router.replace("/");
    } catch (e: any) {
      if (e?.errorCode === "AADB2C90118") {
        await instance.loginPopup({ ...loginRequest, authority: passwordResetAuthority });
      } else {
        console.error(e);
        setErr(e?.message ?? "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-100 p-8 text-center"
      >
        {/* Optional logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-sky-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Tanawal Admin Portal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in using your Azure AD B2C account
          </p>
        </div>

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white text-base font-medium shadow-md transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In with Azure AD B2C"
          )}
        </Button>

        {err && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-red-600"
          >
            {err}
          </motion.div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} FullStack Hub — All rights reserved
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const [instance, setInstance] = useState<IPublicClientApplication | null>(null);
  useEffect(() => {
    const i = new PublicClientApplication(msalConfig);
    const accts = i.getAllAccounts();
    if (accts.length === 1) i.setActiveAccount(accts[0]);
    setInstance(i);
  }, []);

  if (!instance) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <MsalProvider instance={instance}>
      <LoginContent />
    </MsalProvider>
  );
}

