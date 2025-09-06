import { toast } from "react-toastify";

export const ToastSuccess = (
  message: React.ReactNode | string,
  autoClose: number = 3000
) => {
  toast.success(message, {
    autoClose,
  });
};

export const ToastError = (
  message: React.ReactNode | string,
  autoClose: number = 3000
) => {
  toast.error(message, {
    autoClose,
  });
};

export const ToastInfo = (
  message: React.ReactNode | string,
  autoClose: number = 3000
) => {
  toast.info(message, {
    position: "top-center",
    autoClose,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    className: "text-black",
    style: {
      minWidth: "500px",
    },
  });
};

export const ToastWarning = (
  message: React.ReactNode | string,
  autoClose: number = 3000
) => {
  toast.warning(message, {});
};
