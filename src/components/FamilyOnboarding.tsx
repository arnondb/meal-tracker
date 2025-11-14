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
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import { Family } from '@shared/types';
const createSchema = z.object({
  name: z.string().min(2, 'Family name must be at least 2 characters'),
});
type CreateFormData = z.infer<typeof createSchema>;
const joinSchema = z.object({
  joinCode: z.string().min(1, 'Join code is required'),
});
type JoinFormData = z.infer<typeof joinSchema>;
export function FamilyOnboarding() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  });
  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    formState: { errors: joinErrors, isSubmitting: isJoining },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });
  const onCreateSubmit = async (data: CreateFormData) => {
    try {
      await api<Family>('/api/families/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await checkAuth();
      toast.success('Family created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create family.');
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
    <Card className="mx-auto max-w-md w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Users className="h-8 w-8 text-brand" />
        </div>
        <CardTitle className="text-2xl">Family Setup</CardTitle>
        <CardDescription>To start logging meals, create a new family or join an existing one.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="grid gap-4">
          <div className="grid gap-2 text-center">
            <h3 className="font-semibold">Create a New Family</h3>
            <p className="text-sm text-muted-foreground">Start a new meal tracking group for your family.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name" className="sr-only">Family Name</Label>
            <Input
              id="name"
              placeholder="e.g., The Smiths"
              {...registerCreate('name')}
            />
            {createErrors.name && <p className="text-sm text-destructive text-center">{createErrors.name.message}</p>}
          </div>
          <Button type="submit" disabled={isCreating || isJoining}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Family
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <form onSubmit={handleSubmitJoin(onJoinSubmit)} className="grid gap-4">
          <div className="grid gap-2 text-center">
            <h3 className="font-semibold">Join an Existing Family</h3>
            <p className="text-sm text-muted-foreground">Enter a join code from a family member.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="joinCode" className="sr-only">Join Code</Label>
            <Input
              id="joinCode"
              placeholder="Enter join code"
              {...registerJoin('joinCode')}
              className="text-center"
            />
            {joinErrors.joinCode && <p className="text-sm text-destructive text-center">{joinErrors.joinCode.message}</p>}
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
  );
}