"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditStatus = "pending" | "approved" | "rejected";
type AuditFilter = "pending" | "approved" | "all";

export type AdminAuditRecord = {
  key: string;
  status: AuditStatus;
  cells: ReactNode[];
};

export function AdminAuditQueue({
  title,
  headers,
  records,
  allLabel,
}: {
  title: string;
  headers: string[];
  records: AdminAuditRecord[];
  allLabel: string;
}) {
  const [filter, setFilter] = useState<AuditFilter>("pending");
  const visibleRecords = records.filter(
    (record) => filter === "all" || record.status === filter,
  );
  const options: { value: AuditFilter; label: string; count: number }[] = [
    {
      value: "pending",
      label: "待审核",
      count: records.filter((record) => record.status === "pending").length,
    },
    {
      value: "approved",
      label: "已通过",
      count: records.filter((record) => record.status === "approved").length,
    },
    { value: "all", label: allLabel, count: records.length },
  ];

  return (
    <Card className="overflow-hidden border-primary/15">
      <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary">AUDIT QUEUE</p>
          <CardTitle>{title}</CardTitle>
        </div>
        <div
          role="group"
          aria-label={`${title}筛选`}
          className="flex w-fit flex-wrap gap-1 rounded-lg border border-primary/15 bg-white/65 p-1 shadow-xs"
        >
          {options.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={filter === option.value ? "secondary" : "ghost"}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
              <Badge variant="outline" className="nums">
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="label-mono text-[10px]">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRecords.length ? (
                visibleRecords.map((record) => (
                  <TableRow key={record.key}>
                    {record.cells.map((cell, index) => (
                      <TableCell key={index}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={headers.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    当前筛选下暂无记录。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
