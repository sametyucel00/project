import { useEffect, useState } from "react";
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

  useEffect(() => {
    const unsubscribe = watchAuthSession(
      (session) => {
        setState({ session, loading: false, error: null });
      },
      (error) => {
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
