"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ToastError, ToastSuccess } from "@/app/common/util/toast";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordApi } from "@/apiRequests/auth/login.api";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { AuthShell } from "@/components/app/auth-shell";
import { ArrowLeft, Check, LoaderCircle, LockKeyhole } from "lucide-react";

export default function ResetPasswordWrapper() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

const formSchema = z
  .object({
    password: z.string().min(6).max(30),
    // confirmPassword must match password
    confirmPassword: z.string(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });

function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loadingReset, setLoadingReset] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!token) {
      ToastError("No token provided");
      router.push("/forgot-password");
    }
    // decode token to check expire
    try {
      const decoded: any = jwtDecode(token as string);
      const currentTime = Date.now() / 1000; // in seconds
      if (decoded.exp < currentTime) {
        ToastError("Token has expired");
        router.push("/forgot-password");
      }
    } catch {
      ToastError("Invalid token");
      router.push("/forgot-password");
    }
  }, [token, router]);

  async function onSubmitResetPassword(values: z.infer<typeof formSchema>) {
    try {
      if (token === null) {
        ToastError("No token provided");
        return;
      }
      setLoadingReset(true);
      await resetPasswordApi(token, values?.password);
      ToastSuccess("Password reset successfully");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      ToastError(error?.response?.data?.message || "An error occurred");
    }
    setLoadingReset(false);
  }

  return (
    <AuthShell
      eyebrow="Secure your account"
      title="Choose a new password"
      description="Use at least six characters and make sure both passwords match."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitResetPassword)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="password" autoComplete="new-password" placeholder="Enter a new password" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Confirm password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Check size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="password" autoComplete="new-password" placeholder="Repeat your new password" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loadingReset} className="w-full">
            {loadingReset ? (
              <><LoaderCircle size={18} className="animate-spin" />Saving password...</>
            ) : (
              "Save new password"
            )}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
