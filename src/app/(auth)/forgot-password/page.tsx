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
import { ToastError, ToastInfo, ToastSuccess } from "@/app/common/util/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { axiosBase } from "@/app/common/util";
import { forgotPasswordApi } from "@/apiRequests/auth/login.api";
import { Toast } from "@heroui/react";

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
  }, []);

  return (
    <div className=" h-screen flex items-center justify-center">
      <div className="min-w-[400px] p-5 rounded-md border border-gray-200 shadow-md bg-white">
        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(onSubmitSendMail)}
            className="space-y-8"
          >
            <FormDescription>
              <span className="block text-2xl font-bold text-center">
                Forgot password
              </span>
            </FormDescription>

            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Input your email..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="submit"
              disabled={isSending}
              className={`py-2 rounded-sm w-full text-white bg-blue-600 ${
                emailSent && "bg-green-600"
              } hover:opacity-90`}
            >
              {emailSent ? "Resend" : "Send reset link"}
            </button>
          </form>
        </Form>

        <Link
          href="/login"
          className="block mt-5 w-full text-center underline cursor-pointer"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
