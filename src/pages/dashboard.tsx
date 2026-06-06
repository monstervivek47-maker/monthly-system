import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAttendance, AttendanceRecord } from "@/hooks/use-attendance";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isThisMonth, parseISO } from "date-fns";
import { IndianRupee, Calendar as CalendarIcon, Clock, MapPin, Trash2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

const recordSchema = z.object({
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().min(1, "End date is required"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
  rate: z.coerce.number().min(1, "Rate must be greater than 0"),
  notes: z.string().optional(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

function RecordForm({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues: RecordFormValues;
  onSubmit: (data: RecordFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Date From</Label>
          <Input type="date" id="dateFrom" {...form.register("dateFrom")} />
          {form.formState.errors.dateFrom && <p className="text-xs text-destructive">{form.formState.errors.dateFrom.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">Date To</Label>
          <Input type="date" id="dateTo" {...form.register("dateTo")} />
          {form.formState.errors.dateTo && <p className="text-xs text-destructive">{form.formState.errors.dateTo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromLocation">From Location</Label>
          <Input id="fromLocation" placeholder="e.g. Mumbai" {...form.register("fromLocation")} />
          {form.formState.errors.fromLocation && <p className="text-xs text-destructive">{form.formState.errors.fromLocation.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="toLocation">To Location</Label>
          <Input id="toLocation" placeholder="e.g. Pune" {...form.register("toLocation")} />
          {form.formState.errors.toLocation && <p className="text-xs text-destructive">{form.formState.errors.toLocation.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate">Daily Rate (₹)</Label>
        <Input type="number" id="rate" placeholder="e.g. 500" {...form.register("rate")} />
        {form.formState.errors.rate && <p className="text-xs text-destructive">{form.formState.errors.rate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" placeholder="e.g. Overtime on Saturday" {...form.register("notes")} />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}

export default function Dashboard() {
  const { isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { records, addRecord, editRecord, deleteRecord } = useAttendance();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (!isLoggedIn) setLocation("/login");
  }, [isLoggedIn, setLocation]);

  const handleAdd = (data: RecordFormValues) => {
    addRecord(data);
    setIsAddOpen(false);
  };

  const handleEdit = (data: RecordFormValues) => {
    if (!editingRecord) return;
    editRecord(editingRecord.id, data);
    setEditingRecord(null);
  };

  const thisMonthRecords = records.filter(r => isThisMonth(parseISO(r.dateFrom)));
  const currentMonthTotal = thisMonthRecords.reduce((sum, r) => sum + r.total, 0);
  const currentMonthDays = thisMonthRecords.reduce((sum, r) => sum + r.days, 0);

  if (!isLoggedIn) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your daily vouchers and earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm font-medium flex items-center gap-2">
              <CalendarIcon size={16} /> Current Month Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{currentMonthDays} <span className="text-xl font-normal text-primary-foreground/70">days</span></div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <IndianRupee size={16} /> Current Month Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">₹{currentMonthTotal.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Vouchers</h2>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-record">
              <Plus size={16} className="mr-2" /> Add Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>New Voucher Entry</DialogTitle>
            </DialogHeader>
            <RecordForm
              defaultValues={{
                dateFrom: format(new Date(), "yyyy-MM-dd"),
                dateTo: format(new Date(), "yyyy-MM-dd"),
                fromLocation: "",
                toLocation: "",
                rate: 0,
                notes: "",
              }}
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => { if (!open) setEditingRecord(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Voucher Entry</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <RecordForm
              defaultValues={{
                dateFrom: editingRecord.dateFrom,
                dateTo: editingRecord.dateTo,
                fromLocation: editingRecord.fromLocation || "",
                toLocation: editingRecord.toLocation || "",
                rate: editingRecord.rate,
                notes: editingRecord.notes || "",
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditingRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border" data-testid="empty-state">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No vouchers yet</h3>
            <p className="text-muted-foreground mt-1 mb-4 text-sm">Start logging your attendance to see your earnings.</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add your first voucher</Button>
          </div>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="overflow-hidden transition-all hover:shadow-md" data-testid={`record-card-${record.id}`}>
              <div className="flex flex-col sm:flex-row border-l-4 border-primary">
                <div className="p-4 sm:p-5 flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Date</p>
                    <p className="font-medium text-sm">
                      {record.dateFrom === record.dateTo
                        ? format(parseISO(record.dateFrom), "MMM d, yyyy")
                        : `${format(parseISO(record.dateFrom), "MMM d")} – ${format(parseISO(record.dateTo), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Route</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <MapPin size={12} className="text-muted-foreground shrink-0" />
                      {record.fromLocation || "—"} → {record.toLocation || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Days</p>
                    <p className="font-medium">{record.days}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Rate</p>
                    <p className="font-medium">₹{record.rate.toLocaleString("en-IN")}/day</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total</p>
                    <p className="font-bold text-primary">₹{record.total.toLocaleString("en-IN")}</p>
                  </div>
                  {record.notes && (
                    <div className="col-span-full mt-1 pt-2 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">{record.notes}</p>
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 p-4 sm:p-5 flex items-center gap-2 justify-end sm:border-l border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setEditingRecord(record)}
                    data-testid={`button-edit-${record.id}`}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteRecord(record.id)}
                    data-testid={`button-delete-${record.id}`}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
