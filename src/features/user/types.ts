export type UserProfile = {
  id?: string;
  fullName: string;
  email: string;
  createdAt?: string;
};

export type UpdateUserRequest = {
  fullName: string;
};
