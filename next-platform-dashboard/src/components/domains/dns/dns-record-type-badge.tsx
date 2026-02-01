"use client";

import { Badge } from "@/components/ui/badge";

export type DnsRecordType = 
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'TXT'
  | 'NS'
  | 'SRV'
  | 'CAA'
  | 'PTR'
  | 'SPF';

const TYPE_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  AAAA: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  CNAME: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MX: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TXT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  NS: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  SRV: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  CAA: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  PTR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  SPF: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface DnsRecordTypeBadgeProps {
  type: string;
}

export function DnsRecordTypeBadge({ type }: DnsRecordTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={`font-mono ${TYPE_COLORS[type] || ""}`}>
      {type}
    </Badge>
  );
}
