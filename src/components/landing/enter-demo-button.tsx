"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnterDemoButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export function EnterDemoButton({
  children = "Enter Demo",
  ...props
}: EnterDemoButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleEnterDemo = async () => {
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Check if already signed in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Already signed in, redirect to dashboard
        router.push("/app/dashboard");
        return;
      }

      // Sign in anonymously
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        throw error;
      }

      // Redirect to dashboard
      router.push("/app/dashboard");
    } catch (error) {
      console.error("Failed to enter demo:", error);
      toast({
        title: "Error",
        description: "Failed to start demo. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleEnterDemo} disabled={isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
