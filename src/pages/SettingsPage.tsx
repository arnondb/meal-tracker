import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from '@/components/ui/sonner';
import { api } from '@/lib/api-client';
import { Preset } from '@shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
export function SettingsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  useEffect(() => {
    const fetchPresets = async () => {
      setIsLoading(true);
      try {
        const fetchedPresets = await api<Preset[]>('/api/presets');
        setPresets(fetchedPresets);
      } catch (error) {
        toast.error('Failed to load meal pre-sets.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresets();
  }, []);
  const handleAddPreset = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      toast.warning('Preset name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };
  const handleDeletePreset = (id: string) => {
    setDeletingPresetId(id);
  };
  const confirmDelete = async () => {
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
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">Settings</h1>
            <p className="mt-2 text-lg text-muted-foreground">Manage your custom meal pre-sets.</p>
          </header>
          <Card className="mb-8">
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
                  disabled={isSubmitting}
                />
                <Button type="submit" disabled={isSubmitting} className="bg-brand hover:bg-brand/90 text-brand-foreground">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
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
      </div>
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster richColors />
    </AppLayout>
  );
}