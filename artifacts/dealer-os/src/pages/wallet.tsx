import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetWallet, getGetWalletQueryKey,
  useListTransactions, getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import type { WalletTransaction } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Wallet, ArrowUpRight, ArrowDownLeft, Megaphone,
  CreditCard, UserCheck, RotateCcw, SlidersHorizontal,
} from "lucide-react";

const DEBIT_TYPES = new Set(["boost_charge", "lead_charge", "subscription_charge"]);
const CREDIT_TYPES = new Set(["wallet_topup", "refund"]);

const TYPE_META: Record<string, { label: string; icon: any }> = {
  wallet_topup: { label: "Top-up", icon: ArrowDownLeft },
  boost_charge: { label: "Boost", icon: Megaphone },
  subscription_charge: { label: "Subscription", icon: CreditCard },
  lead_charge: { label: "Lead (CPL)", icon: UserCheck },
  refund: { label: "Refund", icon: RotateCcw },
  adjustment: { label: "Adjustment", icon: SlidersHorizontal },
};

function fmtMoney(value: string | number, withDecimals = true): string {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!isFinite(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function amountDisplay(tx: WalletTransaction): { text: string; className: string } {
  const n = parseFloat(tx.amount);
  const abs = Math.abs(isFinite(n) ? n : 0);
  if (DEBIT_TYPES.has(tx.type)) {
    return { text: `− ${fmtMoney(abs)} EGP`, className: "text-red-400" };
  }
  if (CREDIT_TYPES.has(tx.type)) {
    return { text: `+ ${fmtMoney(abs)} EGP`, className: "text-green-400" };
  }
  // adjustment — sign follows the numeric value
  const negative = n < 0;
  return {
    text: `${negative ? "−" : "+"} ${fmtMoney(abs)} EGP`,
    className: negative ? "text-red-400" : "text-green-400",
  };
}

export default function WalletPage() {
  const { user } = useClerk();

  const { data: walletData, isLoading: walletLoading } = useGetWallet({
    query: { enabled: !!user, queryKey: getGetWalletQueryKey() },
  });

  const { data: txData, isLoading: txLoading } = useListTransactions(
    { limit: 50 },
    { query: { enabled: !!user, queryKey: getListTransactionsQueryKey({ limit: 50 }) } },
  );

  const balance = walletData?.data?.balance;
  const currency = walletData?.data?.currency ?? "EGP";
  const transactions = txData?.data ?? [];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Wallet &amp; Billing</h1>
          <p className="text-muted-foreground mt-2">Your balance and lead, boost &amp; subscription charges.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-card-border md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <div className="flex items-baseline gap-2" data-testid="wallet-balance">
                  <span className="text-3xl font-bold text-foreground">{fmtMoney(balance ?? "0")}</span>
                  <span className="text-sm text-muted-foreground">{currency}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-right">Balance After</TableHead>
                    <TableHead className="text-muted-foreground text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : transactions.length ? (
                    transactions.map((tx) => {
                      const meta = TYPE_META[tx.type] ?? { label: tx.type, icon: ArrowUpRight };
                      const Icon = meta.icon;
                      const amount = amountDisplay(tx);
                      return (
                        <TableRow key={tx.id} className="border-border hover:bg-muted/50" data-testid={`tx-${tx.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <Badge variant="outline" className="border-white/10 text-foreground">{meta.label}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                            {tx.description || "—"}
                          </TableCell>
                          <TableCell className={`text-sm font-medium text-right ${amount.className}`}>
                            {amount.text}
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">
                            {fmtMoney(tx.balance_after)} {currency}
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
