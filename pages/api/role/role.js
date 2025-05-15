import axiosInstance from "@pages/api/axiosInstance";

const getMenuPermission = async () => {
  try {
    const { data } = await axiosInstance.get(
      "/permissions/resources-permissions"
    );
    return data;
  } catch (err) {
    console.error("Error fetching menu permissions:", err);
    throw err;
  }
};

const getUserStatsByRole = async () => {
  try {
    const { data } = await axiosInstance.get("/users/detailed-stats/by-role");
    return data;
  } catch (err) {
    console.error("Error fetching user stats by role:", err);
    throw err;
  }
};

/* ========== DELETE ========== */
const deletePermission = async (permissionId) => {
  try {
    const { data } = await axiosInstance.delete(`/permissions/${permissionId}`);
    return data;
  } catch (err) {
    console.error("Error deleting permission:", err);
    throw err;
  }
};

/* ========== POST ========== */
const createPermission = async ({
  role_id,
  resource_id,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = true,
}) => {
  try {
    const payload = {
      role_id,
      resource_id,
      can_create,
      can_read,
      can_update,
      can_delete,
    };
    const { data } = await axiosInstance.post("/permissions/create", payload);
    return data;
  } catch (err) {
    console.error("Error creating permission:", err);
    throw err;
  }
};

/* ========== POST ========== */
const createRole = async ({ name, description }) => {
  try {
    const payload = {
      name,
      description,
    };
    const { data } = await axiosInstance.post("/permissions/roles", payload);
    return data;
  } catch (err) {
    console.error("Error creating role:", err);
    throw err;
  }
};

/* ========== DELETE ========== */
const deleteRole = async (roleId) => {
  try {
    const { data } = await axiosInstance.delete(`/permissions/roles/${roleId}`);
    return data;
  } catch (err) {
    console.error("Error deleting role:", err);
    throw err;
  }
};

/* ========== DELETE USER PERMISSION ========== */
const deleteUserPermission = async (permissionId) => {
  try {
    const { data } = await axiosInstance.delete(
      `/permissions/user-permissions/${permissionId}`
    );
    return data;
  } catch (err) {
    console.error("Error deleting user permission:", err);
    throw err;
  }
};

/* ========== CREATE USER PERMISSION ========== */
const createUserPermission = async ({
  user_id,
  resource_id,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = true,
  override_role = true,
}) => {
  try {
    const payload = {
      user_id,
      resource_id,
      can_create,
      can_read,
      can_update,
      can_delete,
      override_role,
    };

    const { data } = await axiosInstance.post(
      "/permissions/user-permissions/create",
      payload
    );
    return data;
  } catch (err) {
    console.error("Error creating user permission:", err);
    throw err;
  }
};

/* ========== GET USERS BY ROLE ========== */
const getUsersByRole = async (role_id) => {
  try {
    const { data } = await axiosInstance.get(`/users/detailed-stats/by-role`, {
      params: {
        role_id,
      },
    });
    return data;
  } catch (err) {
    console.error("Error fetching users by role:", err);
    throw err;
  }
};

/* ========== GET ALL USERS BY GROUP ========== */

const getUsersByGroup = async () => {
  try {
    const { data } = await axiosInstance.get(
      "/permissions/user-resources/bygroup"
    );
    return data;
  } catch (err) {
    console.error("Error fetching user-resources bygroup:", err);
    throw err;
  }
};

export {
  getMenuPermission,
  getUserStatsByRole,
  deletePermission,
  createPermission,
  createRole,
  deleteRole,
  createUserPermission,
  deleteUserPermission,
  getUsersByRole,
  getUsersByGroup,
};
