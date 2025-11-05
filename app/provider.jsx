"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/user-detail-context";
import { toast } from "sonner";

function Provider({ children }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    const createNewUser = async () => {
      if (!user) return;

      try {
        const { data: existingUsers, error: fetchError } = await supabase
          .from("Users")
          .select("*")
          .eq("email", user?.primaryEmailAddress?.emailAddress);

        if (fetchError) {
          toast.error("Error fetching user details. Please try again.");
          return;
        }

        if (!existingUsers || existingUsers.length === 0) {
          const { data: newUser, error: insertError } = await supabase
            .from("Users")
            .insert([
              {
                name: user?.fullName,
                email: user?.primaryEmailAddress?.emailAddress,
              },
            ])
            .select();

          if (insertError) {
            toast.error("Error creating your profile. Please try again.");
            return;
          }

          toast.success("Welcome! Your account has been created.");
          setUserDetail(newUser?.[0]);
          return;
        }

        setUserDetail(existingUsers?.[0]);
      } catch (err) {
        toast.error("Unexpected error. Please refresh and try again.");
      }
    };

    createNewUser();
  }, [user]);

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <div className="h-full">{children}</div>
    </UserDetailContext.Provider>
  );
}

export default Provider;
