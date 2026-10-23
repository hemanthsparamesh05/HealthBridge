"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiLogin, apiMfa, apiMe } from "@/lib/api";
import type { UserRole } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  mfaPending: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  completeMfa: (code: string) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  hydrateUser: () => Promise<void>;
}

const roleDisplay: Record<UserRole, string> = {
  insurance_admin: "Insurance Admin",
  claim_reviewer: "Claim Reviewer",
  hospital_staff: "Hospital Staff",
  compliance_officer: "Compliance Officer",
  auditor: "Auditor",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      mfaPending: false,
      pendingEmail: null,
      login: async (email, password, role) => {
        const res = await apiLogin(email, password, role);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hb_pending_role", role);
          sessionStorage.setItem("hb_pending_email", email);
          if (res.access_token) {
            sessionStorage.setItem("hb_mfa_token", res.access_token);
          }
        }
        set({
          mfaPending: true,
          pendingEmail: email,
          user: null,
          token: null,
        });
      },
      completeMfa: async (code: string) => {
        if (!get().mfaPending) return;
        const email =
          get().pendingEmail ??
          (typeof window !== "undefined"
            ? sessionStorage.getItem("hb_pending_email")
            : null) ??
          "admin@healthbridge.in";
        const mfaToken =
          typeof window !== "undefined" ? sessionStorage.getItem("hb_mfa_token") : null;
        if (!mfaToken) throw new Error("Your sign-in session expired. Please log in again.");
        const res = await apiMfa(email, code, mfaToken);
        const me = await apiMe(res.access_token);
        set({
          mfaPending: false,
          pendingEmail: null,
          token: res.access_token,
          user: {
            id: me.id,
            name: me.name || roleDisplay[me.role],
            email: me.email,
            role: me.role,
          },
        });
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("hb_pending_role");
          sessionStorage.removeItem("hb_pending_email");
          sessionStorage.removeItem("hb_mfa_token");
        }
      },
      logout: () => {
        if (typeof window !== "undefined") sessionStorage.removeItem("hb_mfa_token");
        set({ user: null, token: null, mfaPending: false, pendingEmail: null });
      },
      setRole: (role) =>
        set((s) =>
          s.user
            ? {
                user: { ...s.user, role, name: roleDisplay[role] },
              }
            : {},
        ),
      hydrateUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const me = await apiMe(token);
          set({
            user: {
              id: me.id,
              name: me.name || roleDisplay[me.role],
              email: me.email,
              role: me.role,
            },
          });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "hb-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
}
