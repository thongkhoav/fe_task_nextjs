"use client";

import { useEffect, useState } from "react";
import useAxiosPrivate from "../common/util/axios/useAxiosPrivate";
import { useAppContext } from "../providers/app-provider";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { set, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastError, ToastSuccess } from "../common/util/toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Spinner,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { CircleUserRound, Crown, Mail } from "lucide-react";
import { join } from "path";
import { Style } from "../common/util/style";

export interface Room {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    fullName: string;
  };
  // isJoined: boolean;
}

interface JoinRoomResponse {
  data: {
    roomId: string;
  };
}

const formSchema = z.object({
  name: z.string().min(2).max(30),
  description: z.string().min(6).max(30),
});

const joinRoomformSchema = z.object({
  inviteCode: z.string().min(2).max(70),
});

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { user } = useAppContext();
  // for add room modal
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isOpenJoinRoom,
    onOpen: onOpenJoinRoom,
    onOpenChange: onOpenChangeJoinRoom,
    onClose: onCloseJoinRoom,
  } = useDisclosure();
  const axiosPrivate = useAxiosPrivate();
  const router = useRouter();
  const [loadingRooms, setLoadingRooms] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const joinRoomForm = useForm<z.infer<typeof joinRoomformSchema>>({
    resolver: zodResolver(joinRoomformSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  useEffect(() => {
    console.log(user);

    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    const response = await axiosPrivate.get("/room");
    console.log(response.data.data);

    setRooms(response.data.data);
    setLoadingRooms(false);
  };

  async function onAddRoom(values: z.infer<typeof formSchema>) {
    try {
      await axiosPrivate.post("/room", values);
      fetchRooms();
      onClose();
    } catch (error) {
      ToastError("Create room failed");
    }
  }

  async function joinRoom(values: z.infer<typeof joinRoomformSchema>) {
    try {
      console.log(values);

      const res = await axiosPrivate.post<JoinRoomResponse>(
        `/room/join-by-invite`,
        {
          inviteCode: values.inviteCode,
        }
      );
      const roomIdData = res?.data?.data?.roomId;
      if (roomIdData) {
        ToastSuccess("Join room successfully");
        router.push(`/rooms/${roomIdData}/tasks`);
        onCloseJoinRoom();
        joinRoomForm.reset();
      }
    } catch (error: any) {
      ToastError(error?.response?.data?.message || "Join room failed");
    }
  }

  if (loadingRooms) {
    return <Spinner />;
  }

  return (
    <div className="h-full flex flex-col container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 flex justify-between items-center border rounded-md p-4 shadow-sm mt-10 bg-white">
        <Modal
          isOpen={isOpenJoinRoom}
          onOpenChange={onOpenChangeJoinRoom}
          placement="center"
        >
          <ModalContent>
            {(onClose) => (
              <Form {...joinRoomForm}>
                <form
                  onSubmit={joinRoomForm.handleSubmit(joinRoom)}
                  className="space-y-6"
                >
                  <ModalHeader className="flex flex-col gap-1">
                    Join room
                  </ModalHeader>
                  <ModalBody>
                    <FormField
                      control={joinRoomForm.control}
                      name="inviteCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invite code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Input invite code..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Close
                    </Button>
                    <Button color="primary" type="submit">
                      Submit
                    </Button>
                  </ModalFooter>
                </form>
              </Form>
            )}
          </ModalContent>
        </Modal>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onAddRoom)}
                  className="space-y-6"
                >
                  <ModalHeader className="flex flex-col gap-1">
                    Add new room
                  </ModalHeader>
                  <ModalBody>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              type="Room name"
                              placeholder="Input room name..."
                              {...field}
                            />
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
                            <Input
                              type="Room description"
                              placeholder="Input room description..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Close
                    </Button>
                    <Button color="primary" type="submit">
                      Add
                    </Button>
                  </ModalFooter>
                </form>
              </Form>
            )}
          </ModalContent>
        </Modal>

        <div className="flex flex-col ">
          <span>{user?.fullName}</span>
          <div className="flex gap-1 items-center text-base font-normal">
            <Mail size={20} color={Style.BLUE} />
            <span>{user?.email}</span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-2">
          <button
            onClick={onOpenJoinRoom}
            className="text-sm px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-sm"
          >
            Join room
          </button>

          <Button onPress={onOpen}>Add room</Button>
        </div>
      </h1>

      <div className="flex flex-col gap-2">
        {rooms?.length > 0 ? (
          rooms?.map((room, index) => (
            <div
              key={index}
              className="border rounded-md px-5 py-2 shadow-sm flex justify-between items-center bg-white"
            >
              <div>
                <Link
                  href={`/rooms/${room.id}/tasks`}
                  className="text-xl font-bold underline cursor-pointer"
                >
                  {room.name}
                </Link>

                <p className="flex items-center gap-2">
                  <Crown size={20} color={Style.CROWN} />
                  {room?.owner?.fullName}
                </p>
                <p className="text-sm mt-4">
                  <span className="font-bold">Description: </span>
                  {room.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center w-[400px] border rounded-sm border-red-500 bg-red-200 mx-auto py-1">
            <h1 className="text-red-500 text-lg">Not join any rooms</h1>
          </div>
        )}
      </div>
    </div>
  );
}
