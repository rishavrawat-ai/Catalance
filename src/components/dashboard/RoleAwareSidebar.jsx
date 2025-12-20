import PropTypes from "prop-types";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const RoleAwareSidebar = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen flex-1 bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

RoleAwareSidebar.propTypes = {
  children: PropTypes.node.isRequired
};

export { RoleAwareSidebar };
