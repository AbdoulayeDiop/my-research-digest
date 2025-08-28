import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

interface User {
  _id: string; // MongoDB user ID
  sub?: string; // Auth0 user ID
  name?: string;
  email?: string;
}

export function useUserSync() {
  const { isAuthenticated, user } = useAuth0();
  const [syncedUser, setSyncedUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await axios.post(`${import.meta.env.VITE_MONGO_API_URL}/api/users/sync`, {
            auth0Id: user.sub,
            email: user.email,
            name: user.name,
          });
          setSyncedUser({ ...user, _id: response.data._id });
          console.log("User synced:", { ...user, _id: response.data._id });
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    };
    syncUser();
  }, [isAuthenticated, user]);

  return syncedUser;
}