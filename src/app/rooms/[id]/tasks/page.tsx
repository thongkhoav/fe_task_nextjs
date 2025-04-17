"use client";
import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  Settings,
  CircleUserRound,
  Calendar,
  ChevronLeft,
  CircleChevronLeft,
  Copy,
  Crown,
  RefreshCcw,
  CircleX,
  Mail,
  LogOut,
  Group,
} from "lucide-react";
import { useAppContext } from "@/app/providers/app-provider";
import { RoomDetail } from "@/apiRequests/room/room-detail.type";
import useAxiosPrivate from "@/app/common/util/axios/useAxiosPrivate";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  user,
  Textarea,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
} from "@nextui-org/react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  ToastError,
  ToastSuccess,
  ToastWarning,
} from "@/app/common/util/toast";
import { TaskStatus } from "@/app/common/type/task-status.type";
import { Style } from "@/app/common/util/style";

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  review?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface RoomDetailResponse {
  data: RoomDetail;
}

interface Member {
  isOwner: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface MemberListResponse {
  data: Member[];
}

const addTaskSchema = z.object({
  title: z.string().min(2).max(30),
  description: z.string().min(6).max(30),
  dueDate: z.string().refine((value) => {
    return new Date(value).getTime() > Date.now();
  }, "Due date must be in the future"),
  userId: z.string().optional(),
});

const updateTaskSchema = z.object({
  taskId: z.string(),
  title: z.string().min(2).max(30),
  description: z.string().min(6).max(30),
  dueDate: z.string().refine((value) => {
    return new Date(value).getTime() > Date.now();
  }, "Due date must be in the future"),
  userId: z.string().optional(),
});

const today = new Date();
const updateRoomSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().min(3).max(100),
});

function RoomTasksPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { id } = params;
  const { user } = useAppContext();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>();
  const [roomTaskList, setRoomTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const axiosPrivate = useAxiosPrivate();
  const {
    isOpen: isOpenAddTask,
    onOpen: onOpenAddTask,
    onOpenChange: onOpenChangeAddTask,
    onClose: onCloseAddTask,
  } = useDisclosure();
  const {
    isOpen: isOpenUpdateTask,
    onOpen: onOpenUpdateTask,
    onOpenChange: onOpenChangeUpdateTask,
    onClose: onCloseUpdateTask,
  } = useDisclosure();
  const {
    isOpen: isOpenUpdateRoom,
    onOpen: onOpenUpdateRoom,
    onClose: onCloseUpdateRoom,
    onOpenChange: onOpenChangeUpdateRoom,
  } = useDisclosure();

  const addTaskForm = useForm<z.infer<typeof addTaskSchema>>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      userId: "",
    },
  });

  const updateTaskForm = useForm<z.infer<typeof updateTaskSchema>>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      taskId: "",
      title: "",
      description: "",
      dueDate: "",
      userId: "",
    },
  });

  const updateRoomForm = useForm<z.infer<typeof updateRoomSchema>>({
    resolver: zodResolver(updateRoomSchema),
    defaultValues: {
      name: roomDetail?.roomName,
      description: roomDetail?.roomDescription,
    },
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [isOpenRemoveRoom, setOpenRemoveRoom] = useState(false);
  const [isOpenLeaveRoom, setOpenLeaveRoom] = useState(false);

  useEffect(() => {
    console.log("Room ID:", id);
    // console.log(user);

    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);

        await loadRoom();
        await loadMembers();
        await loadRoomTasks();
      } catch (err: any) {
        console.error(err);
        ToastError(err.response?.data?.message || "Failed to fetch room data");
        router.push("/rooms");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const loadRoom = async () => {
    try {
      const roomData = await axiosPrivate.get<RoomDetailResponse>(
        "/room/" + id
      );
      const detail = roomData.data.data;
      setRoomDetail(detail);

      updateRoomForm.setValue("name", detail?.roomName);
      updateRoomForm.setValue("description", detail?.roomDescription);
    } catch (err: any) {
      console.error(err);
      ToastError(err?.response?.data?.message || "Failed to load room");
      router.push("/rooms");
    }
  };

  async function onUpdateRoom(values: z.infer<typeof updateRoomSchema>) {
    try {
      if (
        values?.name === roomDetail?.roomName &&
        values?.description === roomDetail?.roomDescription
      ) {
        ToastError("No changes found");
        return;
      }

      console.log(values);
      await axiosPrivate.put(`/room/${id}`, {
        name: values.name,
        description: values.description,
      });
      ToastSuccess("Room updated successfully");
      onCloseUpdateRoom();
      await loadRoom();
    } catch (error: any) {
      ToastError(error.response?.data?.message || "Failed to update room");
    }
  }

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

  const loadMembers = async () => {
    try {
      const res = await axiosPrivate.get<MemberListResponse>(
        "/room/" + id + "/users",
        {
          params: {
            includeOwner: true,
          },
        }
      );
      setMembers(res.data.data);
    } catch (err) {
      console.error(err);
      ToastError("Failed to load members");
    }
  };
  const loadRoomTasks = async (filterUserId?: string) => {
    try {
      setLoadingTasks(true);
      const res = await axiosPrivate.get<{
        data: Task[];
      }>("/task/room/" + id, {
        params: {
          userId: filterUserId || "",
        },
      });
      // console.log(res.data);

      setRoomTaskList(res.data.data);
    } catch (err) {
      console.error(err);
      ToastError("Failed to load members");
    }
    setLoadingTasks(false);
  };

  async function onEditTask(values: z.infer<typeof updateTaskSchema>) {
    try {
      console.log("editTask task:", values);
      await axiosPrivate.patch("/task/" + values.taskId + "/update-task-info", {
        title: values.title,
        description: values.description,
        dueDate: new Date(values.dueDate).toISOString(),
        userId: values.userId,
      });
      await loadRoomTasks();
      onCloseUpdateTask();
      updateTaskForm.reset();
      ToastSuccess("Task updated");
    } catch (error: any) {
      ToastError(error.response?.data?.message || "Update task failed");
    }
  }

  const updateStatus = async (e: any) => {
    try {
      e.preventDefault();
      const formData = new FormData(e.target);

      // Get form values
      const taskId = formData.get("taskId");
      const status = formData.get("status") as TaskStatus;
      if (!taskId || !status) {
        console.error("Invalid form data");
        return;
      }
      const isSameStatus = roomTaskList.find(
        (task) => task.id === taskId && task.status === status
      );
      if (isSameStatus) {
        ToastWarning("Task status is already " + status);
        return;
      }
      // api call to update task status
      await axiosPrivate.patch("/task/update-status", {
        taskId,
        status,
      });
      ToastSuccess("Task status updated to " + status);
      setRoomTaskList(
        roomTaskList.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: status,
            };
          }
          return task;
        })
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  async function onAddTask(values: z.infer<typeof addTaskSchema>) {
    try {
      console.log("Add task:", values);

      await axiosPrivate.post("/task", {
        title: values.title,
        description: values.description,
        dueDate: new Date(values.dueDate).toISOString(),
        userId: values.userId,
        roomId: id,
      });
      // fetchRooms();

      onCloseAddTask();
      addTaskForm.reset();
      await loadRoomTasks();
      ToastSuccess("Task added");
    } catch (error) {
      ToastError("Create room failed");
    }
  }

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

  if (loading) {
    return <Spinner />;
  }

  if (!roomDetail) {
    return (
      <div className="text-center">
        <h1 className="text-red-500 text-lg">Not found group</h1>
        <Link
          href="/home"
          className="text-blue-500 hover:underline cursor-pointer block"
        >
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col ">
      <div className="my-4 flex justify-between border rounded-md p-4 shadow-sm bg-white">
        <div className="flex justify-start gap-2">
          <Modal
            isOpen={isOpenUpdateRoom}
            onOpenChange={onOpenUpdateRoom}
            placement="center"
          >
            <ModalContent>
              {(onClose) => (
                <Form {...updateRoomForm}>
                  <form
                    onSubmit={updateRoomForm.handleSubmit(onUpdateRoom)}
                    className="space-y-6"
                  >
                    <ModalHeader className="flex flex-col gap-1">
                      Update room
                    </ModalHeader>
                    <ModalBody>
                      <FormField
                        control={updateRoomForm.control}
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
                        control={updateRoomForm.control}
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
                      <Button
                        color="danger"
                        variant="light"
                        onPress={onCloseUpdateRoom}
                      >
                        Close
                      </Button>
                      <Button color="primary" type="submit">
                        Update
                      </Button>
                    </ModalFooter>
                  </form>
                </Form>
              )}
            </ModalContent>
          </Modal>

          <Tooltip content="Back to rooms">
            <Link
              href="/rooms"
              passHref
              className="h-full flex justify-center rounded-sm px-2 items-center bg-slate-100 hover:bg-slate-200"
            >
              <Group size={25} />
            </Link>
          </Tooltip>
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold flex gap-2 items-center">
              Group "{roomDetail.roomName}"
              <Settings
                onClick={onOpenChangeUpdateRoom}
                size={25}
                className="cursor-pointer"
              />
              {/* Owner remove this room */}
              {user?.sub === roomDetail?.owner?.id && (
                <Popover
                  isOpen={isOpenRemoveRoom}
                  onOpenChange={setOpenRemoveRoom}
                  placement="right"
                >
                  <PopoverTrigger>
                    <CircleX
                      color={Style.DANGER}
                      size={25}
                      className="cursor-pointer"
                    />
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2">
                      <div className="text-small font-bold">
                        Are you sure to remove this room?
                      </div>
                      <span>This will remove all members and tasks!</span>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={onRemoveRoom}
                          className="px-3 py-1 bg-red-400 rounded-sm text-sm"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setOpenRemoveRoom(false)}
                          className="px-3 py-1 bg-gray-200 rounded-sm text-sm"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {/* Member leave room */}
              {user?.sub !== roomDetail?.owner?.id && (
                <Popover
                  isOpen={isOpenLeaveRoom}
                  onOpenChange={setOpenLeaveRoom}
                  placement="right"
                >
                  <PopoverTrigger>
                    <LogOut
                      color={Style.DANGER}
                      size={25}
                      className="cursor-pointer"
                    />
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2">
                      <div className="text-small font-bold">
                        Are you sure to leave this room?
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={onLeaveRoom}
                          className="px-3 py-1 bg-red-400 rounded-sm text-sm"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setOpenLeaveRoom(false)}
                          className="px-3 py-1 bg-gray-200 rounded-sm text-sm"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </p>

            <span>{roomDetail.roomDescription}</span>

            <div className="flex flex-col gap-1 text-base px-3 py-1 bg-slate-100 rounded-sm">
              <div className="flex gap-1 items-center ">
                <Crown size={20} color={Style.CROWN} />
                {roomDetail.owner.fullName}
              </div>
            </div>
            <p className="flex items-center text-sm gap-2">
              <span>Copy invite code</span>
              <span
                className="hover:opacity-50 hover:cursor-pointer"
                onClick={handleCopyInviteCode}
              >
                <Copy size={20} />
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between">
          {roomDetail.owner.id === user?.sub && (
            <Button
              onPress={onOpenAddTask}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Add Task
            </Button>
          )}

          <Modal isOpen={isOpenAddTask} onOpenChange={onOpenChangeAddTask}>
            <ModalContent>
              {(onClose) => (
                <Form {...addTaskForm}>
                  <form
                    onSubmit={addTaskForm.handleSubmit(onAddTask)}
                    className="space-y-6"
                  >
                    <ModalHeader className="flex flex-col gap-1">
                      Add new task
                    </ModalHeader>
                    <ModalBody>
                      <FormField
                        control={addTaskForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Task title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addTaskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Task description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addTaskForm.control}
                        name="dueDate"
                        render={({ field }) => {
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return (
                            <FormItem>
                              <FormLabel>Due date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  min={tomorrow.toISOString().split("T")[0]}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={addTaskForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mr-2">Assign to</FormLabel>
                            <FormControl className="border rounded-sm">
                              <select {...field}>
                                <option value="" selected>
                                  None
                                </option>
                                {members.map((member) => (
                                  <option
                                    key={member.user.id}
                                    value={member.user.id}
                                  >
                                    {member.user.fullName}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="danger"
                        variant="light"
                        onPress={onCloseAddTask}
                      >
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
          <Link href={`/rooms/${id}/members`} passHref>
            <Button className="bg-green-500 text-white hover:bg-green-600">
              Members
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-10 mb-3 text-center font-bold text-3xl relative text-white">
        Tasks
        <span
          className="absolute right-0 cursor-pointer hover:opacity-60"
          onClick={() => loadRoomTasks()}
        >
          <RefreshCcw color={Style.WHITE} />
        </span>
      </div>

      {loadingTasks ? (
        <div className="text-center">
          <Spinner />
        </div>
      ) : roomTaskList.length > 0 ? (
        <div className="flex flex-col gap-2">
          {roomTaskList.map((task, index) => (
            <div
              key={task.id}
              className="border rounded-md px-5 py-2 shadow-sm flex justify-between relative bg-white"
            >
              {user?.sub === roomDetail?.owner?.id && (
                <button
                  onClick={() => {
                    updateTaskForm.setValue("taskId", task.id);
                    updateTaskForm.setValue("title", task.title);
                    updateTaskForm.setValue("description", task.description);
                    updateTaskForm.setValue(
                      "dueDate",
                      task.dueDate.split("T")[0]
                    );
                    updateTaskForm.setValue("userId", task?.user?.id);
                    onOpenUpdateTask();
                  }}
                  className="text-lg cursor-pointer absolute top-0 left-1"
                >
                  <Settings />
                </button>
              )}
              <Modal
                isOpen={isOpenUpdateTask}
                onOpenChange={onOpenChangeUpdateTask}
                placement="top-center"
              >
                <ModalContent>
                  {(onClose) => (
                    <Form {...updateTaskForm}>
                      <form
                        onSubmit={updateTaskForm.handleSubmit(onEditTask)}
                        className="space-y-6"
                      >
                        <ModalHeader className="flex flex-col gap-1">
                          Update task
                        </ModalHeader>
                        <ModalBody>
                          <FormField
                            control={updateTaskForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Task title" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={updateTaskForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Task description"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={updateTaskForm.control}
                            name="dueDate"
                            render={({ field }) => {
                              const tomorrow = new Date(today);
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              return (
                                <FormItem>
                                  <FormLabel>Due date</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="date"
                                      min={tomorrow.toISOString().split("T")[0]}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={updateTaskForm.control}
                            name="userId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="mr-2">
                                  Assign to
                                </FormLabel>
                                <FormControl className="border rounded-sm">
                                  <select {...field}>
                                    {members.map((member) => (
                                      <option
                                        key={member.user.id}
                                        value={member.user.id}
                                      >
                                        {member.user.fullName}
                                      </option>
                                    ))}
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </ModalBody>
                        <ModalFooter>
                          <Button
                            color="danger"
                            variant="light"
                            onPress={onCloseAddTask}
                          >
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
              <div className="flex items-center gap-5">
                <span className="text-lg font-bold w-7 h-7 flex items-center justify-center rounded-full bg-blue-300">
                  {index + 1}
                </span>
                <div className="flex flex-col">
                  <h1 className="text-xl">{task.title}</h1>
                  <p className="flex items-center">
                    {task.user ? (
                      <Tooltip content={task.user.email}>
                        <p className="flex items-center gap-1">
                          <CircleUserRound
                            size={20}
                            className="text-xl text-blue-500"
                          />
                          <span>{task.user.fullName}</span>
                        </p>
                      </Tooltip>
                    ) : (
                      <p className="flex items-center gap-1">
                        <CircleUserRound
                          size={20}
                          className="text-xl text-red-500"
                        />
                        <span className="text-red-500">Unassigned</span>
                      </p>
                    )}
                  </p>
                  <p className="text-sm mt-4">
                    <span className="font-bold"> Description: </span>
                    {task.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between items-end">
                <p className="flex items-center">
                  <Calendar className="text-xl text-blue-500" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </p>
                <div className="flex items-center gap-2">
                  {roomDetail?.owner?.id === user?.sub ||
                  task?.user?.id === user?.sub ? (
                    <form onSubmit={updateStatus} className="flex gap-2">
                      <input
                        type="hidden"
                        name="taskId"
                        value={task.id}
                        className=""
                      />
                      <select name="status" defaultValue={task.status}>
                        {Object.values(TaskStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button color="primary" size="sm" type="submit">
                        Update
                      </Button>
                    </form>
                  ) : (
                    <p className="border rounded-sm p-1 bg-slate-100 text-sm">
                      {task.status}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center w-[400px] border rounded-sm border-red-500 bg-red-200 mx-auto py-1">
          <h1 className="text-red-500 text-lg">No tasks</h1>
        </div>
      )}
    </div>
  );
}
export default RoomTasksPage;
