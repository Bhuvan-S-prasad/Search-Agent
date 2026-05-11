"use client";

import { useEffect, useState, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/user-detail-context";
import { toast } from "sonner";
import axios from "axios";


interface ProviderProps {
  children: ReactNode;
}

interface UserDetail {
  email: string;
  name: string | null;
  id?: string;
  created_at?: string;
}

function Provider({ children }: ProviderProps) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const createNewUser = async () => {
      if (!user) {
        if (isMounted) {
          setUserDetail(null);
          setIsLoading(false);
        }
        return;
      }

      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        if (isMounted) {
          toast.error("Email address not found. Please contact support.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await axios.post("/api/user/sync");
        const upsertedUser = response.data;

        if (!isMounted) return;

        setUserDetail(upsertedUser);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error in user sync:", err);
        toast.error("Error syncing your profile. Please try again.");
        setIsLoading(false);
      }

    };

    createNewUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail, isLoading }}>
      <div className="h-full">{children}</div>
    </UserDetailContext.Provider>
  );
}

export default Provider;