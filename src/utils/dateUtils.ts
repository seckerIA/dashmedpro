
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Parses a date string (YYYY-MM-DD or ISO) into a local Date object, 
 * avoiding timezone shifts that native new Date(string) cause.
 */
export const parseLocalDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date();

    // If it's just a YYYY-MM-DD string
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // If it looks like an ISO string but has no time, or is already a date object
    return parseISO(dateStr);
};

/**
 * Formats a date string for display in dd/MM/yyyy format, ensuring local time.
 */
export const formatDisplayDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "-";
    return format(parseLocalDate(dateStr), "dd/MM/yyyy", { locale: ptBR });
};

/**
 * Returns today's date as a YYYY-MM-DD string in LOCAL time.
 */
export const getLocalTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Prepares a date string for the DatePicker component (adding noon time to avoid shift)
 */
export const prepareForDatePicker = (dateStr: string | null | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};
