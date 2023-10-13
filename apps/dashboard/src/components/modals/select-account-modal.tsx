"use client";

import { getAccessToken, getAccounts } from "@/actions/gocardless";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Skeleton } from "@midday/ui/skeleton";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  accounts: z.array(z.string()).refine((value) => value.some((item) => item)),
});

function RowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[210px]" />
          <Skeleton className="h-2.5 w-[180px]" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[250px]" />
          <Skeleton className="h-2.5 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

export default function ConnectBankModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accounts: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  useEffect(() => {
    async function fetchData() {
      const { access } = await getAccessToken();
      const accounts = await getAccounts({
        token: access,
        id: searchParams.get("ref"),
      });

      setAccounts(accounts);

      setLoading(false);
      // Set default accounts to checked
      form.reset({ accounts: accounts.map((account) => account.id) });
    }

    fetchData();
  }, []);

  return (
    <Dialog defaultOpen onOpenChange={() => router.push(pathname)}>
      <DialogContent>
        <DialogHeader className="mb-8">
          <DialogTitle>Select accounts</DialogTitle>
          <DialogDescription>
            Select the accounts you want to sync with Midday.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {loading && <RowsSkeleton />}

            {accounts.map((account) => (
              <FormField
                key={account.id}
                control={form.control}
                name="accounts"
                render={({ field }) => {
                  const formattedAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: account.balances.available.currency,
                  }).format(account.balances.available.amount);

                  return (
                    <FormItem key={account.id} className="flex justify-between">
                      <FormLabel className="flex items-between">
                        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                          <AvatarImage
                            src={account.bank.logo}
                            alt={account.bank.name}
                          />
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none mb-1">
                            {account.iban}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {account.bank.name} - {formattedAmount}
                          </p>
                        </div>
                      </FormLabel>

                      <div>
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(account.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, account.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== account.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  );
                }}
              />
            ))}

            <div className="pt-4">
              <Button className="w-full" type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}