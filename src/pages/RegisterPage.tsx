import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
const registerSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t('register.validation.nameRequired')),
  email: z.string().email(t('register.validation.emailInvalid')),
  password: z.string().min(6, t('register.validation.passwordRequired')),
});
type RegisterFormData = z.infer<ReturnType<typeof registerSchema>>;
export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema(t)),
  });
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await api<{ token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await login(response.token);
      toast.success(t('toasts.registerSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.registerError'));
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-brand" />
            <span className="font-heading text-3xl font-bold tracking-tight">ChronoPlate</span>
          </div>
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <CardDescription>{t('register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('register.nameLabel')}</Label>
              <Input id="name" placeholder={t('register.namePlaceholder')} {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('register.emailLabel')}</Label>
              <Input id="email" type="email" placeholder={t('register.emailPlaceholder')} {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('register.passwordLabel')}</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('register.button')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="underline">
              {t('register.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}