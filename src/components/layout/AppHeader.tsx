import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut, Copy, User as UserIcon, Users, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api-client';
import { AuthUser, Family } from '@shared/types';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AppLogo } from '../AppLogo';
type PublicUser = Pick<AuthUser, 'id' | 'name' | 'email'>;
export function AppHeader() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const logout = useAuthStore((s) => s.logout);
  const updateFamily = useAuthStore((s) => s.updateFamily);
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<PublicUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileFamilyOpen, setIsMobileFamilyOpen] = useState(false);
  const fetchFamilyMembers = useCallback(async () => {
    if (!family) return;
    setIsLoadingMembers(true);
    try {
      const members = await api<PublicUser[]>('/api/family/members');
      setFamilyMembers(members);
    } catch (error) {
      toast.error(t('toasts.familyMembersLoadError'));
    } finally {
      setIsLoadingMembers(false);
    }
  }, [family, t]);
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info(t('toasts.loggedOut'));
  };
  const handleCopyCode = () => {
    if (family?.joinCode) {
      navigator.clipboard.writeText(family.joinCode);
      toast.success(t('toasts.joinCodeCopied'));
    }
  };
  const handleRegenerateCode = async () => {
    setIsRegeneratingCode(true);
    try {
      const updatedFamily = await api<Family>('/api/family/regenerate-code', { method: 'POST' });
      updateFamily(updatedFamily);
      toast.success(t('toasts.newJoinCodeSuccess'));
    } catch (error) {
      toast.error(t('toasts.newJoinCodeError'));
    } finally {
      setIsRegeneratingCode(false);
      setShowRegenerateConfirm(false);
    }
  };
  const AuthNav = () => (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <DropdownMenu open={isUserMenuOpen} onOpenChange={(open) => { setIsUserMenuOpen(open); if (open) { fetchFamilyMembers(); } }}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {family && (
            <>
              <DropdownMenuItem className="focus:bg-transparent cursor-default">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm text-muted-foreground">{t('header.code')} {family.joinCode}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{t('header.family')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>{t('header.familyMembers')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isLoadingMembers ? (
                      <DropdownMenuItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('header.loading')}
                      </DropdownMenuItem>
                    ) : (
                      familyMembers.map(member => (
                        <DropdownMenuItem key={member.id} className="gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${member.name}`} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setShowRegenerateConfirm(true)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>{t('header.regenerateCode')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('header.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle className="relative top-0 right-0" />
    </div>
  );
  const GuestNav = () => (
    <div className="hidden md:flex items-center gap-2">
      <LanguageSwitcher />
      <Button variant="ghost" asChild>
        <Link to="/login">{t('register.login')}</Link>
      </Button>
      <Button asChild>
        <Link to="/register">{t('login.signUp')}</Link>
      </Button>
      <ThemeToggle className="relative top-0 right-0" />
    </div>
  );
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <AppLogo className="h-8 w-8 text-brand" />
                <span className="font-heading text-2xl font-bold tracking-tight">Meal Tracker</span>
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
                  <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('header.dashboard')}</Link>
                  <Link to="/reports" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('header.reports')}</Link>
                  <Link to="/settings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('header.settings')}</Link>
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
                      <span className="sr-only">{t('header.openMenu')}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[240px]">
                    <div className="flex flex-col h-full">
                      {isAuthenticated ? (
                        <>
                          <nav className="flex flex-col gap-4 text-lg mt-8">
                            <Link to="/" className="text-muted-foreground hover:text-foreground">{t('header.dashboard')}</Link>
                            <Link to="/reports" className="text-muted-foreground hover:text-foreground">{t('header.reports')}</Link>
                            <Link to="/settings" className="text-muted-foreground hover:text-foreground">{t('header.settings')}</Link>
                          </nav>
                          {family && (
                            <div className="mt-8">
                              <Separator />
                              <div className="py-4">
                                <h4 className="font-semibold mb-2 px-2">{t('header.family')}: {family.name}</h4>
                                <div className="flex items-center justify-between w-full px-2">
                                  <span className="text-sm text-muted-foreground">{t('header.code')} {family.joinCode}</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCode}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Collapsible open={isMobileFamilyOpen} onOpenChange={(open) => { setIsMobileFamilyOpen(open); if (open) { fetchFamilyMembers(); } }}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start px-2">
                                      <Users className="mr-2 h-4 w-4" />
                                      {t('header.familyMembers')}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="pl-6 pr-2 text-sm">
                                    {isLoadingMembers ? (
                                      <div className="flex items-center gap-2 py-1.5 text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('header.loading')}
                                      </div>
                                    ) : (
                                      familyMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-2 py-1.5">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${member.name}`} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span>{member.name}</span>
                                        </div>
                                      ))
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                                <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setShowRegenerateConfirm(true)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  {t('header.regenerateCode')}
                                </Button>
                              </div>
                              <Separator />
                            </div>
                          )}
                          <div className="mt-auto flex flex-col items-center gap-4 pb-4">
                            <LanguageSwitcher />
                            <Button variant="outline" onClick={handleLogout} className="w-full">
                              <LogOut className="mr-2 h-4 w-4" /> {t('header.logout')}
                            </Button>
                            <ThemeToggle className="relative top-0 right-0" />
                          </div>
                        </>
                      ) : (
                        <>
                          <nav className="flex flex-col gap-4 text-lg mt-8">
                            <Link to="/login" className="text-muted-foreground hover:text-foreground">{t('register.login')}</Link>
                            <Link to="/register" className="text-muted-foreground hover:text-foreground">{t('login.signUp')}</Link>
                          </nav>
                          <div className="mt-auto flex flex-col items-center gap-4 pb-4">
                            <LanguageSwitcher />
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
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('header.regenerateConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('header.regenerateConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateCode} disabled={isRegeneratingCode}>
              {isRegeneratingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('header.regenerateConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}