import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, Plus, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import { Family } from '@shared/types';
const createSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t('familyOnboarding.validation.createNameRequired')),
});
type CreateFormData = z.infer<ReturnType<typeof createSchema>>;
const joinSchema = (t: (key: string) => string) => z.object({
  joinCode: z.string().min(1, t('familyOnboarding.validation.joinCodeRequired')),
});
type JoinFormData = z.infer<ReturnType<typeof joinSchema>>;
export function FamilyOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema(t)),
  });
  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    formState: { errors: joinErrors, isSubmitting: isJoining },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema(t)),
  });
  const onCreateSubmit = async (data: CreateFormData) => {
    try {
      await api<Family>('/api/families/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await checkAuth();
      toast.success(t('toasts.familyCreateSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.familyCreateError'));
    }
  };
  const onJoinSubmit = async (data: JoinFormData) => {
    try {
      await api<Family>('/api/families/join', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await checkAuth();
      toast.success(t('toasts.familyJoinSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.familyJoinError'));
    }
  };
  return (
    <Card className="mx-auto max-w-md w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Users className="h-8 w-8 text-brand" />
        </div>
        <CardTitle className="text-2xl">{t('familyOnboarding.title')}</CardTitle>
        <CardDescription>{t('familyOnboarding.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="grid gap-4">
          <div className="grid gap-2 text-center">
            <h3 className="font-semibold">{t('familyOnboarding.createTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('familyOnboarding.createDescription')}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name" className="sr-only">{t('familyOnboarding.createNameLabel')}</Label>
            <Input
              id="name"
              placeholder={t('familyOnboarding.createNamePlaceholder')}
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
            {t('familyOnboarding.createButton')}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('familyOnboarding.or')}</span>
          </div>
        </div>
        <form onSubmit={handleSubmitJoin(onJoinSubmit)} className="grid gap-4">
          <div className="grid gap-2 text-center">
            <h3 className="font-semibold">{t('familyOnboarding.joinTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('familyOnboarding.joinDescription')}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="joinCode" className="sr-only">{t('familyOnboarding.joinCodeLabel')}</Label>
            <Input
              id="joinCode"
              placeholder={t('familyOnboarding.joinCodePlaceholder')}
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
            {t('familyOnboarding.joinButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}