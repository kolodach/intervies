"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Slash } from "lucide-react";
import {
  HeaderLogo,
  HeaderTitle,
  UserMenu,
  AuthButtons,
  NewInterviewButton,
} from "./header-widgets";

// Context for header (if needed in the future for shared state)
const HeaderContext = createContext<Record<string, never>>({});

// Root Header component
function HeaderRoot({ children }: { children: ReactNode }) {
  return (
    <HeaderContext.Provider value={{}}>
      <header className="h-[48px] flex flex-row items-center px-4 gap-2">
        {children}
      </header>
    </HeaderContext.Provider>
  );
}

// Left slot
function HeaderLeft({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

// Center slot - grows to fill available space
function HeaderCenter({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex items-center gap-2 overflow-hidden">
      {children}
    </div>
  );
}

// Right slot - stays on the right
function HeaderRight({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 ml-auto">{children}</div>;
}

// Default left content (Logo + Separator + Title)
function HeaderDefaultLeft() {
  return (
    <>
      <HeaderLogo />
      <Slash className="-rotate-12 opacity-30" size={16} />
      <h1 className="text-sm overflow-ellipsis line-clamp-1 font-medium">
        <HeaderTitle />
      </h1>
    </>
  );
}

// Default right content (User Menu + Auth Buttons)
function HeaderDefaultRight() {
  return (
    <>
      <UserMenu />
      <AuthButtons />
    </>
  );
}

// Compose the compound component
export const Header = Object.assign(HeaderRoot, {
  Left: HeaderLeft,
  Center: HeaderCenter,
  Right: HeaderRight,
  DefaultLeft: HeaderDefaultLeft,
  DefaultRight: HeaderDefaultRight,
  // Export widgets for easy access
  Logo: HeaderLogo,
  Title: HeaderTitle,
  NewInterviewButton: NewInterviewButton,
  UserMenu: UserMenu,
  AuthButtons: AuthButtons,
});

