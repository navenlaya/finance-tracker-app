"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Transaction, Account } from "@/types";
import { DEFAULT_CATEGORIES, cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";

const transactionFormSchema = z.object({
  account_id: z.string().min(1, "Please select an account"),
  date: z.date({ required_error: "Please select a date" }),
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().optional(),
  note: z.string().optional(),
  isIncome: z.boolean(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  transaction?: Transaction | null;
}

export function TransactionDialog({
  open,
  onOpenChange,
  accounts,
  transaction,
}: TransactionDialogProps) {
  const isEditing = !!transaction;

  const { mutate: createTransaction, isPending: isCreating } = useCreateTransaction();
  const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();

  const isPending = isCreating || isUpdating;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      account_id: "",
      date: new Date(),
      name: "",
      amount: "",
      category: "",
      note: "",
      isIncome: false,
    },
  });

  // Reset form when dialog opens/closes or transaction changes
  React.useEffect(() => {
    if (open) {
      if (transaction) {
        form.reset({
          account_id: transaction.account_id,
          date: new Date(transaction.date),
          name: transaction.name,
          amount: Math.abs(transaction.amount).toString(),
          category: transaction.category || "",
          note: transaction.note || "",
          isIncome: transaction.amount < 0,
        });
      } else {
        form.reset({
          account_id: accounts[0]?.id || "",
          date: new Date(),
          name: "",
          amount: "",
          category: "",
          note: "",
          isIncome: false,
        });
      }
    }
  }, [open, transaction, accounts, form]);

  const onSubmit = (values: TransactionFormValues) => {
    const amount = parseFloat(values.amount);
    const finalAmount = values.isIncome ? -Math.abs(amount) : Math.abs(amount);

    const data = {
      account_id: values.account_id,
      date: format(values.date, "yyyy-MM-dd"),
      name: values.name,
      amount: finalAmount,
      category: values.category || null,
      note: values.note || null,
      is_manual: true,
    };

    if (isEditing && transaction) {
      updateTransaction(
        { id: transaction.id, ...data },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createTransaction(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the transaction details below."
              : "Add a new manual transaction to your account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!form.watch("isIncome") ? "default" : "outline"}
              className="flex-1"
              onClick={() => form.setValue("isIncome", false)}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={form.watch("isIncome") ? "default" : "outline"}
              className="flex-1"
              onClick={() => form.setValue("isIncome", true)}
            >
              Income
            </Button>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select
              value={form.watch("account_id")}
              onValueChange={(value) => form.setValue("account_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.account_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.account_id.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("date") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("date")
                    ? format(form.watch("date"), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("date")}
                  onSelect={(date) => date && form.setValue("date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              placeholder="e.g., Coffee at Starbucks"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                {...form.register("amount")}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note..."
              {...form.register("note")}
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
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                ? "Save Changes"
                : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
