import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
type ProfileFormData = z.infer<typeof profileSchema>;
export function SettingsPage() {
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
    resolver: zodResolver(profileSchema),
  });
  useEffect(() => {
    if (user) {
      reset({ name: user.name });
    }
  }, [user, reset]);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedPresets = await api<Preset[]>('/api/presets');
        setPresets(fetchedPresets);
      } catch (error) {
        toast.error('Failed to load settings data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await api<AuthUser>('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      updateUser(updatedUser);
      reset({ name: updatedUser.name });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile.');
    }
  };
  const handleAddPreset = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      toast.warning('Preset name cannot be empty.');
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
      toast.success(`Preset "${newPreset.name}" added!`);
    } catch (error) {
      toast.error('Failed to add preset.');
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
      toast.success('Preset deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete preset.');
    } finally {
      setDeletingPresetId(null);
    }
  };
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api('/api/auth/me', { method: 'DELETE' });
      toast.success('Your account has been deleted.');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };
  const handleDeleteFamily = async () => {
    setIsDeletingFamily(true);
    try {
      await api('/api/family', { method: 'DELETE' });
      toast.success('Your family has been deleted.');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete family.');
      setIsDeletingFamily(false);
    }
  };
  return (
    <AppLayout>
      {family ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <header className="mb-8">
              <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">Settings</h1>
              <p className="mt-2 text-lg text-muted-foreground">Manage your profile, and custom meal pre-sets.</p>
            </header>
            <div className="grid gap-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-brand" />
                    User Profile
                  </CardTitle>
                  <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                      <Label htmlFor="name" className="sm:text-right">Name</Label>
                      <div className="sm:col-span-2">
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive mt-2">{errors.name.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                      <Label htmlFor="email" className="sm:text-right">Email</Label>
                      <div className="sm:col-span-2">
                        <Input id="email" type="email" value={user?.email || ''} disabled readOnly />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmittingProfile || !isDirty}>
                        {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Pre-set</CardTitle>
                    <CardDescription>Create a new meal type for quick logging.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddPreset} className="flex items-center gap-4">
                      <Input
                        placeholder="e.g., Post-workout Shake"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        disabled={isSubmittingPreset}
                      />
                      <Button type="submit" disabled={isSubmittingPreset} className="bg-brand hover:bg-brand/90 text-brand-foreground">
                        {isSubmittingPreset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Add</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Your Pre-sets</h2>
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
                      <h3 className="mt-4 text-lg font-semibold text-foreground">No pre-sets yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Add your first custom meal type above.</p>
                    </div>
                  )}
                </div>
              </div>
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 border border-dashed border-destructive/50 rounded-md">
                    <div>
                      <h4 className="font-semibold">Delete Family</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete this family and all its data.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteFamilyConfirm(true)}>Delete</Button>
                  </div>
                  <div className="flex justify-between items-center p-4 border border-dashed border-destructive/50 rounded-md">
                    <div>
                      <h4 className="font-semibold">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete your personal account.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteAccountConfirm(true)}>Delete</Button>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this meal pre-set.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePreset} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteAccountConfirm} onOpenChange={setShowDeleteAccountConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. All your personal data will be removed, and you will be removed from your family group. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="bg-destructive hover:bg-destructive/90">
              {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteFamilyConfirm} onOpenChange={setShowDeleteFamilyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Entire Family?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent and will delete the entire family group, including all meals, presets, and accounts for ALL members. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFamily} disabled={isDeletingFamily} className="bg-destructive hover:bg-destructive/90">
              {isDeletingFamily && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete This Family
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster richColors />
    </AppLayout>
  );
}