import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAttendance } from "@/hooks/use-attendance";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MonthlyVoucher() {
  const { isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { records } = useAttendance();
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    if (!isLoggedIn) setLocation("/login");
  }, [isLoggedIn, setLocation]);

  if (!isLoggedIn) return null;

  const availableMonths = Array.from(new Set([
    format(new Date(), "yyyy-MM"),
    ...records.map(r => format(parseISO(r.dateFrom), "yyyy-MM")),
  ])).sort().reverse();

  const filteredRecords = records.filter(r =>
    format(parseISO(r.dateFrom), "yyyy-MM") === selectedMonth,
  );

  const totalDays = filteredRecords.reduce((sum, r) => sum + r.days, 0);
  const totalEarnings = filteredRecords.reduce((sum, r) => sum + r.total, 0);
  const monthLabel = format(parseISO(`${selectedMonth}-01`), "MMMM yyyy");

  const exportExcel = () => {
    const data = filteredRecords.map(r => ({
      "Date From": format(parseISO(r.dateFrom), "dd/MM/yyyy"),
      "Date To": format(parseISO(r.dateTo), "dd/MM/yyyy"),
      "From Location": r.fromLocation || "",
      "To Location": r.toLocation || "",
      "Days": r.days,
      "Rate (₹)": r.rate,
      "Total (₹)": r.total,
      "Notes": r.notes || "",
    }));

    // Total row
    data.push({
      "Date From": "",
      "Date To": "",
      "From Location": "",
      "To Location": "TOTAL",
      "Days": totalDays,
      "Rate (₹)": 0,
      "Total (₹)": totalEarnings,
      "Notes": "",
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
      { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Voucher");
    XLSX.writeFile(wb, `Monthly_Voucher_${selectedMonth}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(20);
    doc.setTextColor(13, 116, 127);
    doc.text("Monthly Voucher", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Month: ${monthLabel}`, 14, 30);
    doc.text(`Total Days: ${totalDays}`, 14, 37);
    doc.text(`Total Amount: Rs. ${totalEarnings.toLocaleString("en-IN")}`, 14, 44);

    const tableData = filteredRecords.map(r => [
      format(parseISO(r.dateFrom), "dd/MM/yyyy"),
      format(parseISO(r.dateTo), "dd/MM/yyyy"),
      r.fromLocation || "-",
      r.toLocation || "-",
      r.days.toString(),
      `Rs. ${r.rate.toLocaleString("en-IN")}`,
      `Rs. ${r.total.toLocaleString("en-IN")}`,
      r.notes || "-",
    ]);

    // Total row
    tableData.push(["", "", "", "TOTAL", totalDays.toString(), "", `Rs. ${totalEarnings.toLocaleString("en-IN")}`, ""]);

    autoTable(doc, {
      startY: 52,
      head: [["Date From", "Date To", "From", "To", "Days", "Rate", "Total (₹)", "Notes"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [13, 116, 127], textColor: 255, fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [217, 234, 211];
          data.cell.styles.textColor = [20, 80, 20];
        }
      },
      columnStyles: {
        4: { halign: "center" },
        5: { halign: "right" },
        6: { halign: "right" },
      },
    });

    doc.save(`Monthly_Voucher_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Voucher</h1>
          <p className="text-muted-foreground mt-1">View and export your monthly voucher records.</p>
        </div>

        <div className="flex items-center gap-2 bg-card p-2 rounded-md border border-border shadow-sm">
          <CalendarIcon size={18} className="text-muted-foreground ml-2" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px] border-none shadow-none bg-transparent" data-testid="select-month">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {format(parseISO(`${month}-01`), "MMMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-days">{totalDays}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-total-earnings">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md overflow-hidden border-border/50">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
          <h3 className="font-semibold text-lg">{monthLabel} — Voucher Details</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={filteredRecords.length === 0} data-testid="button-export-excel">
              <FileSpreadsheet size={16} className="mr-2 text-green-600" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={filteredRecords.length === 0} data-testid="button-export-pdf">
              <FileText size={16} className="mr-2 text-red-600" /> PDF
            </Button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No vouchers found for the selected month.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date Range</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} data-testid={`table-row-${record.id}`}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {record.dateFrom === record.dateTo
                        ? format(parseISO(record.dateFrom), "dd MMM yyyy")
                        : `${format(parseISO(record.dateFrom), "dd MMM")} – ${format(parseISO(record.dateTo), "dd MMM yyyy")}`}
                    </TableCell>
                    <TableCell className="text-sm">{record.fromLocation || "—"}</TableCell>
                    <TableCell className="text-sm">{record.toLocation || "—"}</TableCell>
                    <TableCell className="text-right">{record.days}</TableCell>
                    <TableCell className="text-right">₹{record.rate.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-bold text-primary">₹{record.total.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate" title={record.notes}>
                      {record.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                  <TableCell colSpan={3} className="text-primary font-bold">Total</TableCell>
                  <TableCell className="text-right text-primary">{totalDays}</TableCell>
                  <TableCell />
                  <TableCell className="text-right text-primary text-base">₹{totalEarnings.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="hidden md:table-cell" />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
