"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/providers/app-provider";
import { ToastError, ToastSuccess } from "@/app/common/util/toast";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordApi } from "@/apiRequests/auth/login.api";
import { jwtDecode } from "jwt-decode";

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
  const { login } = useAppContext();
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
    } catch (error) {
      console.log("Invalid token", error);
      ToastError("Invalid token");
      router.push("/forgot-password");
    }
  }, [token, router]);

  async function onSubmitResetPassword(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
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
    <div className=" h-screen flex items-center justify-center">
      <div className="min-w-[400px] p-5 rounded-md border border-gray-200 shadow-md bg-white">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmitResetPassword)}
            className="space-y-8"
          >
            <FormDescription>
              <span className="block text-2xl font-bold text-center">
                Reset password
              </span>
            </FormDescription>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Input password..."
                      {...field}
                    />
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loadingReset} className="w-full">
              Save
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
