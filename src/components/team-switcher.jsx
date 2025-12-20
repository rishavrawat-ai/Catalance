"use client";

import PropTypes from "prop-types";
import { Sparkles } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const BRAND_INFO = {
  name: "Catalance",
  plan: "Platform",
  logoText: "FR"
};

export function TeamSwitcher({ brand = BRAND_INFO }) {
  const activeBrand = brand;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="w-full rounded-2xl bg-sidebar-accent/40 text-left data-[state=open]:bg-primary data-[state=open]:text-primary-foreground hover:bg-sidebar-accent/60 transition-colors overflow-hidden group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:w-[3rem] group-data-[collapsible=icon]:px-0"
        >
          <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-inner text-base font-semibold uppercase">
              {activeBrand.logoText}
            </div>
            <div className="flex-1 group-data-[collapsible=icon]:hidden min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{activeBrand.name}</p>
              <p className="text-xs text-muted-foreground">{activeBrand.plan}</p>
            </div>
            <Sparkles className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

TeamSwitcher.propTypes = {
  brand: PropTypes.shape({
    name: PropTypes.string,
    plan: PropTypes.string,
    logoText: PropTypes.string
  })
};
