import { Clock, FolderOpen } from "lucide-react";

import { BackToHome } from "@/components/clinic/back-to-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HistoryPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="border border-clinic-blue/30 bg-clinic-surface shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-card text-foreground ring-1 ring-border">
            <FolderOpen className="size-6" aria-hidden />
            <Clock
              className="absolute -bottom-0.5 -right-0.5 size-4 text-clinic-blue"
              aria-hidden
            />
          </span>
          <CardTitle className="text-lg text-foreground">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-semibold text-foreground">
            Previous appointment schedule
          </h3>
          <p className="text-sm text-muted-foreground">
            Completed and past clinic visits appear below with date, reason, and
            outcome.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    <p className="font-medium text-foreground">No data yet</p>
                    <p className="mt-1">
                      Past visits will show here after your appointments are
                      completed.
                    </p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <BackToHome />
    </div>
  );
}
