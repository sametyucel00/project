import { useEffect, useRef, useState } from "react";
import { type MobileSession, watchAuthSession } from "../services";

export interface SessionState {
  session: MobileSession | null;
  loading: boolean;
  error: string | null;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
    error: null
  });
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = watchAuthSession(
      (session) => {
        const signature = buildSessionSignature(session);
        if (signature === lastSignature.current) return;
        lastSignature.current = signature;
        setState({ session, loading: false, error: null });
      },
      (error) => {
        const signature = `error:${error.message}`;
        if (signature === lastSignature.current) return;
        lastSignature.current = signature;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message
        }));
      }
    );

    return unsubscribe;
  }, []);

  return state;
}

function buildSessionSignature(session: MobileSession | null) {
  if (!session) return "null";
  const prefs = session.notificationPreferences;
  return [
    session.uid,
    session.email,
    session.displayName,
    session.isAnonymous ? "1" : "0",
    session.role,
    session.city,
    session.preferredLocale,
    session.themeMode,
    session.points,
    session.nextTab,
    prefs?.offers ? "1" : "0",
    prefs?.events ? "1" : "0",
    prefs?.theater ? "1" : "0",
    prefs?.reminders ? "1" : "0",
    prefs?.quietHoursStart ?? "",
    prefs?.quietHoursEnd ?? ""
  ].join("|");
}
