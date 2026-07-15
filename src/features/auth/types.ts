export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
  };
};
