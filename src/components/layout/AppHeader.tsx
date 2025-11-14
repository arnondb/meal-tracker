import { ThemeToggle } from '@/components/ThemeToggle';
import { UtensilsCrossed } from 'lucide-react';
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-brand" />
            <span className="font-heading text-2xl font-bold tracking-tight">
              ChronoPlate
            </span>
          </a>
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex gap-4">
              <a href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Dashboard</a>
              <a href="/reports" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Reports</a>
              <a href="/settings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Settings</a>
            </nav>
            <ThemeToggle className="relative top-0 right-0" />
          </div>
        </div>
      </div>
    </header>
  );
}