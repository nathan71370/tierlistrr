import { getAuthState } from "@/lib/viewer";
import { AuthProvider } from "./AuthContext";

/**
 * Wraps a page that needs to know who is looking (header, "new list" button,
 * board). Placed in the pages rather than the root layout on purpose: the
 * layout also renders the static 404, which is prerendered at build time —
 * where AUTH_PUBLIC_URL doesn't exist and cookies can't be read.
 */
export async function AuthBoundary({ children }: { children: React.ReactNode }) {
  const auth = await getAuthState();
  return (
    <AuthProvider status={auth.status} name={auth.name} logoutAction={auth.logoutAction}>
      {children}
    </AuthProvider>
  );
}
