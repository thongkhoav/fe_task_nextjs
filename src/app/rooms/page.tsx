"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Crown,
  DoorOpen,
  Plus,
  UsersRound,
} from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";

import useAxiosPrivate from "../common/util/axios/useAxiosPrivate";
import { useAppContext } from "../providers/app-provider";
import { ToastError, ToastSuccess } from "../common/util/toast";
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
import { Avatar } from "@/components/app/avatar";
import { EmptyState, PageLoading } from "@/components/app/page-state";

export interface Room {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    fullName: string;
  };
}

interface JoinRoomResponse {
  data: {
    roomId: string;
  };
}

const formSchema = z.object({
  name: z.string().min(2).max(30),
  description: z.string().min(6).max(100),
});

const joinRoomFormSchema = z.object({
  inviteCode: z.string().min(2).max(70),
});

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const { user } = useAppContext();
  const axiosPrivate = useAxiosPrivate();
  const router = useRouter();

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isOpenJoinRoom,
    onOpen: onOpenJoinRoom,
    onOpenChange: onOpenChangeJoinRoom,
    onClose: onCloseJoinRoom,
  } = useDisclosure();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  const joinRoomForm = useForm<z.infer<typeof joinRoomFormSchema>>({
    resolver: zodResolver(joinRoomFormSchema),
    defaultValues: { inviteCode: "" },
  });

  useEffect(() => {
    if (!user) return;
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axiosPrivate.get("/room");
      setRooms(response.data.data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      ToastError("Failed to fetch rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  async function onAddRoom(values: z.infer<typeof formSchema>) {
    try {
      await axiosPrivate.post("/room", values);
      await fetchRooms();
      form.reset();
      onClose();
      ToastSuccess("Room created successfully");
    } catch {
      ToastError("Create room failed");
    }
  }

  async function joinRoom(values: z.infer<typeof joinRoomFormSchema>) {
    try {
      const res = await axiosPrivate.post<JoinRoomResponse>(
        "/room/join-by-invite",
        { inviteCode: values.inviteCode },
      );
      const roomId = res?.data?.data?.roomId;
      if (roomId) {
        ToastSuccess("Joined room successfully");
        onCloseJoinRoom();
        joinRoomForm.reset();
        router.push(`/rooms/${roomId}/tasks`);
      }
    } catch (error: any) {
      ToastError(error?.response?.data?.message || "Join room failed");
    }
  }

  if (loadingRooms) {
    return <PageLoading label="Loading your rooms" />;
  }

  return (
    <main className="app-container py-8 sm:py-10">
      <Modal
        isOpen={isOpenJoinRoom}
        onOpenChange={onOpenChangeJoinRoom}
        placement="center"
      >
        <ModalContent>
          {() => (
            <Form {...joinRoomForm}>
              <form onSubmit={joinRoomForm.handleSubmit(joinRoom)}>
                <ModalHeader className="flex flex-col gap-1 text-slate-950">
                  Join a room
                  <span className="text-sm font-normal text-slate-500">
                    Paste the invite code shared by a room member.
                  </span>
                </ModalHeader>
                <ModalBody>
                  <FormField
                    control={joinRoomForm.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite code</FormLabel>
                        <FormControl>
                          <Input placeholder="Paste invite code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button type="button" variant="ghost" onClick={onCloseJoinRoom}>
                    Cancel
                  </Button>
                  <Button type="submit">Join room</Button>
                </ModalFooter>
              </form>
            </Form>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {() => (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddRoom)}>
                <ModalHeader className="flex flex-col gap-1 text-slate-950">
                  Create a new room
                  <span className="text-sm font-normal text-slate-500">
                    Give your team a focused space for tasks and conversations.
                  </span>
                </ModalHeader>
                <ModalBody className="gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Product launch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            rows={4}
                            placeholder="What will your team work on here?"
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Create room</Button>
                </ModalFooter>
              </form>
            </Form>
          )}
        </ModalContent>
      </Modal>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={user?.fullName} className="size-12 rounded-2xl text-base" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-indigo-600">Your workspace</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Welcome back, {user?.fullName}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Pick up where you left off or start a new room for your team.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={onOpenJoinRoom}>
              <DoorOpen size={18} /> Join room
            </Button>
            <Button onClick={onOpen}>
              <Plus size={18} /> Create room
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex sm:gap-8 sm:px-8">
          <div>
            <p className="text-2xl font-bold text-slate-950">{rooms.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Rooms</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-950">{user?.email ? 1 : 0}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active profile</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">Workspace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Your rooms</h2>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
          </p>
        </div>

        {rooms.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="surface-card group flex min-h-60 flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_20px_45px_-28px_rgba(79,70,229,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UsersRound size={21} aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Crown size={13} aria-hidden="true" />
                    {room.owner?.fullName}
                  </span>
                </div>
                <div className="mt-5 flex-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-950">
                    {room.name}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {room.description}
                  </p>
                </div>
                <Link
                  href={`/rooms/${room.id}/tasks`}
                  className="mt-6 inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700"
                >
                  Open workspace <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No rooms yet"
            description="Create a room for your own team or join an existing room with an invite code."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={onOpenJoinRoom}>
                  Join a room
                </Button>
                <Button onClick={onOpen}>Create your first room</Button>
              </div>
            }
          />
        )}
      </section>
    </main>
  );
}
