import { User } from "../context/AuthContext";

/**
 * Checks if the user has the required permission.
 * If the user is an OWNER, they are granted all permissions.
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  const role = user.role.toUpperCase();
  if (role === "OWNER") return true;
  return user.permissions.includes(permission);
};

/**
 * Checks if the user is in one of the allowed roles.
 */
export const hasRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  const upperRoles = roles.map(r => r.toUpperCase());
  return upperRoles.includes(user.role.toUpperCase());
};

/**
 * Returns the default entry home path for a user based on their role.
 */
export const getHomePathForRole = (role?: string): string => {
  if (!role) return "/login";
  switch (role.toUpperCase()) {
    case "OWNER":
    case "MANAGER":
      return "/dashboard";
    case "STAFF":
      return "/inventory";
    case "DRIVER":
      return "/driver/trips";
    default:
      return "/login";
  }
};
