import { useState, useEffect, useCallback } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";

export interface AttendanceRecord {
  id: string;
  dateFrom: string;
  dateTo: string;
  fromLocation: string;
  toLocation: string;
  days: number;
  rate: number;
  total: number;
  notes?: string;
  createdAt: string;
}

function sendEmailNotification(record: AttendanceRecord) {
  console.info("Attendance record saved locally:", record);
}

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("attendance_records");
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse attendance records", error);
      }
    }
  }, []);

  const addRecord = useCallback(
    async (record: Omit<AttendanceRecord, "id" | "createdAt" | "days" | "total">) => {
      const days = Math.max(
        1,
        differenceInCalendarDays(parseISO(record.dateTo), parseISO(record.dateFrom)) + 1,
      );
      const total = days * record.rate;

      const newRecord: AttendanceRecord = {
        ...record,
        id: crypto.randomUUID(),
        days,
        total,
        createdAt: new Date().toISOString(),
      };

      setRecords((previousRecords) => {
        const updated = [newRecord, ...previousRecords];
        localStorage.setItem("attendance_records", JSON.stringify(updated));
        return updated;
      });

      sendEmailNotification(newRecord);

      return newRecord;
    },
    [],
  );

  const editRecord = useCallback(
    (id: string, updates: Omit<AttendanceRecord, "id" | "createdAt" | "days" | "total">) => {
      const days = Math.max(
        1,
        differenceInCalendarDays(parseISO(updates.dateTo), parseISO(updates.dateFrom)) + 1,
      );
      const total = days * updates.rate;

      setRecords((previousRecords) => {
        const updated = previousRecords.map((record) =>
          record.id === id ? { ...record, ...updates, days, total } : record,
        );
        localStorage.setItem("attendance_records", JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  const deleteRecord = useCallback((id: string) => {
    setRecords((previousRecords) => {
      const updated = previousRecords.filter((record) => record.id !== id);
      localStorage.setItem("attendance_records", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { records, addRecord, editRecord, deleteRecord };
}
