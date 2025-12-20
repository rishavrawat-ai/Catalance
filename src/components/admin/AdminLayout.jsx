import React from "react";
import { RoleAwareSidebar } from "../dashboard/RoleAwareSidebar";

const AdminLayout = ({ children }) => {
  return (
    <RoleAwareSidebar>
      {children}
    </RoleAwareSidebar>
  );
};

export default AdminLayout;
