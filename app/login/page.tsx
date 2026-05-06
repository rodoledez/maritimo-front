"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { isApiError } from "@/types/api";

const loginSchema = z.object({
  username: z.string().min(1, "Debe ingresar usuario"),
  password: z.string().min(1, "Debe ingresar password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loggedIn, isClient, isHydrating } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (isHydrating || !loggedIn) return;
    router.replace(isClient ? "/cliente" : "/admin");
  }, [isHydrating, loggedIn, isClient, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      const user = await login(values);
      router.replace(user.isClient ? "/cliente" : "/admin");
    } catch (error) {
      const message = isApiError(error)
        ? error.status === 401
          ? "Usuario y contraseña son inválidos, favor verificar."
          : error.message
        : "Usuario y contraseña son inválidos, favor verificar.";
      setSubmitError(message);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-[#1e1382] to-primary px-4 py-10">
      <Card className="w-full max-w-4xl overflow-hidden border-0 shadow-2xl">
        <div className="grid md:grid-cols-2">
          <div className="hidden bg-brand-celeste p-10 md:flex md:flex-col md:items-center md:justify-center">
            <Image
              src="/login-illustration.svg"
              alt="Reservas marítimas"
              width={420}
              height={420}
              priority
              className="h-auto w-full max-w-sm"
            />
          </div>
          <CardContent className="flex flex-col gap-6 p-8 md:p-10">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="Acosta y Aguayo"
                width={180}
                height={70}
                priority
                className="h-16 w-auto object-contain"
              />
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
              >
                {submitError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Usuario</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            autoComplete="username"
                            placeholder="user@company.com"
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Clave</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="pl-9 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={
                              showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 h-11 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ingresando…
                    </>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-auto text-center text-xs text-muted-foreground">
              © Copyright Acosta &amp; Aguayo Intermodal Logistic Services
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
