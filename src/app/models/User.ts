export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  token: string;
  picture: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  sub: string; // Google's unique ID for the user
}