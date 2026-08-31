// Keep privileged identity in the server-side role, not in the client bundle.
export const MASTER_ADMIN_EMAIL = "";

export const isMasterAdmin = (user) => !!user && user.role === "master_admin";

export const isStaff = (user) => !!user && (user.role === "admin" || isMasterAdmin(user));

export const displayRole = (user) => {
  if (isMasterAdmin(user)) return "master_admin";
  if (user?.role === "admin") return "admin";
  return "user";
};
