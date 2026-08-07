import { axiosBase } from "@/app/common/util/axios/axiosBase";
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "USER";
}

export const loginApi = async (email: string, password: string) => {
  return await axiosBase.post<AuthenticatedUser>("/auth/signin", {
    email,
    password,
  });
};

export const forgotPasswordApi = async (email: string) => {
  return await axiosBase.post("/auth/forgot-password", {
    email,
  });
};

export const resetPasswordApi = async (token: string, newPassword: string) => {
  return await axiosBase.post("/auth/reset-password", {
    token,
    newPassword,
  });
};
