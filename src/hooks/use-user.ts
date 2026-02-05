"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Hook to get the current user and subscribe to auth changes
 */
export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Subscribe to auth changes
  React.useEffect(() => {
    const supabase = getSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(["user"], session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    user: user ?? null,
    isLoading,
    isAnonymous: user ? !user.email : false,
  };
}
