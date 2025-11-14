import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppLogo } from '@/components/AppLogo';
const resetPasswordSchema = (t: (key: string) => string) => z.object({
  password: z.string().min(6, t('passwordReset.validation.passwordRequired')),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: t('passwordReset.validation.passwordsDontMatch'),
  path: ['confirmPassword'],
});
type ResetPasswordFormData = z.infer<ReturnType<typeof resetPasswordSchema>>;
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const login = useAuthStore(s => s.login);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema(t)),
  });
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error(t('toasts.passwordResetTokenMissing'));
      return;
    }
    try {
      const response = await api<{ token: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: data.password }),
      });
      toast.success(t('toasts.passwordResetSuccess'));
      await login(response.token);
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.passwordResetError'));
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <AppLogo className="h-8 w-8 text-brand" />
            <span className="font-heading text-3xl font-bold tracking-tight">Meal Tracker</span>
          </div>
          <CardTitle className="text-2xl">{t('passwordReset.resetTitle')}</CardTitle>
          <CardDescription>{t('passwordReset.resetDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">{t('passwordReset.newPasswordLabel')}</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t('passwordReset.confirmPasswordLabel')}</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('passwordReset.resetButton')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('passwordReset.rememberPassword')}{' '}
            <Link to="/login" className="underline">
              {t('login.title')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}