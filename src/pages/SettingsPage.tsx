import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, User as UserIcon, Save, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from '@/components/ui/sonner';
import { api } from '@/lib/api-client';
import { Preset, AuthUser } from '@shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
import { FamilyOnboarding } from '@/components/FamilyOnboarding';
import { useAuthStore } from '@/stores/useAuthStore';
const profileSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t('settings.profile.validation.nameRequired')),
});
type ProfileFormData = z.infer<ReturnType<typeof profileSchema>>;
export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSubmittingPreset, setIsSubmittingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteFamilyConfirm, setShowDeleteFamilyConfirm] = useState(false);
  const [isDeletingFamily, setIsDeletingFamily] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: isSubmittingProfile, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema(t)),
  });
  useEffect(() => {
    if (user) {
      reset({ name: user.name });
    }
  }, [user, reset]);
  useEffect(() => {
    const fetchPresets = async () => {
      setIsLoading(true);
      try {
        const fetchedPresets = await api<Preset[]>('/api/presets');
        setPresets(fetchedPresets);
      } catch (error) {
        toast.error(t('toasts.settingsLoadError'));
      } finally {
        setIsLoading(false);
      }
    };
    if (family) {
      fetchPresets();
    }
  }, [family, t]);
  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await api<AuthUser>('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      updateUser(updatedUser);
      reset({ name: updatedUser.name });
      toast.success(t('toasts.profileUpdateSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.profileUpdateError'));
    }
  };
  const handleAddPreset = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      toast.warning(t('toasts.presetEmptyWarning'));
      return;
    }
    setIsSubmittingPreset(true);
    try {
      const newPreset = await api<Preset>('/api/presets', {
        method: 'POST',
        body: JSON.stringify({ name: newPresetName.trim() }),
      });
      setPresets((prev) => [...prev, newPreset]);
      setNewPresetName('');
      toast.success(t('toasts.presetAddSuccess', { name: newPreset.name }));
    } catch (error) {
      toast.error(t('toasts.presetAddError'));
    } finally {
      setIsSubmittingPreset(false);
    }
  };
  const handleDeletePreset = (id: string) => {
    setDeletingPresetId(id);
  };
  const confirmDeletePreset = async () => {
    if (!deletingPresetId) return;
    try {
      await api(`/api/presets/${deletingPresetId}`, { method: 'DELETE' });
      setPresets((prev) => prev.filter((p) => p.id !== deletingPresetId));
      toast.success(t('toasts.presetDeleteSuccess'));
    } catch (err) {
      toast.error(t('toasts.presetDeleteError'));
    } finally {
      setDeletingPresetId(null);
    }
  };
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api('/api/auth/me', { method: 'DELETE' });
      toast.success(t('toasts.deleteAccountSuccess'));
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(t('toasts.deleteAccountError'));
      setIsDeletingAccount(false);
    }
  };
  const handleDeleteFamily = async () => {
    setIsDeletingFamily(true);
    try {
      await api('/api/family', { method: 'DELETE' });
      toast.success(t('toasts.deleteFamilySuccess'));
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(t('toasts.deleteFamilyError'));
      setIsDeletingFamily(false);
    }
  };
  return (
    <AppLayout>
      {family ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <header className="mb-8">
              <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">{t('settings.title')}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{t('settings.description')}</p>
            </header>
            <div className="grid gap-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-brand" />
                    {t('settings.profile.title')}
                  </CardTitle>
                  <CardDescription>{t('settings.profile.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                      <Label htmlFor="name" className="sm:text-right">{t('settings.profile.nameLabel')}</Label>
                      <div className="sm:col-span-2">
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive mt-2">{errors.name.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                      <Label htmlFor="email" className="sm:text-right">{t('settings.profile.emailLabel')}</Label>
                      <div className="sm:col-span-2">
                        <Input id="email" type="email" value={user?.email || ''} disabled readOnly />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmittingProfile || !isDirty}>
                        {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {t('settings.profile.saveButton')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.presets.addTitle')}</CardTitle>
                    <CardDescription>{t('settings.presets.addDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddPreset} className="flex items-center gap-4">
                      <Input
                        placeholder={t('settings.presets.inputPlaceholder')}
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        disabled={isSubmittingPreset}
                      />
                      <Button type="submit" disabled={isSubmittingPreset} className="bg-brand hover:bg-brand/90 text-brand-foreground">
                        {isSubmittingPreset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">{t('settings.presets.addButton')}</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">{t('settings.presets.listTitle')}</h2>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                  ) : presets.length > 0 ? (
                    <AnimatePresence>
                      {presets.map((preset) => (
                        <motion.div
                          key={preset.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        >
                          <Card>
                            <CardContent className="p-4 flex justify-between items-center">
                              <span className="font-medium">{preset.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeletePreset(preset.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                      <EmptyStateIllustration />
                      <h3 className="mt-4 text-lg font-semibold text-foreground">{t('settings.presets.emptyTitle')}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t('settings.presets.emptyDescription')}</p>
                    </div>
                  )}
                </div>
              </div>
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {t('settings.dangerZone.title')}
                  </CardTitle>
                  <CardDescription>{t('settings.dangerZone.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 border border-dashed border-destructive/50 rounded-md">
                    <div>
                      <h4 className="font-semibold">{t('settings.dangerZone.deleteFamilyTitle')}</h4>
                      <p className="text-sm text-muted-foreground">{t('settings.dangerZone.deleteFamilyDescription')}</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteFamilyConfirm(true)}>{t('settings.dangerZone.deleteButton')}</Button>
                  </div>
                  <div className="flex justify-between items-center p-4 border border-dashed border-destructive/50 rounded-md">
                    <div>
                      <h4 className="font-semibold">{t('settings.dangerZone.deleteAccountTitle')}</h4>
                      <p className="text-sm text-muted-foreground">{t('settings.dangerZone.deleteAccountDescription')}</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteAccountConfirm(true)}>{t('settings.dangerZone.deleteButton')}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <FamilyOnboarding />
      )}
      <AlertDialog open={!!deletingPresetId} onOpenChange={(open) => !open && setDeletingPresetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('home.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('home.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePreset} className="bg-destructive hover:bg-destructive/90">{t('home.deleteDialog.action')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteAccountConfirm} onOpenChange={setShowDeleteAccountConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.dangerZone.deleteAccountDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.dangerZone.deleteAccountDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="bg-destructive hover:bg-destructive/90">
              {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.dangerZone.deleteAccountDialog.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteFamilyConfirm} onOpenChange={setShowDeleteFamilyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.dangerZone.deleteFamilyDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.dangerZone.deleteFamilyDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFamily} disabled={isDeletingFamily} className="bg-destructive hover:bg-destructive/90">
              {isDeletingFamily && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.dangerZone.deleteFamilyDialog.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster richColors />
    </AppLayout>
  );
}