import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { UtensilsCrossed, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export function ForgotPasswordPage() {
  const [resetToken, setResetToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await api<{ resetToken: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setResetToken(response.resetToken);
      toast.success('Password reset token generated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not process request.');
    }
  };
  const handleCopyToken = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      toast.success('Token copied to clipboard!');
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
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {resetToken
              ? 'Use the token below to reset your password.'
              : 'Enter your email and we will send you a reset token.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetToken ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">For this demo, the token is displayed here instead of being emailed.</p>
              <div className="p-2 bg-muted rounded-md font-mono text-sm break-all relative">
                {resetToken}
                <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7" onClick={handleCopyToken}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button asChild className="w-full">
                <Link to={`/reset-password/${resetToken}`}>Reset Your Password</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Token
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link to="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}