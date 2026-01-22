import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { FinancialAccount } from "@/types/financial";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { formatCurrency } from "@/lib/currency";

export const useFinancialController = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab") || "dashboard";

    // -- State --
    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
    const [showRequirementModal, setShowRequirementModal] = useState(false);
    const [isDistributionConfigOpen, setIsDistributionConfigOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

    // -- Hooks Integration --
    const userProfile = useUserProfile();
    const { isAdmin, isVendedor, isGestorTrafego, isSecretaria } = userProfile;

    const metricsData = useFinancialMetrics({
        startDate: dateRange?.from,
        endDate: dateRange?.to,
    });

    const accountsData = useFinancialAccounts();
    const { transactions } = useFinancialTransactions();

    // -- Effects --
    useEffect(() => {
        if (tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    // Check for required implementation (bank account)
    useEffect(() => {
        if (!accountsData.isLoading && accountsData.accounts && accountsData.accounts.length === 0) {
            setShowRequirementModal(true);
        }
    }, [accountsData.accounts, accountsData.isLoading]);

    // -- Handlers --
    const handleTabChange = (nextTab: string) => {
        setActiveTab(nextTab);
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("tab", nextTab);
            return params;
        });
    };

    const handleExport = () => {
        const headers = ["Data", "Descrição", "Categoria", "Valor", "Tipo", "Status"];
        const rows = transactions?.map(t => [
            format(new Date(t.transaction_date), 'dd/MM/yyyy'),
            t.description,
            t.category?.name || '-',
            formatCurrency(t.amount),
            t.type,
            t.status
        ]) || [];

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `financeiro_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteConfirm = () => {
        if (accountToDelete) {
            accountsData.deleteAccount(accountToDelete);
            setAccountToDelete(null);
        }
    };

    // -- Logic for Recent Transactions --
    const recentTransactions = transactions?.slice(0, 5) || [];

    return {
        state: {
            activeTab,
            dateRange,
            isAccountFormOpen,
            showRequirementModal,
            isDistributionConfigOpen,
            editingAccount,
            accountToDelete,
            recentTransactions
        },
        setters: {
            setActiveTab,
            setDateRange,
            setIsAccountFormOpen,
            setShowRequirementModal,
            setIsDistributionConfigOpen,
            setEditingAccount,
            setAccountToDelete
        },
        hooks: {
            userProfile,
            metricsData,
            accountsData,
            transactionsData: { transactions }
        },
        actions: {
            handleTabChange,
            handleExport,
            handleDeleteConfirm,
            navigate
        }
    };
};
