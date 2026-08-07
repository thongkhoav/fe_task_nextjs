"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/app/providers/app-provider";
import { ToastError, ToastInfo, ToastSuccess } from "@/app/common/util/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { forgotPasswordApi } from "@/apiRequests/auth/login.api";
import { AuthShell } from "@/components/app/auth-shell";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from "lucide-react";

export default function ResetPassword() {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user } = useAppContext();
  const router = useRouter();

  const emailForm = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    ),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmitSendMail(values: { email: string }) {
    try {
      // Simulate sending reset link
      setIsSending(true);
      await forgotPasswordApi(values.email);
      ToastSuccess("Reset link sent to your email");

      setEmailSent(true);
    } catch (error: any) {
      ToastError(error?.response?.data?.message || "An error occurred");
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (user) {
      ToastInfo("You are already logged in, redirecting...");
      router.push("/rooms");
    }
  }, [router, user]);

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your account email and we'll send you a secure reset link."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onSubmitSendMail)} className="space-y-5">
          {emailSent && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <span>Check your inbox for the reset link. You can resend it if needed.</span>
            </div>
          )}
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="email" autoComplete="email" placeholder="you@example.com" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSending} className="w-full">
            {isSending ? (
              <><LoaderCircle size={18} className="animate-spin" />Sending link...</>
            ) : emailSent ? (
              "Resend reset link"
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
