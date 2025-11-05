"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/user-detail-context";
import { toast } from "sonner";

function Provider({ children }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
       
        const { data: upsertedUser, error: upsertError } = await supabase
          .from("Users")
          .upsert(
            {
              email: email,
              name: user?.fullName,
            },
            {
              onConflict: "email",
              ignoreDuplicates: false, 
            }
          )
          .select()
          .single();

        if (!isMounted) return;

        if (upsertError) {
          toast.error("Error syncing your profile. Please try again.");
          setIsLoading(false);
          return;
        }

        setUserDetail(upsertedUser);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error:", err);
        toast.error("Unexpected error. Please refresh and try again.");
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