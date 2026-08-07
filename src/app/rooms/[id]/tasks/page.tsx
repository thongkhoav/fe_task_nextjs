"use client";
import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Settings,
  Calendar,
  ChevronRight,
  Copy,
  Crown,
  RefreshCcw,
  CircleX,
  LogOut,
  ChevronLeft,
  Plus,
  ListFilter,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { now, getLocalTimeZone, fromDate } from "@internationalized/date";
import { DateRangePicker } from "react-date-range";
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
  Textarea,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
} from "@heroui/react";
import { DatePicker } from "@heroui/date-picker";
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
import {
  ToastError,
  ToastSuccess,
  ToastWarning,
} from "@/app/common/util/toast";
import { TaskStatus } from "@/app/common/type/task-status.type";
import { socket } from "@/app/socket/socket";
import DraggableTask from "./DraggableTask";
import TaskColumn from "./TaskColumn";
import { timeBeforeDeadline } from "@/lib/utils";
import { RoomTabs } from "@/components/app/room-tabs";
import { EmptyState, PageLoading } from "@/components/app/page-state";
import { Avatar } from "@/components/app/avatar";

export interface Task {
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
  room: {
    id: string;
    name: string;
  };
  createdAt: string;
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

const TaskStatusBadgeColor: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "bg-yellow-200 text-yellow-800",
  [TaskStatus.PROCESSING]: "bg-blue-200 text-blue-800",
  [TaskStatus.DONE]: "bg-green-200 text-green-800",
};

const addTaskSchema = z.object({
  title: z.string().min(2).max(30),
  description: z.string().min(6).max(100),
  dueDate: z.string().refine((value) => {
    return (
      new Date(value).getTime() > new Date().getTime() + timeBeforeDeadline
    ); // Must be at least 30 minutes from now
  }, "create Due date must be in the future"),
  userId: z.string().optional(),
});

const updateTaskSchema = z.object({
  taskId: z.string(),
  title: z.string().min(2).max(30),
  description: z.string().min(6).max(100),
  dueDate: z.string(),
  userId: z.string().optional(),
});

const updateRoomSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().min(3).max(100),
});

const initialRange = {
  startDate: new Date(),
  endDate: new Date(),
  key: "selection",
};

function RoomTasksPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { id } = params;
  const { user } = useAppContext();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>();
  const [roomTaskList, setRoomTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [todoTasks, setTodoTasks] = useState<Task[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [selectedUpdateTask, setSelectedUpdateTask] = useState<Task | null>(
    null,
  );
  // key is taskId, value is status
  const [statusUpdateTask, setStatusUpdateTask] = useState<
    Record<string, string>
  >({});
  const [selectionRange, setSelectionRange] = useState(initialRange);
  const [submitDateRange, setSubmitDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);

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
  const {
    isOpen: isOpenTaskDetail,
    onOpen: onOpenTaskDetail,
    onClose: onCloseTaskDetail,
    onOpenChange: onOpenChangeTaskDetail,
  } = useDisclosure();
  const [modalTaskDetail, setModalTaskDetail] = useState<Task | null>(null);

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
    // console.log(user);
    if (!user) return;

    let active = true;
    const joinTaskRoom = () => socket.emit("join_room", id);
    const handleTaskUpdated = (task: Task) => {
      if (task.room.id !== id) return;
      setRoomTaskList((prevTasks) =>
        prevTasks.map((currentTask) =>
          currentTask.id === task.id ? task : currentTask,
        ),
      );
      setStatusUpdateTask((previousStatuses) => ({
        ...previousStatuses,
        [task.id]: task.status,
      }));
    };

    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        await loadRoom();
        await loadMembers();
        await loadRoomTasks();
      } catch (err: any) {
        if (!active) return;
        console.error(err);
        ToastError(err.response?.data?.message || "Failed to fetch room data");
        router.push("/rooms");
      } finally {
        if (!active) return;
        setLoading(false);

        socket.on("connect", joinTaskRoom);
        if (socket.connected) joinTaskRoom();

        socket.on("task_updated", handleTaskUpdated);
      }
    };

    fetchData();

    return () => {
      // Clean up the socket listener when the component unmounts
      active = false;
      socket.off("connect", joinTaskRoom);
      socket.off("task_updated", handleTaskUpdated);
    };
  }, [user]);

  // if tasks are updated, update the state todoTasks, inProgressTasks, doneTasks
  useEffect(() => {
    if (roomTaskList.length > 0) {
      const todo = roomTaskList.filter(
        (task) => task.status === TaskStatus.TODO,
      );
      const inProgress = roomTaskList.filter(
        (task) => task.status === TaskStatus.PROCESSING,
      );
      const done = roomTaskList.filter(
        (task) => task.status === TaskStatus.DONE,
      );

      setTodoTasks(todo);
      setInProgressTasks(inProgress);
      setDoneTasks(done);
    }
  }, [roomTaskList]);

  const loadRoom = async () => {
    try {
      const roomData = await axiosPrivate.get<RoomDetailResponse>(
        "/room/" + id,
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
        },
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
          startDate: submitDateRange.startDate || "",
          endDate: submitDateRange.endDate || "",
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
      if (!selectedUpdateTask) return;

      // Updated: User can change task info without changing due date
      // if dueDate is changed, check if it is at least 30 minutes from now
      // if (
      //   new Date(selectedUpdateTask?.dueDate).getTime() !==
      //     new Date(values.dueDate).getTime() &&
      //   new Date(values.dueDate).getTime() <=
      //     new Date().getTime() + 30 * 60 * 1000
      // ) {
      //   ToastError("Due date must be at least 30 minutes from now");
      //   return;
      // }
      await axiosPrivate.patch("/task/" + values.taskId + "/update-task-info", {
        title: values.title,
        description: values.description,
        dueDate: new Date(values.dueDate).toISOString(),
        userId: values?.userId || "",
      });
      await loadRoomTasks();
      onCloseUpdateTask();
      updateTaskForm.reset();
      ToastSuccess("Task updated");
    } catch (error: any) {
      ToastError(error.response?.data?.message || "Update task failed");
    }
  }

  const onOpenUpdateTaskWithValues = (task: Task) => {
    updateTaskForm.setValue("taskId", task.id);
    updateTaskForm.setValue("title", task.title);
    updateTaskForm.setValue("description", task.description);
    updateTaskForm.setValue(
      "dueDate",
      task?.dueDate
        ? task?.dueDate
        : new Date(new Date().getTime() + timeBeforeDeadline).toISOString(),
    );
    updateTaskForm.setValue("userId", task?.user?.id);
    setSelectedUpdateTask(task);
    onOpenUpdateTask();
  };

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
        (task) => task.id === taskId && task.status === status,
      );
      if (isSameStatus) {
        ToastWarning("Task status is already " + status);
        return;
      }
      // api call to update task status
      // await axiosPrivate.patch("/task/update-status", {
      //   taskId,
      //   status,
      // });
      socket.emit("update_task", {
        taskId,
        status,
      });

      ToastSuccess("Task status updated to " + status);
      // setRoomTaskList(
      //   roomTaskList.map((task) => {
      //     if (task.id === taskId) {
      //       return {
      //         ...task,
      //         status: status,
      //       };
      //     }
      //     return task;
      //   })
      // );
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const onDragChangeTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      if (!taskId || !status) {
        console.error("Invalid form data");
        return;
      }
      const isSameStatus = roomTaskList.find(
        (task) => task.id === taskId && task.status === status,
      );
      if (isSameStatus) {
        ToastWarning("Task status is already " + status);
        return;
      }
      // api call to update task status
      // await axiosPrivate.patch("/task/update-status", {
      //   taskId,
      //   status,
      // });
      socket.emit("update_task", {
        taskId,
        status,
      });

      ToastSuccess("Task status updated to " + status);
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  async function onAddTask(values: z.infer<typeof addTaskSchema>) {
    try {
      await axiosPrivate.post("/task", {
        title: values.title,
        description: values.description,
        dueDate: new Date(values.dueDate).toISOString(),
        userId: values.userId,
        roomId: id,
      });

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

  // add to state statusUpdateTask
  const onChangeSelectStatus = (
    e: FormEvent<HTMLSelectElement>,
    taskId: string,
  ) => {
    const status = e.currentTarget.value as TaskStatus;
    setStatusUpdateTask((prev) => ({
      ...prev,
      [taskId]: status,
    }));
  };

  const handleSelectDateRange = async (ranges: any) => {
    setSelectionRange(ranges.selection);
  };

  const handleFilterByDateRange = async () => {
    const { startDate, endDate } = selectionRange;
    setSubmitDateRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    try {
      const res = await axiosPrivate.get<{
        data: Task[];
      }>("/task/room/" + id, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      setRoomTaskList(res.data.data);
      setIsDateRangePickerOpen(false);
    } catch (error) {
      console.error("Failed to filter tasks by date range:", error);
      ToastError("Failed to filter tasks by date range. Please try again.");
    }
  };

  const handleResetFilterDateRange = async () => {
    setSelectionRange(initialRange);
    setSubmitDateRange({
      startDate: "",
      endDate: "",
    });
    setIsDateRangePickerOpen(false);
    try {
      const res = await axiosPrivate.get<{
        data: Task[];
      }>("/task/room/" + id, {
        params: {
          startDate: "",
          endDate: "",
        },
      });
      setRoomTaskList(res.data.data);
    } catch (error) {
      console.error("Failed to filter tasks by date range:", error);
      ToastError("Failed to filter tasks by date range. Please try again.");
    }
  };

  const handleCancelFilterDateRange = () => {
    setIsDateRangePickerOpen(false);
    // set selectionRange back to submitDateRange
    setSelectionRange({
      startDate: submitDateRange?.startDate
        ? new Date(submitDateRange?.startDate)
        : initialRange.startDate,
      endDate: submitDateRange?.endDate
        ? new Date(submitDateRange?.endDate)
        : initialRange.endDate,
      key: "selection",
    });
  };

  const handleOpenTaskDetailModal = (task: Task) => {
    setModalTaskDetail(task);
    onOpenTaskDetail();
  };

  // ** Render UI **

  if (loading) {
    return <PageLoading label="Loading room workspace" />;
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
      <section className="surface-card flex min-w-0 flex-col gap-6 overflow-hidden p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {/* Update room modal */}
          <Modal
            isOpen={isOpenUpdateRoom}
            onOpenChange={onOpenUpdateRoom}
            placement="center"
          >
            <ModalContent>
              {() => (
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

          {/* Task detail modal */}
          <Modal
            isOpen={isOpenTaskDetail}
            onOpenChange={onOpenChangeTaskDetail}
            placement="center"
          >
            <ModalContent>
              {() => (
                <div className="p-2">
                  <div>
                    <ModalHeader>{modalTaskDetail?.title}</ModalHeader>
                    <ModalBody>
                      <div className="space-y-4">
                        <div>
                          <span className="font-bold">Description: </span>
                          {modalTaskDetail?.description}
                        </div>
                        <div>
                          <span className="font-bold">Due Date: </span>
                          {modalTaskDetail?.dueDate
                            ? format(
                                new Date(modalTaskDetail?.dueDate),
                                "MMMM dd, yyyy hh:mm a",
                              )
                            : "No due date"}
                        </div>
                        <div>
                          <span className="font-bold">Status: </span>
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${
                              TaskStatusBadgeColor[
                                modalTaskDetail?.status as TaskStatus
                              ]
                            }`}
                          >
                            {modalTaskDetail?.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold">Assigned to: </span>
                          {modalTaskDetail?.user
                            ? modalTaskDetail?.user.fullName
                            : "Unassigned"}
                        </div>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="danger"
                        onPress={onCloseTaskDetail}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </ModalFooter>
                  </div>
                </div>
              )}
            </ModalContent>
          </Modal>

          <Tooltip content="Back to rooms">
            <Link
              href="/rooms"
              passHref
              className="icon-button shrink-0 bg-slate-50"
              aria-label="Back to rooms"
            >
              <ChevronLeft size={21} />
            </Link>
          </Tooltip>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Room workspace
            </p>
            <div className="mt-2 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {roomDetail.roomName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {roomDetail.roomDescription}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:self-start">
                {user?.id === roomDetail.owner.id && (
                  <button
                    type="button"
                    onClick={onOpenChangeUpdateRoom}
                    className="icon-button"
                    aria-label="Edit room"
                  >
                    <Settings size={19} />
                  </button>
                )}
              {/* Owner remove this room */}
              {user?.id === roomDetail?.owner?.id && (
                <Popover
                  isOpen={isOpenRemoveRoom}
                  onOpenChange={setOpenRemoveRoom}
                  placement="right"
                >
                  <PopoverTrigger>
                    <button
                      type="button"
                      className="icon-button hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete room"
                    >
                      <CircleX size={20} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="w-72 p-3">
                      <div className="font-bold text-slate-900">Delete this room?</div>
                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        All members and tasks in this room will be removed.
                      </p>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={onRemoveRoom}
                          className="min-h-9 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          Delete room
                        </button>
                        <button
                          onClick={() => setOpenRemoveRoom(false)}
                          className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {/* Member leave room */}
              {user?.id !== roomDetail?.owner?.id && (
                <Popover
                  isOpen={isOpenLeaveRoom}
                  onOpenChange={setOpenLeaveRoom}
                  placement="right"
                >
                  <PopoverTrigger>
                    <button
                      type="button"
                      className="icon-button hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Leave room"
                    >
                      <LogOut size={20} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="w-64 p-3">
                      <div className="font-bold text-slate-900">Leave this room?</div>
                      <p className="mt-1 text-sm text-slate-500">
                        You will lose access to its tasks and chat.
                      </p>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={onLeaveRoom}
                          className="min-h-9 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          Leave room
                        </button>
                        <button
                          onClick={() => setOpenLeaveRoom(false)}
                          className="min-h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full bg-amber-50 px-3 text-sm font-semibold text-amber-700">
                <Crown size={16} />
                {roomDetail.owner.fullName}
              </div>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                onClick={handleCopyInviteCode}
              >
                <Copy size={15} /> Copy invite code
              </button>
            </div>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col justify-between gap-3 lg:w-auto">
          {roomDetail.owner.id === user?.id && (
            <Button
              onPress={onOpenAddTask}
              className="min-h-11 w-full bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700 lg:w-auto"
            >
              <Plus size={18} /> Add task
            </Button>
          )}

          <Modal isOpen={isOpenAddTask} onOpenChange={onOpenChangeAddTask}>
            <ModalContent>
              {() => (
                <Form {...addTaskForm}>
                  <form
                    onSubmit={addTaskForm.handleSubmit(onAddTask)}
                    className="space-y-6"
                  >
                    <ModalHeader className="flex flex-col gap-1 text-slate-950">
                      Create a task
                      <span className="text-sm font-normal text-slate-500">
                        Add the details your teammate needs to get started.
                      </span>
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
                          // const tomorrow = new Date(today);
                          // tomorrow.setDate(tomorrow.getDate() + 1);
                          return (
                            <FormItem>
                              <FormLabel>
                                Due date
                                <span className="text-xs text-gray-500">
                                  (must be at least 30 minutes from now)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  hideTimeZone
                                  showMonthAndYearPickers
                                  variant="bordered"
                                  defaultValue={now(getLocalTimeZone()).add({
                                    minutes: 30,
                                  })}
                                  minValue={now(getLocalTimeZone()).add({
                                    minutes: 30,
                                  })}
                                  className="w-full"
                                  aria-label="Select due date"
                                  onChange={(date) => {
                                    if (!date) return;
                                    field.onChange(date.toDate().toISOString());
                                    // set field value to date string
                                    field.value = date.toDate().toISOString();
                                  }}
                                />
                                {/* <Input
                                  type="date"
                                  min={tomorrow.toISOString().split("T")[0]}
                                  {...field}
                                /> */}
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
                            <FormControl>
                              <select {...field} className="form-select">
                                <option value="">Unassigned</option>
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
                      <Button variant="light" onPress={onCloseAddTask}>
                        Cancel
                      </Button>
                      <Button color="primary" type="submit">
                        Create task
                      </Button>
                    </ModalFooter>
                  </form>
                </Form>
              )}
            </ModalContent>
          </Modal>
        </div>
      </section>

      <RoomTabs roomId={id} active="tasks" />

      {/* Task list */}
      <section className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Kanban board</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Tasks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Drag a task between columns or update its status from the card.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => loadRoomTasks()}
          >
            <RefreshCcw size={17} /> Refresh
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={() => setIsDateRangePickerOpen(!isDateRangePickerOpen)}
          >
            <ListFilter size={17} /> Filter by date
          </button>
        </div>
      </section>

      {/* Date range picker MODAL */}
      <div
        className="fixed inset-0 z-[1000] items-start justify-center overflow-y-auto bg-slate-950/35 px-3 py-20 backdrop-blur-sm"
        style={{ display: isDateRangePickerOpen ? "flex" : "none" }}
        role="dialog"
        aria-modal="true"
        aria-label="Filter tasks by date"
      >
        <div className="max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-950">Filter by date</h3>
              <p className="text-xs text-slate-500">Show tasks due within a date range.</p>
            </div>
            <button type="button" className="icon-button" onClick={handleCancelFilterDateRange} aria-label="Close date filter">
              <X size={18} />
            </button>
          </div>
          <div className="max-w-full overflow-x-auto">
            <DateRangePicker
              ranges={[selectionRange]}
              onChange={handleSelectDateRange}
              rangeColors={["#4f46e5"]}
              moveRangeOnFirstSelection={false}
              months={1}
              direction="vertical"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={handleCancelFilterDateRange}
            >
              Cancel
            </button>
            <button
              className="min-h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={handleFilterByDateRange}
            >
              Apply filter
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {submitDateRange.startDate && submitDateRange.endDate && (
          <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">
              {format(new Date(submitDateRange.startDate), "dd MMMM, yyyy")} -{" "}
              {format(new Date(submitDateRange.endDate), "dd MMMM, yyyy")}
            </span>
            <button
              className="self-start font-semibold text-indigo-700 hover:text-indigo-900 sm:self-auto"
              onClick={handleResetFilterDateRange}
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {loadingTasks ? (
        <PageLoading label="Loading tasks" />
      ) : roomTaskList.length > 0 ? (
        <div className="flex w-full max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:overflow-visible">
          {/* 3 task columns base on status */}
          {Object.values(TaskStatus).map((status) => {
            let tasksToShow: Task[] = [];
            switch (status) {
              case TaskStatus.TODO:
                tasksToShow = todoTasks;
                break;
              case TaskStatus.PROCESSING:
                tasksToShow = inProgressTasks;
                break;
              case TaskStatus.DONE:
                tasksToShow = doneTasks;
                break;
              default:
                tasksToShow = [];
            }

            // sort tasksToShow by due date(latest first), the task has no due date will be at the end
            tasksToShow.sort((a, b) => {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            });

            // if (tasksToShow.length === 0) {
            //   return (
            //     <div
            //       key={status}
            //       className="flex flex-col p-4 bg-gray-100 rounded-md shadow-md flex-1"
            //     >
            //       {/* show color of status */}
            //       <h2
            //         className={`text-xl font-bold capitalize ${
            //           TaskStatusBadgeColor[status as TaskStatus]
            //         }`}
            //       >
            //         {status.toLowerCase()}
            //       </h2>
            //       <div className="text-center text-gray-500 ">
            //         No tasks in this status
            //       </div>
            //     </div>
            //   );
            // }

            return (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasksToShow}
                badgeColor={TaskStatusBadgeColor[status as TaskStatus]}
                onDropTask={(taskId, newStatus) => {
                  onDragChangeTaskStatus(taskId, newStatus as TaskStatus);
                }}
              >
                {tasksToShow.map((task: Task) => (
                  <DraggableTask
                    key={task?.id}
                    item={task}
                    canDrag={
                      roomDetail?.owner?.id === user?.id ||
                      task?.user?.id === user?.id
                    }
                  >
                    <div
                      key={task.id}
                      className="relative flex min-h-52 justify-between p-4"
                    >
                      {user?.id === roomDetail?.owner?.id && (
                        <button
                          type="button"
                          onClick={() => onOpenUpdateTaskWithValues(task)}
                          className="icon-button absolute right-2 top-2 z-10 size-9 rounded-lg"
                          aria-label={`Edit task ${task.title}`}
                        >
                          <Settings size={17} />
                        </button>
                      )}
                      <Modal
                        isOpen={isOpenUpdateTask}
                        onOpenChange={onOpenChangeUpdateTask}
                        placement="top-center"
                      >
                        <ModalContent>
                          {() => (
                            <Form {...updateTaskForm}>
                              <form
                                onSubmit={updateTaskForm.handleSubmit(
                                  onEditTask,
                                )}
                                className="space-y-6"
                              >
                                <ModalHeader className="flex flex-col gap-1 text-slate-950">
                                  Update task
                                  <span className="text-sm font-normal text-slate-500">
                                    Keep the task details and ownership up to date.
                                  </span>
                                </ModalHeader>
                                <ModalBody>
                                  <FormField
                                    control={updateTaskForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="Task title"
                                          />
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
                                      return (
                                        <FormItem>
                                          <FormLabel>
                                            Due date
                                            <span className="text-xs text-gray-500">
                                              (must be at least 30 minutes from
                                              now)
                                            </span>
                                          </FormLabel>
                                          <FormControl>
                                            <DatePicker
                                              hideTimeZone
                                              showMonthAndYearPickers
                                              variant="bordered"
                                              defaultValue={fromDate(
                                                new Date(field.value),
                                                getLocalTimeZone(),
                                              )}
                                              className="w-full"
                                              aria-label="Select due date"
                                              onChange={(date) => {
                                                if (!date) return;
                                                field.onChange(
                                                  date.toDate().toISOString(),
                                                );
                                                // set field value to date string
                                                field.value = date
                                                  .toDate()
                                                  .toISOString();
                                              }}
                                            />
                                            {/* <Input
                                  type="date"
                                  min={tomorrow.toISOString().split("T")[0]}
                                  {...field}
                                /> */}
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
                                        <FormControl>
                                          <select {...field} className="form-select">
                                            <option value="">Unassigned</option>
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
                                  <Button variant="light" onPress={onCloseUpdateTask}>
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

                      {/* Task item display */}
                      <div className="flex w-full flex-col pr-7">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-950">
                            {task.title}
                          </h3>
                          {user?.id !== roomDetail?.owner?.id && (
                            <button
                              type="button"
                              onClick={() => handleOpenTaskDetailModal(task)}
                              className="icon-button -mr-7 size-9 rounded-lg"
                              aria-label={`View task ${task.title}`}
                            >
                              <ChevronRight size={18} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenTaskDetailModal(task)}
                          className="mt-2 line-clamp-2 text-left text-sm leading-5 text-slate-500 hover:text-slate-700"
                        >
                          {task.description}
                        </button>
                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                          {task.user ? (
                            <Tooltip content={task.user.email}>
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar name={task.user.fullName} className="size-7 rounded-lg text-[10px]" />
                                <span className="truncate font-medium">{task.user.fullName}</span>
                              </div>
                            </Tooltip>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Avatar name="?" className="size-7 rounded-lg bg-slate-100 text-[10px] text-slate-500" />
                              <span>Unassigned</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Calendar className="text-indigo-500" size={15} />
                          <span>
                            {format(
                              new Date(task.dueDate),
                              "MMM dd, yyyy hh:mm a",
                            )}
                          </span>
                        </p>
                        {(roomDetail?.owner?.id === user?.id ||
                          task?.user?.id === user?.id) && (
                            <form
                              onSubmit={updateStatus}
                              className="mt-4 flex items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="taskId"
                                value={task.id}
                              />
                              <select
                                name="status"
                                defaultValue={task.status}
                                aria-label={`Status for ${task.title}`}
                                className="min-h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                                onChange={(e) =>
                                  onChangeSelectStatus(e, task.id)
                                }
                                value={statusUpdateTask[task.id] || task.status}
                              >
                                {Object.values(TaskStatus).map((status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {status === TaskStatus.PROCESSING ? "IN PROGRESS" : status}
                                  </option>
                                ))}
                              </select>
                              <Button
                                color="primary"
                                size="sm"
                                type="submit"
                                className="min-h-9 bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-200"
                                disabled={
                                  statusUpdateTask[task.id] === task.status ||
                                  !statusUpdateTask[task.id]
                                }
                              >
                                Update
                              </Button>
                            </form>
                          )}
                      </div>
                    </div>
                  </DraggableTask>
                ))}
              </TaskColumn>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No tasks yet"
          description="Create the first task for this room, or adjust your date filter to see more work."
          action={
            roomDetail.owner.id === user?.id ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                onClick={onOpenAddTask}
              >
                <Plus size={18} /> Create a task
              </button>
            ) : undefined
          }
        />
      )}
    </main>
  );
}
export default RoomTasksPage;
