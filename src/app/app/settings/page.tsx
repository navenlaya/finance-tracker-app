"use client";

import * as React from "react";
import {
  CreditCard,
  Building2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  Wallet,
  TrendingUp,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccounts } from "@/hooks/use-accounts";
import { usePlaidLink } from "@/hooks/use-plaid";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AccountDialog } from "@/components/settings/account-dialog";

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  depository: Wallet,
  credit: CreditCard,
  loan: Building2,
  investment: TrendingUp,
  other: PiggyBank,
};

export default function SettingsPage() {
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [isSandboxInfoOpen, setIsSandboxInfoOpen] = React.useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { toast } = useToast();

  const {
    open: openPlaid,
    ready: plaidReady,
    isConfigured: plaidConfigured,
    isSyncing,
    syncTransactions,
    disconnectBank,
  } = usePlaidLink();

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reset demo");
      }

      toast({
        title: "Demo Reset",
        description: "Your demo data has been reset successfully.",
      });

      window.location.reload();
    } catch (error) {
      console.error("Failed to reset demo:", error);
      toast({
        title: "Error",
        description: "Failed to reset demo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setIsResetDialogOpen(false);
    }
  };

  // Group accounts by plaid_item_id
  const plaidAccounts = accounts?.filter((a) => a.plaid_item_id) || [];
  const manualAccounts = accounts?.filter((a) => !a.plaid_item_id) || [];
  const institutionGroups = React.useMemo(() => {
    const groups: Record<string, typeof plaidAccounts> = {};
    plaidAccounts.forEach((account) => {
      const key = account.plaid_item_id || "unknown";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(account);
    });
    return groups;
  }, [plaidAccounts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your accounts and app preferences
        </p>
      </div>

      {/* Bank Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Connections
          </CardTitle>
          <CardDescription>
            Connect your bank accounts using Plaid to automatically sync transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plaidConfigured ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button onClick={openPlaid} disabled={!plaidReady}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Connect Bank
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSandboxInfoOpen(true)}
                >
                  <Info className="mr-2 h-4 w-4" />
                  Sandbox Info
                </Button>
              </div>

              {/* Connected Institutions */}
              {Object.keys(institutionGroups).length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="font-medium">Connected Institutions</h4>
                  {Object.entries(institutionGroups).map(([itemId, accts]) => (
                    <div
                      key={itemId}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">
                            {accts[0]?.institution_name || "Unknown Institution"}
                          </span>
                          <Badge variant="secondary">
                            {accts.length} account{accts.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncTransactions(itemId)}
                            disabled={isSyncing}
                          >
                            <RefreshCw
                              className={`mr-2 h-4 w-4 ${
                                isSyncing ? "animate-spin" : ""
                              }`}
                            />
                            Sync
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectBank(itemId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        </div>
                      </div>

                      {/* Account list */}
                      <div className="space-y-2">
                        {accts.map((account) => {
                          const Icon = ACCOUNT_ICONS[account.type] || Wallet;
                          return (
                            <div
                              key={account.id}
                              className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {account.name}
                                  </p>
                                  {account.mask && (
                                    <p className="text-xs text-muted-foreground">
                                      •••• {account.mask}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm font-medium">
                                {formatCurrency(account.current_balance || 0)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="font-medium">Plaid Not Configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Plaid environment variables are not set. You can still use the
                app with manual accounts and demo data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Manual Accounts
          </CardTitle>
          <CardDescription>
            Add accounts manually to track transactions without connecting to a bank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setIsAccountDialogOpen(true)}>
            Add Manual Account
          </Button>

          {manualAccounts.length > 0 && (
            <div className="space-y-2 mt-4">
              {manualAccounts.map((account) => {
                const Icon = ACCOUNT_ICONS[account.type] || Wallet;
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between py-3 px-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {account.subtype || account.type}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(account.current_balance || 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Actions</CardTitle>
          <CardDescription>
            Reset your demo data to start fresh with new sample data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setIsResetDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset Demo Data
          </Button>
        </CardContent>
      </Card>

      {/* Sandbox Info Dialog */}
      <Dialog open={isSandboxInfoOpen} onOpenChange={setIsSandboxInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plaid Sandbox Credentials</DialogTitle>
            <DialogDescription>
              Use these test credentials to connect a sandbox bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <p>
                <strong>Username:</strong> user_good
              </p>
              <p>
                <strong>Password:</strong> pass_good
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Other test credentials:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code>user_good</code> / <code>pass_good</code> - Normal flow
                </li>
                <li>
                  <code>user_good</code> / <code>mfa_device</code> - MFA with device selection
                </li>
                <li>
                  <code>user_good</code> / <code>mfa_questions</code> - MFA with security questions
                </li>
              </ul>
              <p className="mt-4">
                This is a sandbox environment. No real bank data is accessed.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Demo Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Demo Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your current demo data (accounts,
              transactions, budgets) and create fresh sample data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDemo}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? "Resetting..." : "Reset Demo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Account Dialog */}
      <AccountDialog
        open={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
      />
    </div>
  );
}
