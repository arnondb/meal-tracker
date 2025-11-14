import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Menu, LogOut, Copy, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/useAuthStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
export function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('You have been logged out.');
  };
  const handleCopyCode = () => {
    if (family?.joinCode) {
      navigator.clipboard.writeText(family.joinCode);
      toast.success('Join code copied!');
    }
  };
  const AuthNav = () => (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {family && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">Code: {family.joinCode}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle className="relative top-0 right-0" />
    </div>
  );
  const GuestNav = () => (
    <div className="hidden md:flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link to="/login">Login</Link>
      </Button>
      <Button asChild>
        <Link to="/register">Sign Up</Link>
      </Button>
      <ThemeToggle className="relative top-0 right-0" />
    </div>
  );
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8 text-brand" />
              <span className="font-heading text-2xl font-bold tracking-tight">ChronoPlate</span>
            </Link>
            {family && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <span className="hidden sm:inline font-semibold text-muted-foreground">{family.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <nav className="hidden md:flex gap-4">
                <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
                <Link to="/reports" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Reports</Link>
                <Link to="/settings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Settings</Link>
              </nav>
            )}
            <div className="hidden md:block">
              {isAuthenticated ? <AuthNav /> : <GuestNav />}
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px]">
                  <div className="flex flex-col h-full">
                    {isAuthenticated ? (
                      <>
                        <nav className="flex flex-col gap-4 text-lg mt-8">
                          <Link to="/" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
                          <Link to="/reports" className="text-muted-foreground hover:text-foreground">Reports</Link>
                          <Link to="/settings" className="text-muted-foreground hover:text-foreground">Settings</Link>
                        </nav>
                        <div className="mt-auto flex flex-col items-center gap-4 pb-4">
                          <Button variant="outline" onClick={handleLogout} className="w-full">
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                          </Button>
                          <ThemeToggle className="relative top-0 right-0" />
                        </div>
                      </>
                    ) : (
                      <>
                        <nav className="flex flex-col gap-4 text-lg mt-8">
                          <Link to="/login" className="text-muted-foreground hover:text-foreground">Login</Link>
                          <Link to="/register" className="text-muted-foreground hover:text-foreground">Sign Up</Link>
                        </nav>
                        <div className="mt-auto flex justify-center pb-4">
                          <ThemeToggle className="relative top-0 right-0" />
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}