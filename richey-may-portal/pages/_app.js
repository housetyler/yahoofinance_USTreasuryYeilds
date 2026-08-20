/**
 * pages/_app.js
 *
 * Wraps every page with the NextAuth SessionProvider so any page can call
 * useSession() to check who's logged in.
 */

import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
