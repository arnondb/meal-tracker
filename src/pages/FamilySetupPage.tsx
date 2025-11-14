import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Users, Plus, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import { Family } from '@shared/types';
const joinSchema = z.object({
  joinCode: z.string().min(1, 'Join code is required'),
});
type JoinFormData = z.infer<typeof joinSchema>;
export function FamilySetupPage() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isJoining },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });
  const handleCreateFamily = async () => {
    setIsCreating(true);
    try {
      await api<Family>('/api/families/create', { method: 'POST' });
      await checkAuth();
      toast.success('Family created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create family.');
    } finally {
      setIsCreating(false);
    }
  };
  const onJoinSubmit = async (data: JoinFormData) => {
    try {
      await api<Family>('/api/families/join', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await checkAuth();
      toast.success('Successfully joined family!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join family. Please check the code.');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Users className="h-8 w-8 text-brand" />
          </div>
          <CardTitle className="text-2xl">Family Setup</CardTitle>
          <CardDescription>To start logging meals, create a new family or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2 text-center">
            <h3 className="font-semibold">Create a New Family</h3>
            <p className="text-sm text-muted-foreground">Start a new meal tracking group for your family.</p>
            <Button onClick={handleCreateFamily} disabled={isCreating || isJoining}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Family
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <form onSubmit={handleSubmit(onJoinSubmit)} className="grid gap-4">
            <div className="grid gap-2 text-center">
              <h3 className="font-semibold">Join an Existing Family</h3>
              <p className="text-sm text-muted-foreground">Enter a join code from a family member.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="joinCode" className="sr-only">Join Code</Label>
              <Input
                id="joinCode"
                placeholder="Enter join code"
                {...register('joinCode')}
                className="text-center"
              />
              {errors.joinCode && <p className="text-sm text-destructive text-center">{errors.joinCode.message}</p>}
            </div>
            <Button type="submit" variant="secondary" disabled={isJoining || isCreating}>
              {isJoining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Join Family
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}