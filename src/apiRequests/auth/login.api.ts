import { axiosBase } from "@/app/common/util/axios/axiosBase";
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export const loginApi = async (email: string, password: string) => {
  return await axiosBase.post<TokenPair>("/auth/signin", {
    email,
    password,
  });
};

export const forgotPasswordApi = async (email: string) => {
  return await axiosBase.post("/auth/forgot-password", {
    email,
  });
};

export const resetPasswordApi = async (token: string, password: string) => {
  return await axiosBase.post("/auth/reset-password", {
    token,
    password,
  });
};
