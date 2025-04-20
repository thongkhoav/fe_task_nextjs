"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { signupApi } from "@/apiRequests/auth/signup.api";
import { useState } from "react";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().min(2).max(30),
  password: z.string().min(6).max(30),
  fullName: z.string().min(2).max(30),
});

export default function SignUpPage() {
  const { login } = useAppContext();
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
    try {
      console.log(values);
      setLoadingSignup(true);
      await signupApi({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      setLoadingSignup(false);
      ToastSuccess("Sign up success. Please login");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      console.log(error);

      ToastError(error.response.data.message);
    }
  }

  return (
    <div className=" h-screen flex items-center justify-center">
      <div className="min-w-[400px] p-5 rounded-md border border-gray-200 shadow-md bg-white">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormDescription>
              <span className="block text-center text-2xl font-bold">
                Sign up
              </span>
            </FormDescription>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Input email..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Input full name..." {...field} />
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
            <Button type="submit" className="w-full" disabled={loadingSignup}>
              Submit
            </Button>
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
