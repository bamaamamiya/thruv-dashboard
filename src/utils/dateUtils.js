// utils/dateUtils.js
import dayjs from "dayjs";

/**
 * Format tanggal ke string YYYY-MM-DD
 */
export const formatDate = (date) => dayjs(date).format("YYYY-MM-DD");

/**
 * Filter tanggal di datepicker supaya tanggal yang sudah ada di leads tidak bisa dipilih
 */
export const filterDateNotInLeads = (date, leads) => {
  const formatted = dayjs(date).format("YYYY-MM-DD");
  return !leads.some((lead) => lead.date === formatted);
};
