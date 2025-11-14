import React from "react";
import { AppHeader } from "./AppHeader";
import { ThemeToggle } from "../ThemeToggle";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <div className={`min-h-screen flex flex-col ${className || ''}`}>
      <AppHeader />
      <main className="flex-1">
        {container ? (
          <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12" + (contentClassName ? ` ${contentClassName}` : "")}>{children}</div>
        ) : (
          children
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Built with ❤️ at Cloudflare
      </footer>
    </div>
  );
}