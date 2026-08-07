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
import { signupApi } from "@/apiRequests/auth/signup.api";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { AuthShell } from "@/components/app/auth-shell";

const formSchema = z.object({
  email: z.string().min(2).max(30),
  password: z.string().min(6).max(30),
  fullName: z.string().min(2).max(30),
});

export default function SignUpPage() {
  const router = useRouter();
  const [loadingSignup, setLoadingSignup] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoadingSignup(true);

    try {
      await signupApi({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      ToastSuccess("Sign up success. Please login");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      ToastError(error?.response?.data?.message || "Sign up failed");
    } finally {
      setLoadingSignup(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="Set up your profile and start organizing work with your team."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </span>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input autoComplete="name" placeholder="Your full name" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="password" autoComplete="new-password" placeholder="At least 6 characters" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="mt-2 w-full" disabled={loadingSignup}>
            {loadingSignup ? (
              <><LoaderCircle size={18} className="animate-spin" />Creating account...</>
            ) : (
              <>Create account<ArrowRight size={18} /></>
            )}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
