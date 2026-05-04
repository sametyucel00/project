import { roleHome, type UserRole } from "@nar/core";

export function resolveRoleHome(role?: UserRole | null) {
  if (!role) return "/giris";
  return roleHome[role] ?? "/giris";
}

export const protectedPanelRoutes = Object.values(roleHome);
