"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";

const navItems = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Pricing", link: "/pricing" },
  { name: "Contact", link: "/contact" },
];

const ThemeButton = ({ isDark, onClick, visible, isHome }) => {
  const forceWhite = isHome && !visible;
  
  return (
    <div
      onClick={onClick}
      className={`flex items-end mr-5 cursor-pointer relative z-50 transition-transform duration-1000 ${
        isDark ? "rotate-180" : "rotate-0"
      }`}>
      {isDark ? (
        <Sun className="h-6 w-6 text-yellow-500" />
      ) : (
        <Moon className={cn("h-6 w-6", forceWhite ? "text-black" : "text-gray-500")} />
      )}
    </div>
  );
};

const AuthButtons = ({ visible, isHome }) => {
  const forceWhite = isHome && !visible;
  return (
    <div className="flex items-center gap-2">
      <NavbarButton
        as={Link}
        to="/login"
        variant="outline"
        className={cn(forceWhite ? "text-white border-white/20 hover:bg-white/10" : "")}>
        Log In
      </NavbarButton>
      <NavbarButton as={Link} to="/signup">
        Sign Up
      </NavbarButton>
    </div>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileOpen(false);

  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const handleThemeToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ResizableNavbar>
      {/* Desktop Navbar */}
      <NavBody>
        <NavbarLogo isHome={isHome} />
        <NavItems items={navItems} onItemClick={closeMobileMenu} isHome={isHome} />
        <ThemeButton isDark={isDark} onClick={handleThemeToggle} isHome={isHome} />
        <AuthButtons isHome={isHome} />
      </NavBody>

      {/* Mobile Navbar */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />

          <div
            onClick={handleThemeToggle}
            className={`flex items-end mr-5 cursor-pointer relative z-50 transition-transform duration-1000 ${
              isDark ? "rotate-180" : "rotate-0"
            }`}>
            {isDark ? (
              <Sun className="h-6 w-6 text-yellow-500" />
            ) : (
              <Moon className="h-6 w-6 text-gray-500" />
            )}
          </div>

          <MobileNavToggle isOpen={mobileOpen} onClick={toggleMobileMenu} />
        </MobileNavHeader>

        <MobileNavMenu isOpen={mobileOpen}>
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              to={item.link}
              onClick={closeMobileMenu}
              className="w-full px-4 py-2 text-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded">
              {item.name}
            </Link>
          ))}
          <NavbarButton
            as={Link}
            to="/login"
            variant="outline"
            className="w-full mt-4"
          >
            Log In
          </NavbarButton>
          <NavbarButton as={Link} to="/signup" className="w-full">
            Sign Up
          </NavbarButton>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
};

export default Navbar;
