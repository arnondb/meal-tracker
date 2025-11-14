import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import { AppLogo } from '@/components/AppLogo';
const loginSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('login.validation.emailInvalid')),
  password: z.string().min(1, t('login.validation.passwordRequired')),
});
type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;
export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema(t)),
  });
  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await login(response.token);
      toast.success(t('toasts.loginSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.loginError'));
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <AppLogo className="h-8 w-8 text-brand" />
            <span className="font-heading text-3xl font-bold tracking-tight">Meal Tracker V2</span>
          </div>
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input id="email" type="email" placeholder={t('login.emailPlaceholder')} {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                <Link to="/forgot-password" className="ms-auto inline-block text-sm underline">
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('login.button')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="underline">
              {t('login.signUp')}
            </Link>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant={i18n.language === 'en' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => i18n.changeLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={i18n.language === 'he' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => i18n.changeLanguage('he')}
            >
              עברית
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}