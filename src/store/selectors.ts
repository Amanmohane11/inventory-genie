import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import {
  startOfWeek, endOfWeek, startOfMonth, startOfYear, format,
  eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval,
  subYears, endOfYear,
} from "date-fns";

export type Range = "weekly" | "monthly" | "yearly";

const lineTotal = (price: number, qty: number, discount = 0) => price * qty - discount;

export const selectBills = (s: RootState) => s.bills.bills;
export const selectExpenses = (s: RootState) => s.expenses.expenses;
export const selectItems = (s: RootState) => s.items.items;

export const makeSelectTotals = (range: Range) =>
  createSelector([selectBills, selectExpenses], (bills, expenses) => {
    const from =
      range === "weekly" ? startOfWeek(new Date()) :
      range === "monthly" ? startOfMonth(new Date()) :
      startOfYear(new Date());

    const inRange = <T extends { date: string }>(arr: T[]) =>
      arr.filter(x => new Date(x.date) >= from);

    const sales = inRange(bills.filter(b => b.type === "sales"));
    const purchase = inRange(bills.filter(b => b.type === "purchase"));
    const exp = inRange(expenses);

    const totalSales = sales.reduce(
      (sum, b) => sum + b.items.reduce((s, i) => s + lineTotal(i.price, i.qty, i.discount), 0),
      0
    );
    const totalPurchase = purchase.reduce(
      (sum, b) => sum + b.items.reduce((s, i) => s + lineTotal(i.price, i.qty, i.discount), 0),
      0
    );
    const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);
    // Profit excludes GST — we already use base prices (price excl GST).
    const netProfit = totalSales - totalPurchase - totalExpenses;
    const paymentsReceived = sales
      .filter(b => b.paid)
      .reduce(
        (sum, b) => sum + b.items.reduce((s, i) => s + lineTotal(i.price, i.qty, i.discount), 0),
        0
      );

    return { totalSales, totalPurchase, totalExpenses, netProfit, paymentsReceived };
  });

export const makeSelectChart = (range: Range) =>
  createSelector([selectBills, selectExpenses], (bills, expenses) => {
    const now = new Date();
    let buckets: { key: string; label: string }[];
    let bucketOf: (d: Date) => string;

    if (range === "weekly") {
      // Current week, Monday → Sunday
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });
      buckets = days.map(d => ({ key: format(d, "yyyy-MM-dd"), label: format(d, "EEE") }));
      bucketOf = (d) => format(d, "yyyy-MM-dd");
    } else if (range === "monthly") {
      // Current year, Jan → Dec (months only, never days)
      const start = startOfYear(now);
      const end = endOfYear(now);
      const months = eachMonthOfInterval({ start, end });
      buckets = months.map(d => ({ key: format(d, "yyyy-MM"), label: format(d, "MMM") }));
      bucketOf = (d) => format(d, "yyyy-MM");
    } else {
      // Last 5 years (oldest → current)
      const start = startOfYear(subYears(now, 4));
      const end = endOfYear(now);
      const years = eachYearOfInterval({ start, end });
      buckets = years.map(d => ({ key: format(d, "yyyy"), label: format(d, "yyyy") }));
      bucketOf = (d) => format(d, "yyyy");
    }

    const map: Record<string, { sales: number; purchase: number; expenses: number }> = {};
    buckets.forEach(b => { map[b.key] = { sales: 0, purchase: 0, expenses: 0 }; });

    bills.forEach(b => {
      const k = bucketOf(new Date(b.date));
      if (!map[k]) return;
      const total = b.items.reduce((s, i) => s + lineTotal(i.price, i.qty, i.discount), 0);
      if (b.type === "sales") map[k].sales += total;
      if (b.type === "purchase") map[k].purchase += total;
    });
    expenses.forEach(e => {
      const k = bucketOf(new Date(e.date));
      if (map[k]) map[k].expenses += e.amount;
    });

    return buckets.map(b => {
      const sales = Math.round(map[b.key].sales);
      const purchase = Math.round(map[b.key].purchase);
      const expenses = Math.round(map[b.key].expenses);
      const net = sales - purchase - expenses;
      return {
        label: b.label,
        sales,
        profit: net >= 0 ? net : 0,
        loss: net < 0 ? -net : 0,
        net,
      };
    });
  });

export const makeSelectProductInsights = (range: Range) =>
  createSelector([selectBills, selectItems], (bills, items) => {
    const from =
      range === "weekly" ? startOfWeek(new Date()) :
      range === "monthly" ? startOfMonth(new Date()) :
      startOfYear(new Date());

    const sold: Record<string, number> = {};
    items.forEach(i => { sold[i.id] = 0; });
    bills
      .filter(b => b.type === "sales" && new Date(b.date) >= from)
      .forEach(b => b.items.forEach(li => { sold[li.itemId] = (sold[li.itemId] ?? 0) + li.qty; }));

    const rows = items.map(i => ({
      id: i.id, name: i.name, category: i.category, stock: i.stock, qtySold: sold[i.id] ?? 0,
    }));
    const top = [...rows].sort((a, b) => b.qtySold - a.qtySold).slice(0, 5);
    const low = [...rows].sort((a, b) => a.qtySold - b.qtySold).slice(0, 5);
    return { top, low };
  });
