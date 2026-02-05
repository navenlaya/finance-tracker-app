"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAccount } from "@/hooks/use-accounts";

const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["depository", "credit", "loan", "investment", "other"]),
  subtype: z.string().optional(),
  current_balance: z.string().optional(),
  institution_name: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCOUNT_SUBTYPES: Record<string, string[]> = {
  depository: ["checking", "savings", "money market"],
  credit: ["credit card", "line of credit"],
  loan: ["mortgage", "auto", "student", "personal"],
  investment: ["brokerage", "401k", "ira", "roth"],
  other: ["other"],
};

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { mutate: createAccount, isPending } = useCreateAccount();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      type: "depository",
      subtype: "",
      current_balance: "",
      institution_name: "",
    },
  });

  const selectedType = form.watch("type");

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        type: "depository",
        subtype: "",
        current_balance: "",
        institution_name: "",
      });
    }
  }, [open, form]);

  const onSubmit = (values: AccountFormValues) => {
    createAccount(
      {
        name: values.name,
        type: values.type,
        subtype: values.subtype || null,
        current_balance: values.current_balance
          ? parseFloat(values.current_balance)
          : null,
        institution_name: values.institution_name || null,
        is_manual: true,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Account</DialogTitle>
          <DialogDescription>
            Add an account to track manually. You can add transactions to this
            account later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., My Checking Account"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value: AccountFormValues["type"]) =>
                form.setValue("type", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="depository">Bank Account</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subtype */}
          <div className="space-y-2">
            <Label htmlFor="subtype">Account Subtype</Label>
            <Select
              value={form.watch("subtype")}
              onValueChange={(value) => form.setValue("subtype", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subtype (optional)" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_SUBTYPES[selectedType]?.map((subtype) => (
                  <SelectItem key={subtype} value={subtype}>
                    {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <Label htmlFor="current_balance">Current Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                {...form.register("current_balance")}
              />
            </div>
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution_name">Institution (optional)</Label>
            <Input
              id="institution_name"
              placeholder="e.g., Chase, Bank of America"
              {...form.register("institution_name")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
