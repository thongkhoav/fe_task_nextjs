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
import { useState } from "react";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().min(2).max(30),
  password: z.string().min(6).max(30),
});

export default function Login() {
  const { login } = useAppContext();
  const router = useRouter();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      setLoadingLogin(true);
      await login(values.email, values.password);
      ToastSuccess("Login success");
      router.push("/rooms");
      router.refresh();
    } catch (error: any) {
      ToastError(error?.response?.data?.message || "Login failed");
    }
    setLoadingLogin(false);
  }

  return (
    <div className=" h-screen flex items-center justify-center">
      <div className="min-w-[400px] p-5 rounded-md border border-gray-200 shadow-md bg-white">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormDescription>
              <span className="block text-2xl font-bold text-center">
                Login
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
            <Button type="submit" disabled={loadingLogin} className="w-full">
              Login
            </Button>
          </form>
        </Form>
        <Link
          href="/signup"
          className="block mt-5 w-full text-center underline cursor-pointer"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
