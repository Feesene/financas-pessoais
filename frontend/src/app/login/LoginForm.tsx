'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/lib/auth/actions';
import type { LoginResult } from '@/lib/auth/types';

function messageFor(result: Extract<LoginResult, { ok: false }>): string {
  switch (result.code) {
    case 'invalid':
      return 'Senha incorreta';
    case 'rate_limited':
      return 'Muitas tentativas. Aguarde alguns segundos e tente novamente.';
    case 'config':
      return 'Autenticação não configurada no servidor. Contate o administrador.';
  }
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      // Em caso de sucesso, a server action redireciona e nada é retornado aqui.
      const result = await loginAction(formData);
      if (result && !result.ok) {
        setError(messageFor(result));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'password-error' : undefined}
        />
      </div>

      {error && (
        <p id="password-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
