"use client";

import { useState } from "react";
import { Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ExportDialogProps {
  siteId: string;
  forms?: Array<{ formId: string; formName: string }>;
  totalSubmissions: number;
}

export function ExportDialog({ siteId, forms, totalSubmissions }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formFilter, setFormFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = async () => {
    if (totalSubmissions === 0) {
      toast.error("No submissions to export");
      return;
    }

    setExporting(true);

    try {
      // Build export URL with filters
      const params = new URLSearchParams({ siteId });
      
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (formFilter !== "all") {
        params.set("formId", formFilter);
      }
      if (startDate) {
        params.set("startDate", new Date(startDate).toISOString());
      }
      if (endDate) {
        params.set("endDate", new Date(endDate).toISOString());
      }

      // Trigger download
      window.open(`/api/forms/export?${params.toString()}`, "_blank");
      toast.success("Export started - check your downloads");
      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export submissions");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    setStatusFilter("all");
    setFormFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={totalSubmissions === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Submissions</DialogTitle>
          <DialogDescription>
            Download your form submissions as a CSV file. Apply filters to export
            specific submissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form Filter */}
          {forms && forms.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="formFilter">Form</Label>
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger id="formFilter">
                  <SelectValue placeholder="All forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form.formId} value={form.formId}>
                      {form.formName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
            <p>
              The CSV file will include all form fields, submission date, status,
              and page URL.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleReset} type="button">
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
