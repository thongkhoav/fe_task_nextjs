"use client";

import { AuthenticatedUser, loginApi } from "@/apiRequests/auth/login.api";
import { HeroUIProvider, Tooltip } from "@heroui/react";
import { useCallback, useContext, useEffect, useState } from "react";

import { createContext } from "react";
import ToastProvider from "./toast-provider";
import useAxiosPrivate from "../common/util/axios/useAxiosPrivate";
import { ToastError, ToastSuccess } from "../common/util/toast";
import { LogOut, Pencil } from "lucide-react";

import { useRouter } from "next/navigation";
import { firebaseCloudMessaging } from "../config/firebase";
import NotificationProvider from "./notification-provider";
import authenticated from "../(auth)/actions/authenticated";
import { socket } from "../socket/socket";
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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
} from "@heroui/react";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/app/brand-mark";
import { Avatar } from "@/components/app/avatar";

type User = AuthenticatedUser;

const editUserSchema = z.object({
  fullName: z.string().min(2).max(30),
});

const AppContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUserState] = useState<User | null>(() => {
    // if (isClient()) {
    //   const _user = localStorage.getItem('user')
    //   return _user ? JSON.parse(_user) : null
    // }
    return null;
  });
  const {
    isOpen: isOpenEditUser,
    onOpen: onOpenEditUser,
    onOpenChange: onOpenChangeEditUser,
    onClose: onCloseEditUser,
  } = useDisclosure();
  const isAuthenticated = Boolean(user);
  const axiosPrivate = useAxiosPrivate();
  const router = useRouter();
  const editUserForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
    },
  });

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    if (!email || !password) return;

    const response = await loginApi(email, password);
    setUserState(response.data);
    if (!socket.connected) socket.connect();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosPrivate.post("/auth/logout", {
        fcmToken: await firebaseCloudMessaging?.tokenInlocalStorage(),
      });
      setUserState(null);
      socket.disconnect();
      await firebaseCloudMessaging.deleteToken();

      ToastSuccess("Sign out success");
      router.push("/login");
    } catch (error: any) {
      ToastError(error.message);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    const effectFunc = async () => {
      if (!(await authenticated())) {
        setUserState(null);
        socket.disconnect();
        return;
      }

      try {
        const userResponse = await axiosPrivate.get<User>("/auth/me");
        setUserState(userResponse.data);
        if (!socket.connected) socket.connect();
      } catch {
        setUserState(null);
        socket.disconnect();
      }
    };
    effectFunc();
  }, []);

  const handleOpenEditUser = () => {
    if (!user) return;
    editUserForm.reset({
      fullName: user.fullName,
    });
    onOpenEditUser();
  };

  const onUpdateUser = async (values: z.infer<typeof editUserSchema>) => {
    try {
      await axiosPrivate.put(`/user`, {
        fullName: values.fullName,
      });
      const updatedUser = {
        ...user,
        fullName: values.fullName,
      } as User;
      setUserState(updatedUser);
      ToastSuccess("Update user success");
      onCloseEditUser();
    } catch (error: any) {
      ToastError(error.response?.data?.message || error.message);
    }
  };

  return (
    <ToastProvider>
      <HeroUIProvider>
        <AppContext.Provider
          value={{
            user,
            setUser,
            isAuthenticated,
            login: handleLogin,
            logout: handleLogout,
          }}
        >
          {user && isAuthenticated && (
            <>
              <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur">
                <div className="app-container flex h-[72px] items-center justify-between gap-4">
                  <BrandMark />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenEditUser}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100"
                      aria-label="Edit profile"
                    >
                      <Avatar name={user.fullName} />
                      <span className="hidden min-w-0 sm:block">
                        <span className="block max-w-44 truncate text-sm font-semibold text-slate-900">
                          {user.fullName}
                        </span>
                        <span className="block max-w-44 truncate text-xs text-slate-500">
                          {user.email}
                        </span>
                      </span>
                      <Pencil size={15} className="hidden text-slate-400 sm:block" aria-hidden="true" />
                    </button>
                    <Tooltip content="Sign out">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="icon-button hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Sign out"
                      >
                        <LogOut size={20} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </header>

              <Modal
                isOpen={isOpenEditUser}
                onOpenChange={onOpenChangeEditUser}
                placement="center"
              >
                <ModalContent>
                  {() => (
                    <Form {...editUserForm}>
                      <form onSubmit={editUserForm.handleSubmit(onUpdateUser)}>
                        <ModalHeader className="flex flex-col gap-1 text-slate-950">
                          Edit profile
                          <span className="text-sm font-normal text-slate-500">
                            Update the name your teammates see.
                          </span>
                        </ModalHeader>
                        <ModalBody>
                          <FormField
                            control={editUserForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </ModalBody>
                        <ModalFooter>
                          <Button variant="light" onPress={onCloseEditUser}>
                            Cancel
                          </Button>
                          <Button color="primary" type="submit">
                            Save changes
                          </Button>
                        </ModalFooter>
                      </form>
                    </Form>
                  )}
                </ModalContent>
              </Modal>
            </>
          )}
          <NotificationProvider>{children}</NotificationProvider>
        </AppContext.Provider>
      </HeroUIProvider>
    </ToastProvider>
  );
}
