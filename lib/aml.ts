export type AmlContext = {
  fromWalletId: string;
  fromUserId: string;
  amount: number;
  currency: string;
  recentTxCount24h: number;
  recentTxSum24h: number;
};

export type AmlFlag = {
  rule: string;
  severity: "low" | "medium" | "high";
  reason: string;
};

const HIGH_VALUE_THRESHOLD: Record<string, number> = {
  USD: 10_000,
  AED: 36_000,
  INR: 800_000,
};

const VELOCITY_TX_COUNT = 10;
const VELOCITY_AMOUNT: Record<string, number> = {
  USD: 5_000,
  AED: 18_000,
  INR: 400_000,
};

export function runAmlChecks(ctx: AmlContext): AmlFlag[] {
  const flags: AmlFlag[] = [];

  const threshold = HIGH_VALUE_THRESHOLD[ctx.currency];
  if (threshold && ctx.amount >= threshold) {
    flags.push({
      rule: "amount_over_threshold",
      severity: "high",
      reason: `Single tx ${ctx.amount} ${ctx.currency} exceeds threshold ${threshold} ${ctx.currency}`,
    });
  }

  if (ctx.recentTxCount24h >= VELOCITY_TX_COUNT) {
    flags.push({
      rule: "velocity_count",
      severity: "medium",
      reason: `${ctx.recentTxCount24h} transactions in last 24h`,
    });
  }

  const velocityCap = VELOCITY_AMOUNT[ctx.currency];
  if (velocityCap && ctx.recentTxSum24h + ctx.amount > velocityCap) {
    flags.push({
      rule: "velocity_amount",
      severity: "medium",
      reason: `24h volume ${ctx.recentTxSum24h + ctx.amount} ${ctx.currency} exceeds ${velocityCap} ${ctx.currency}`,
    });
  }

  return flags;
}

export function shouldBlock(flags: AmlFlag[]): boolean {
  return flags.some((f) => f.severity === "high");
}
