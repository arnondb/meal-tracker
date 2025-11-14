import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Loader2, LogOut } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import { Family } from '@shared/types';
const joinSchema = z.object({
  joinCode: z.string().min(6, 'Join code must be at least 6 characters'),
});
type JoinFormData = z.infer<typeof joinSchema>;
export function FamilyGatePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const family = useAuthStore(s => s.family);
  const logout = useAuthStore(s => s.logout);
  const checkAuth = useAuthStore(s => s.checkAuth);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });
  useEffect(() => {
    if (family) {
      navigate('/');
    }
  }, [family, navigate]);
  const handleCopyCode = () => {
    if (family?.joinCode) {
      navigator.clipboard.writeText(family.joinCode);
      toast.success('Join code copied to clipboard!');
    }
  };
  const onSubmit = async (data: JoinFormData) => {
    try {
      await api<Family>('/api/families/join', {
        method: 'POST',
        body: JSON.stringify({ joinCode: data.joinCode }),
      });
      // After successfully joining, re-check auth status to get the updated user and family info
      await checkAuth();
      toast.success('Successfully joined family!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join family.');
    }
  };
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">Welcome, {user?.name}!</h1>
            <p className="mt-2 text-lg text-muted-foreground">Let's get you set up with a family group.</p>
          </header>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Family Group</CardTitle>
                <CardDescription>
                  Share this code with others to invite them to your family group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>Your Family Join Code</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={family?.joinCode || '...'} className="font-mono text-lg" />
                  <Button variant="outline" size="icon" onClick={handleCopyCode} disabled={!family?.joinCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Join an Existing Family</CardTitle>
                <CardDescription>
                  If you've received a join code from someone else, enter it here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Join Code</Label>
                    <Input id="joinCode" placeholder="Enter code..." {...register('joinCode')} />
                    {errors.joinCode && <p className="text-sm text-destructive">{errors.joinCode.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Join Family
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Button variant="ghost" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}