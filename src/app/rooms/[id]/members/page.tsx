"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { ToastError, ToastSuccess } from "@/app/common/util/toast";
import { useAppContext } from "@/app/providers/app-provider";
import { RoomDetail } from "@/apiRequests/room/room-detail.type";
import useAxiosPrivate from "@/app/common/util/axios/useAxiosPrivate";
import {
  ChevronLeft,
  CircleX,
  Copy,
  Crown,
  LogOut,
  RefreshCcw,
  Settings,
  Star,
  UserPlus,
} from "lucide-react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
} from "@heroui/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { RoomTabs } from "@/components/app/room-tabs";
import { Avatar } from "@/components/app/avatar";
import { EmptyState, PageLoading } from "@/components/app/page-state";

interface MemberListResponse {
  data: Member[];
}

interface Member {
  isOwner: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface RoomDetailResponse {
  data: RoomDetail;
}

const addMemberSchema = z.object({
  email: z.string().email().min(6).max(30),
});

const updateRoomSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().min(3).max(100),
});

export default function RoomMemberPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>();
  const { user } = useAppContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const {
    isOpen: isOpenAddMember,
    onOpen: onOpenAddMember,
    onOpenChange: onOpenChangeAddMember,
    onClose: onCloseAddMember,
  } = useDisclosure();
  const {
    isOpen: isOpenUpdateRoom,
    onOpen: onOpenUpdateRoom,
    onClose: onCloseUpdateRoom,
    onOpenChange: onOpenChangeUpdateRoom,
  } = useDisclosure();
  const addMemberForm = useForm<z.infer<typeof addMemberSchema>>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
    },
  });
  const updateRoomForm = useForm<z.infer<typeof updateRoomSchema>>({
    resolver: zodResolver(updateRoomSchema),
    defaultValues: {
      name: roomDetail?.roomName,
      description: roomDetail?.roomDescription,
    },
  });
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [isOpenRemoveRoom, setOpenRemoveRoom] = useState(false);
  const [isOpenLeaveRoom, setOpenLeaveRoom] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadMembers();
      loadRoom();
    }
  }, [id, user]);

  const onLeaveRoom = async () => {
    try {
      await axiosPrivate.put("/room/" + id + "/leave");
      ToastSuccess("You left the room");
      router.push("/rooms");
    } catch (err: any) {
      console.error(err);
      ToastError(err.response?.data?.message || "Failed to leave room");
    }
  };

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await axiosPrivate.get<MemberListResponse>(
        "/room/" + id + "/users",
        {
          params: {
            includeOwner: true,
          },
        },
      );
      setMembers(res.data.data);
    } catch (err) {
      console.error(err);
      ToastError("Failed to load members");
    }
    setLoadingMembers(false);
  };

  const loadRoom = async () => {
    try {
      setLoadingRoom(true);
      const roomData = await axiosPrivate.get<RoomDetailResponse>(
        "/room/" + id,
      );
      const detail = roomData.data.data;
      setRoomDetail(detail);
      setIsOwner(user?.id === detail.owner.id);
      updateRoomForm.setValue("name", detail?.roomName);
      updateRoomForm.setValue("description", detail?.roomDescription);
    } catch (err: any) {
      console.error(err);
      ToastError(err?.response?.data?.message || "Failed to load room");
      router.push("/rooms");
    }
    setLoadingRoom(false);
  };

  async function onAddMember(values: z.infer<typeof addMemberSchema>) {
    try {
      if (members.find((member) => member.user.email === values.email)) {
        ToastError("Member already joined");
        return;
      }

      await axiosPrivate.post(`/room/${id}/add-member`, {
        email: values.email,
      });
      // fetchRooms();
      ToastSuccess("Member added successfully");
      await loadMembers();
      addMemberForm.reset();
      onCloseAddMember();
    } catch (error: any) {
      ToastError(error.response?.data?.message || "Failed to add member");
    }
  }

  async function onUpdateRoom(values: z.infer<typeof updateRoomSchema>) {
    try {
      if (
        values?.name === roomDetail?.roomName &&
        values?.description === roomDetail?.roomDescription
      ) {
        ToastError("No changes found");
        return;
      }

      await axiosPrivate.put(`/room/${id}`, {
        name: values.name,
        description: values.description,
      });
      ToastSuccess("Room updated successfully");
      onCloseUpdateRoom();
      loadRoom();
    } catch (error: any) {
      ToastError(error.response?.data?.message || "Failed to update room");
    }
  }

  const handleRemoveMember = async (member: Member) => {
    if (!member) return;

    try {
      await axiosPrivate.delete(`/room/${id}/remove-member`, {
        data: {
          userId: member.user.id,
          removeAll: false,
        },
      });

      setOpenPopoverId(null);
      ToastSuccess("Member removed successfully");
      loadMembers();
    } catch (err) {
      console.error(err);
      ToastError("Failed to remove member");
    }
  };

  const onRemoveRoom = async () => {
    try {
      await axiosPrivate.delete("/room/" + id);
      ToastSuccess("User removed");
      router.push("/rooms");
    } catch (err: any) {
      console.error(err);
      ToastError(err.response?.data?.message || "Failed to remove user");
    }
  };

  const handleCopyInviteCode = async () => {
    if (!roomDetail?.inviteLink) {
      console.error("Invite code not found");
      return;
    }
    try {
      await navigator.clipboard.writeText(roomDetail?.inviteLink);
      ToastSuccess("Invite code copied");
    } catch (err) {
      console.error(err);
      ToastError("Failed to copy invite code");
    }
  };

  if (loadingRoom) {
    return <PageLoading label="Loading room members" />;
  }

  if (!roomDetail) {
    return (
      <div className="app-container py-16 text-center">
        <h1 className="text-lg font-bold text-slate-900">Room not found</h1>
        <Link
          href="/rooms"
          className="mt-3 block font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Back to rooms
        </Link>
      </div>
    );
  }

  return (
    <main className="app-container flex w-full min-w-0 flex-col gap-5 overflow-hidden pb-12 pt-6 sm:pt-8">
      <Modal isOpen={isOpenUpdateRoom} onOpenChange={onOpenChangeUpdateRoom} placement="center">
        <ModalContent>
          {() => (
            <Form {...updateRoomForm}>
              <form onSubmit={updateRoomForm.handleSubmit(onUpdateRoom)}>
                <ModalHeader className="flex flex-col gap-1 text-slate-950">
                  Update room
                  <span className="text-sm font-normal text-slate-500">Keep the room name and purpose clear for everyone.</span>
                </ModalHeader>
                <ModalBody className="gap-5">
                  <FormField control={updateRoomForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room name</FormLabel>
                      <FormControl><Input placeholder="Room name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateRoomForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Input placeholder="Room description" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseUpdateRoom}>Cancel</Button>
                  <Button color="primary" type="submit">Save changes</Button>
                </ModalFooter>
              </form>
            </Form>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenAddMember} onOpenChange={onOpenChangeAddMember} placement="center">
        <ModalContent>
          {() => (
            <Form {...addMemberForm}>
              <form onSubmit={addMemberForm.handleSubmit(onAddMember)}>
                <ModalHeader className="flex flex-col gap-1 text-slate-950">
                  Add a member
                  <span className="text-sm font-normal text-slate-500">Add an existing Taskflow user by email address.</span>
                </ModalHeader>
                <ModalBody>
                  <FormField control={addMemberForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl><Input type="email" autoComplete="email" placeholder="teammate@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseAddMember}>Cancel</Button>
                  <Button color="primary" type="submit">Add member</Button>
                </ModalFooter>
              </form>
            </Form>
          )}
        </ModalContent>
      </Modal>

      <section className="surface-card flex min-w-0 flex-col gap-6 overflow-hidden p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Tooltip content="Back to rooms">
            <Link href="/rooms" className="icon-button shrink-0 bg-slate-50" aria-label="Back to rooms">
              <ChevronLeft size={21} />
            </Link>
          </Tooltip>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Room workspace</p>
            <div className="mt-2 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{roomDetail.roomName}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{roomDetail.roomDescription}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isOwner && (
                  <button type="button" onClick={onOpenUpdateRoom} className="icon-button" aria-label="Edit room">
                    <Settings size={19} />
                  </button>
                )}
                {isOwner ? (
                  <Popover isOpen={isOpenRemoveRoom} onOpenChange={setOpenRemoveRoom} placement="right">
                    <PopoverTrigger>
                      <button type="button" className="icon-button hover:bg-rose-50 hover:text-rose-600" aria-label="Delete room">
                        <CircleX size={20} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="w-72 p-3">
                        <p className="font-bold text-slate-900">Delete this room?</p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">All members and tasks in this room will be removed.</p>
                        <div className="mt-4 flex justify-end gap-2">
                          <button onClick={() => setOpenRemoveRoom(false)} className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700">Cancel</button>
                          <button onClick={onRemoveRoom} className="min-h-9 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white">Delete room</button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Popover isOpen={isOpenLeaveRoom} onOpenChange={setOpenLeaveRoom} placement="right">
                    <PopoverTrigger>
                      <button type="button" className="icon-button hover:bg-rose-50 hover:text-rose-600" aria-label="Leave room"><LogOut size={20} /></button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="w-64 p-3">
                        <p className="font-bold text-slate-900">Leave this room?</p>
                        <p className="mt-1 text-sm text-slate-500">You will lose access to its tasks and chat.</p>
                        <div className="mt-4 flex justify-end gap-2">
                          <button onClick={() => setOpenLeaveRoom(false)} className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700">Cancel</button>
                          <button onClick={onLeaveRoom} className="min-h-9 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white">Leave room</button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-amber-50 px-3 text-sm font-semibold text-amber-700">
                <Crown size={16} /> {roomDetail.owner.fullName}
              </span>
              <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700" onClick={handleCopyInviteCode}>
                <Copy size={15} /> Copy invite code
              </button>
            </div>
          </div>
        </div>
        {isOwner && (
          <Button onPress={onOpenAddMember} className="min-h-11 shrink-0 bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700">
            <UserPlus size={18} /> Add member
          </Button>
        )}
      </section>

      <RoomTabs roomId={id} active="members" />

      <section className="mt-3">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">Team access</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Members</h2>
            <p className="mt-1 text-sm text-slate-500">Everyone who can access this room and its work.</p>
          </div>
          <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" onClick={loadMembers}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>

        {loadingMembers ? (
          <PageLoading label="Loading members" />
        ) : members.length > 0 ? (
          <div className="surface-card divide-y divide-slate-100 overflow-hidden">
            {members.map((member) => (
              <div key={member.user.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={member.user.fullName} className="size-11 rounded-xl" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold text-slate-900">{member.user.fullName}</h3>
                      {member.isOwner && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                          <Star size={12} fill="currentColor" /> Owner
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">{member.user.email}</p>
                  </div>
                </div>
                {isOwner && !member.isOwner && (
                  <Popover isOpen={openPopoverId === member.user.id} onOpenChange={(open) => setOpenPopoverId(open ? member.user.id : null)} placement="left">
                    <PopoverTrigger>
                      <Button size="sm" variant="flat" color="danger">Remove</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="w-72 p-3">
                        <p className="font-bold text-slate-900">Remove {member.user.fullName}?</p>
                        <p className="mt-1 text-sm text-slate-500">They will lose access to this room immediately.</p>
                        <div className="mt-4 flex justify-end gap-2">
                          <button onClick={() => setOpenPopoverId(null)} className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700">Cancel</button>
                          <button onClick={() => handleRemoveMember(member)} className="min-h-9 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white">Remove</button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No members found" description="Add a teammate by email or share the invite code so they can join this room." />
        )}
      </section>
    </main>
  );
}
