"use client";

import * as React from "react";
import { usePlaidLink as usePlaidLinkLib } from "react-plaid-link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

/**
 * Check if Plaid is configured
 */
export function usePlaidConfigured() {
  return useQuery({
    queryKey: ["plaid", "configured"],
    queryFn: async () => {
      const response = await fetch("/api/plaid/configured");
      if (!response.ok) return false;
      const data = await response.json();
      return data.configured === true;
    },
    staleTime: Infinity,
  });
}

/**
 * Hook to manage Plaid Link
 */
export function usePlaidLink() {
  const [linkToken, setLinkToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: isConfigured, isLoading: isCheckingConfig } = usePlaidConfigured();

  // Fetch link token
  const fetchLinkToken = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/plaid/link-token");
      if (!response.ok) {
        throw new Error("Failed to get link token");
      }
      const data = await response.json();
      setLinkToken(data.linkToken);
      return data.linkToken;
    } catch (error) {
      console.error("Failed to fetch link token:", error);
      toast({
        title: "Error",
        description: "Failed to initialize bank connection. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Exchange token mutation
  const exchangeToken = useMutation({
    mutationFn: async ({
      publicToken,
      institutionId,
      institutionName,
    }: {
      publicToken: string;
      institutionId?: string;
      institutionName?: string;
    }) => {
      const response = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, institutionId, institutionName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to exchange token");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Bank Connected",
        description: "Your bank account has been connected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync transactions mutation
  const syncMutation = useMutation({
    mutationFn: async (plaidItemId: string) => {
      const response = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plaidItemId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync transactions");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Sync Complete",
        description: `Added ${data.transactionsAdded} new transactions.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect bank mutation
  const disconnectMutation = useMutation({
    mutationFn: async (plaidItemId: string) => {
      const response = await fetch("/api/plaid/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plaidItemId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect bank");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Bank Disconnected",
        description: "Your bank has been disconnected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Plaid Link hook
  const { open, ready } = usePlaidLinkLib({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      exchangeToken.mutate({
        publicToken,
        institutionId: metadata.institution?.institution_id,
        institutionName: metadata.institution?.name,
      });
    },
    onExit: (err) => {
      if (err) {
        console.error("Plaid Link error:", err);
      }
    },
  });

  // Auto-open when token is fetched and ready
  React.useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  // Open Plaid - fetch token first if needed
  const openPlaid = React.useCallback(async () => {
    if (linkToken && ready) {
      open();
    } else {
      await fetchLinkToken();
      // The useEffect above will auto-open when ready
    }
  }, [linkToken, ready, fetchLinkToken, open]);

  return {
    open: openPlaid,
    // Button is enabled when Plaid is configured and not loading
    ready: (isConfigured ?? false) && !isLoading && !isCheckingConfig,
    isConfigured: isConfigured ?? false,
    isSyncing: syncMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    syncTransactions: syncMutation.mutate,
    disconnectBank: disconnectMutation.mutate,
  };
}
