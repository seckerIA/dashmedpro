module.exports = [
"[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useUserProfile.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUserProfile",
    ()=>useUserProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-ssr] (ecmascript)");
;
;
function useUserProfile() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'user'
        ],
        queryFn: async ()=>{
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60
    });
    const { data: profile, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'profile',
            user?.id
        ],
        queryFn: async ()=>{
            if (!user?.id) return null;
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            return data;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60
    });
    const isSecretaria = profile?.role === 'secretaria';
    const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';
    const isMedico = profile?.role === 'medico';
    const isVendedor = profile?.role === 'vendedor';
    return {
        user,
        profile,
        isLoading,
        isSecretaria,
        isAdmin,
        isMedico,
        isVendedor
    };
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useAuth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
;
function useAuth() {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session)=>{
            setUser(session?.user ?? null);
            setLoading(false);
        });
        // Initial check
        const checkUser = async ()=>{
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        checkUser();
        return ()=>subscription.unsubscribe();
    }, [
        supabase
    ]);
    return {
        user,
        loading,
        signOut: ()=>supabase.auth.signOut()
    };
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useSecretaryDoctors.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSecretaryDoctorLinks",
    ()=>useSecretaryDoctorLinks,
    "useSecretaryDoctors",
    ()=>useSecretaryDoctors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useUserProfile.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const EMPTY_ARRAY = [];
function useSecretaryDoctors() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    const { user, isSecretaria, isLoading: isLoadingProfile, profile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUserProfile"])();
    const { data, isLoading, error, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'secretary-doctors',
            user?.id
        ],
        queryFn: async ()=>{
            if (!user?.id) return {
                doctorIds: [],
                doctors: []
            };
            // 1. Fetch link IDs
            const { data: links, error: linkError } = await supabase.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', user.id);
            if (linkError) {
                console.error('[useSecretaryDoctors] Error fetching links:', linkError);
                return {
                    doctorIds: [],
                    doctors: []
                };
            }
            if (!links || links.length === 0) {
                console.warn('[useSecretaryDoctors] No links found for secretary:', user.id);
                return {
                    doctorIds: [],
                    doctors: []
                };
            }
            const doctorIds = links.map((l)=>l.doctor_id);
            // 2. Fetch doctor profiles
            const { data: doctorsData, error: profileError } = await supabase.from('profiles').select('id, full_name, email').in('id', doctorIds);
            if (profileError) {
                console.error('[useSecretaryDoctors] Error fetching profiles:', profileError);
                return {
                    doctorIds,
                    doctors: []
                };
            }
            const doctors = (doctorsData || []).map((doc)=>({
                    id: doc.id,
                    full_name: doc.full_name,
                    email: doc.email
                }));
            return {
                doctorIds,
                doctors
            };
        },
        enabled: !!user?.id && !isLoadingProfile && isSecretaria,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
    return {
        doctorIds: data?.doctorIds || EMPTY_ARRAY,
        doctors: data?.doctors || [],
        isLoading: isLoading && isSecretaria || isLoadingProfile,
        error,
        refetch,
        isDoctorLinked: (doctorId)=>data?.doctorIds.includes(doctorId) || false
    };
}
function useSecretaryDoctorLinks() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    const { user, isAdmin, profile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUserProfile"])();
    const { data: allLinks, isLoading, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'all-secretary-doctor-links'
        ],
        queryFn: async ()=>{
            const { data, error } = await supabase.from('secretary_doctor_links').select(`
                    id,
                    secretary_id,
                    doctor_id,
                    created_at,
                    secretary:profiles!secretary_doctor_links_secretary_id_fkey (
                        id,
                        full_name,
                        email
                    ),
                    doctor:profiles!secretary_doctor_links_doctor_id_fkey (
                        id,
                        full_name,
                        email
                    )
                `);
            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id && isAdmin,
        staleTime: 2 * 60 * 1000
    });
    const createLink = async (secretaryId, doctorId)=>{
        const { data, error } = await supabase.from('secretary_doctor_links').insert({
            secretary_id: secretaryId,
            doctor_id: doctorId
        }).select().single();
        if (error) throw error;
        await refetch();
        return data;
    };
    const removeLink = async (linkId)=>{
        const { error } = await supabase.from('secretary_doctor_links').delete().eq('id', linkId);
        if (error) throw error;
        await refetch();
    };
    const updateSecretaryLinks = async (secretaryId, doctorIds)=>{
        // First remove existing links
        await supabase.from('secretary_doctor_links').delete().eq('secretary_id', secretaryId);
        if (doctorIds.length > 0) {
            const links = doctorIds.map((doctorId)=>({
                    secretary_id: secretaryId,
                    doctor_id: doctorId
                }));
            const { error } = await supabase.from('secretary_doctor_links').insert(links);
            if (error) throw error;
        }
        await refetch();
    };
    const getLinksForSecretary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((secretaryId)=>{
        return allLinks?.filter((link)=>link.secretary_id === secretaryId) || [];
    }, [
        allLinks
    ]);
    return {
        allLinks: allLinks || [],
        isLoading,
        createLink,
        removeLink,
        updateSecretaryLinks,
        getLinksForSecretary,
        refetch
    };
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useDashboardMetrics.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDashboardMetrics",
    ()=>useDashboardMetrics
]);
/**
 * Hook para métricas do dashboard principal
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useAuth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useUserProfile.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useSecretaryDoctors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useSecretaryDoctors.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const fetchDashboardMetrics = async (userId, isAdminOrDono, doctorIds)=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
    // Buscar deals com contatos
    let dealsQuery = supabase.from('crm_deals').select(`
            *,
            contact:crm_contacts(*)
        `);
    // Aplicar filtros baseados no papel do usuário
    if (!isAdminOrDono) {
        if (doctorIds && doctorIds.length > 0) {
            const orConditions = doctorIds.map((id)=>`user_id.eq.${id},assigned_to.eq.${id}`).join(',');
            dealsQuery = dealsQuery.or(orConditions);
        } else {
            dealsQuery = dealsQuery.or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
        }
    }
    const { data: deals, error: dealsError } = await dealsQuery;
    if (dealsError) throw new Error(`Erro ao buscar deals: ${dealsError.message}`);
    const dealsData = deals || [];
    // Buscar contatos
    let contactsQuery = supabase.from('crm_contacts').select('*');
    if (!isAdminOrDono) {
        if (doctorIds && doctorIds.length > 0) {
            contactsQuery = contactsQuery.in('user_id', doctorIds);
        } else {
            const contactIdsFromDeals = dealsData.map((d)=>d.contact_id).filter(Boolean);
            let orFilter = `user_id.eq.${userId}`;
            if (contactIdsFromDeals.length > 0) {
                const uniqueContactIds = [
                    ...new Set(contactIdsFromDeals)
                ];
                orFilter += `,id.in.(${uniqueContactIds.join(',')})`;
            }
            contactsQuery = contactsQuery.or(orFilter);
        }
    }
    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);
    const contactsData = contacts || [];
    // Buscar transações financeiras (Últimos 12 meses)
    const now = new Date();
    // const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    // const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
    const { data: transactions } = await supabase.from('financial_transactions').select('amount, type, status, transaction_date').gte('transaction_date', startOf12MonthsAgo).eq('status', 'concluida'); // Considerar apenas transações concluídas para o dashboard
    const transactionsData = transactions || [];
    // Calcular métricas financeiras (Current vs Previous Month)
    let currentRevenue = 0;
    let currentExpenses = 0;
    let previousRevenue = 0;
    let previousExpenses = 0;
    const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthPrefix = previousMonthDate.toISOString().slice(0, 7); // YYYY-MM
    transactionsData.forEach((t)=>{
        const val = Number(t.amount);
        const datePrefix = t.transaction_date.slice(0, 7);
        if (datePrefix === currentMonthPrefix) {
            if (t.type === 'entrada') currentRevenue += val;
            else if (t.type === 'saida') currentExpenses += val;
        } else if (datePrefix === previousMonthPrefix) {
            if (t.type === 'entrada') previousRevenue += val;
            else if (t.type === 'saida') previousExpenses += val;
        }
    });
    const financials = {
        revenue: currentRevenue,
        expenses: currentExpenses,
        balance: currentRevenue - currentExpenses,
        previousRevenue,
        previousExpenses,
        previousBalance: previousRevenue - previousExpenses
    };
    // Calcular métricas básicas
    const totalPipelineValue = dealsData.reduce((sum, deal)=>{
        const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
        return sum + (value || 0);
    }, 0);
    const activeDeals = dealsData.filter((d)=>!d.stage?.includes('fechado')).length;
    const wonDeals = dealsData.filter((d)=>d.stage === 'fechado_ganho').length;
    const lostDeals = dealsData.filter((d)=>d.stage === 'fechado_perdido').length;
    const totalClosedValue = dealsData.filter((d)=>d.stage === 'fechado_ganho').reduce((sum, deal)=>{
        const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
        return sum + (value || 0);
    }, 0);
    const totalFinalized = wonDeals + lostDeals;
    const conversionRate = totalFinalized > 0 ? Math.round(wonDeals / totalFinalized * 100 * 100) / 100 : 0;
    // Calcular deals por estágio
    const dealsByStage = {};
    const stages = [
        'lead_novo',
        'qualificado',
        'apresentacao',
        'proposta',
        'negociacao',
        'fechado_ganho',
        'fechado_perdido'
    ];
    stages.forEach((stage)=>{
        const stageDeals = dealsData.filter((d)=>d.stage === stage);
        const stageValue = stageDeals.reduce((sum, deal)=>{
            const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
            return sum + (value || 0);
        }, 0);
        dealsByStage[stage] = {
            count: stageDeals.length,
            value: stageValue
        };
    });
    // Gerar dados mensais (últimos 12 meses)
    const monthlyLeads = [];
    const monthlyRevenue = []; // CRM Revenue
    const monthlyFinancials = []; // Real Cash Flow
    const currentDate = new Date();
    for(let i = 11; i >= 0; i--){
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('pt-BR', {
            month: 'short'
        });
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        // Leads
        const monthLeads = contactsData.filter((contact)=>contact.created_at?.startsWith(monthKey)).length;
        // CRM Deals
        const monthDeals = dealsData.filter((deal)=>deal.created_at?.startsWith(monthKey));
        const monthProjected = monthDeals.reduce((sum, deal)=>{
            const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
            return sum + (value || 0);
        }, 0);
        const monthClosed = monthDeals.filter((deal)=>deal.stage === 'fechado_ganho').reduce((sum, deal)=>{
            const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
            return sum + (value || 0);
        }, 0);
        // Financials (Cash Flow)
        const monthTransactions = transactionsData.filter((t)=>t.transaction_date?.startsWith(monthKey));
        let mRevenue = 0;
        let mExpenses = 0;
        monthTransactions.forEach((t)=>{
            const val = Number(t.amount);
            if (t.type === 'entrada') mRevenue += val;
            else if (t.type === 'saida') mExpenses += val;
        });
        monthlyLeads.push({
            month: monthName,
            leads: monthLeads
        });
        monthlyRevenue.push({
            month: monthName,
            projected: monthProjected,
            closed: monthClosed
        });
        monthlyFinancials.push({
            month: monthName,
            revenue: mRevenue,
            expenses: mExpenses,
            balance: mRevenue - mExpenses
        });
    }
    // Interesse por serviços
    const servicesInterest = [];
    const serviceCounts = {};
    contactsData.forEach((contact)=>{
        const service = contact.procedure_id || contact.service_interest;
        if (service) {
            serviceCounts[service] = (serviceCounts[service] || 0) + 1;
        }
    });
    Object.entries(serviceCounts).forEach(([service, count])=>{
        servicesInterest.push({
            service,
            count
        });
    });
    // Conversão por estágio
    const conversionByStage = [];
    const stageOrder = [
        'lead_novo',
        'qualificado',
        'apresentacao',
        'proposta',
        'negociacao'
    ];
    for(let i = 0; i < stageOrder.length - 1; i++){
        const currentStage = stageOrder[i];
        const nextStage = stageOrder[i + 1];
        const currentCount = dealsByStage[currentStage]?.count || 0;
        const nextCount = dealsByStage[nextStage]?.count || 0;
        const conversion = currentCount > 0 ? Math.min(nextCount / currentCount * 100, 100) : 0;
        conversionByStage.push({
            stage: currentStage,
            conversion: Math.round(conversion * 10) / 10
        });
    }
    // Últimos 5 deals atualizados
    const recentDeals = [
        ...dealsData
    ].sort((a, b)=>new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5).map((d)=>({
            id: d.id,
            title: d.title,
            value: d.value,
            stage: d.stage,
            contact: d.contact
        }));
    return {
        totalPipelineValue,
        totalClosedValue,
        activeDeals,
        wonDeals,
        lostDeals,
        conversionRate,
        totalContacts: contactsData.length,
        dealsByStage,
        monthlyLeads,
        monthlyRevenue,
        servicesInterest,
        conversionByStage,
        recentDeals,
        financials,
        monthlyFinancials
    };
};
function useDashboardMetrics() {
    const { user, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const { profile, isSecretaria, isLoading: isLoadingProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUserProfile"])();
    const { doctorIds, isLoading: isLoadingDoctors } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useSecretaryDoctors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSecretaryDoctors"])();
    const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';
    const doctorIdsToUse = isSecretaria ? doctorIds : [];
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'dashboard-metrics',
            user?.id,
            profile?.role,
            doctorIdsToUse
        ],
        queryFn: async ()=>{
            if (!user?.id) {
                throw new Error('Usuário não autenticado');
            }
            return await fetchDashboardMetrics(user.id, isAdminOrDono, doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined);
        },
        enabled: !!user?.id && !!profile && !authLoading && !isLoadingProfile && (!isSecretaria || !isLoadingDoctors),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1
    });
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/lib/currency.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Utilitarios para formatacao e parsing de valores monetarios
 */ /**
 * Formata um numero como moeda brasileira
 */ __turbopack_context__.s([
    "formatCurrency",
    ()=>formatCurrency,
    "formatCurrencyInput",
    ()=>formatCurrencyInput,
    "formatCurrencyShort",
    ()=>formatCurrencyShort,
    "formatInitialCurrencyValue",
    ()=>formatInitialCurrencyValue,
    "formatNumberShort",
    ()=>formatNumberShort,
    "isValidCurrency",
    ()=>isValidCurrency,
    "parseCurrencyToNumber",
    ()=>parseCurrencyToNumber
]);
const formatCurrency = (value)=>{
    if (value === null || value === undefined) return "R$ 0,00";
    if (value === 0) return "R$ 0,00";
    // Converter string para numero, removendo caracteres nao numericos se necessario
    let numericValue;
    if (typeof value === 'string') {
        // Remover espacos e caracteres especiais, manter apenas numeros, virgula e ponto
        const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
        numericValue = parseFloat(cleanValue);
    } else {
        numericValue = value;
    }
    if (isNaN(numericValue) || numericValue === 0) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericValue);
};
const formatCurrencyInput = (value)=>{
    // Remover tudo exceto numeros
    const numbersOnly = value.replace(/[^\d]/g, "");
    if (numbersOnly === "") return "";
    // Converter para numero (centavos)
    const numericValue = parseInt(numbersOnly, 10);
    // Dividir por 100 para obter o valor em reais
    const realValue = numericValue / 100;
    // Formatar como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(realValue);
};
const parseCurrencyToNumber = (value)=>{
    if (!value) return null;
    // 1. Manter apenas numeros e a virgula do decimal
    const cleanValue = value.replace(/[^\d,]/g, "");
    if (cleanValue === "") return null;
    // 2. Substituir virgula por ponto para parsing
    const normalizedValue = cleanValue.replace(",", ".");
    const numericValue = parseFloat(normalizedValue);
    return isNaN(numericValue) ? null : numericValue;
};
const isValidCurrency = (value)=>{
    if (!value) return true; // Valores vazios sao validos (opcionais)
    const parsed = parseCurrencyToNumber(value);
    return parsed !== null && parsed >= 0;
};
const formatInitialCurrencyValue = (value)=>{
    if (!value && value !== 0) return "";
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "";
    return formatCurrency(numericValue);
};
function formatCurrencyShort(value) {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return formatCurrency(value);
}
function formatNumberShort(value) {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toLocaleString('pt-BR');
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardAction",
    ()=>CardAction,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
function Card({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
function CardHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
function CardTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("leading-none font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
function CardDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
function CardAction({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-action",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
function CardContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("px-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
function CardFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex items-center px-6 [.border-t]:pt-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VisionMetricCard",
    ()=>VisionMetricCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/card.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
function VisionMetricCard({ title, value, icon: Icon, trend, description, variant = 'blue', className }) {
    const variants = {
        purple: {
            border: 'border-purple-500/20',
            iconBg: 'bg-purple-500/10',
            iconColor: 'text-purple-400',
            shadow: 'hover:shadow-purple-500/10',
            gradient: 'from-purple-500/20 to-transparent'
        },
        cyan: {
            border: 'border-cyan-500/20',
            iconBg: 'bg-cyan-500/10',
            iconColor: 'text-cyan-400',
            shadow: 'hover:shadow-cyan-500/10',
            gradient: 'from-cyan-500/20 to-transparent'
        },
        orange: {
            border: 'border-orange-500/20',
            iconBg: 'bg-orange-500/10',
            iconColor: 'text-orange-400',
            shadow: 'hover:shadow-orange-500/10',
            gradient: 'from-orange-500/20 to-transparent'
        },
        green: {
            border: 'border-emerald-500/20',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
            shadow: 'hover:shadow-emerald-500/10',
            gradient: 'from-emerald-500/20 to-transparent'
        },
        blue: {
            border: 'border-blue-500/20',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400',
            shadow: 'hover:shadow-blue-500/10',
            gradient: 'from-blue-500/20 to-transparent'
        },
        pink: {
            border: 'border-pink-500/20',
            iconBg: 'bg-pink-500/10',
            iconColor: 'text-pink-400',
            shadow: 'hover:shadow-pink-500/10',
            gradient: 'from-pink-500/20 to-transparent'
        }
    };
    const style = variants[variant] || variants.blue;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1', 'bg-black/40 backdrop-blur-xl border border-white/5', // Remove existing heavy borders, rely on internal glow/gradients
        // style.border, 
        // Add specific shadow based on variant
        style.shadow, className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br", style.gradient)
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                lineNumber: 90,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute top-0 left-0 right-0 h-[1px] opacity-50 bg-gradient-to-r from-transparent via-current to-transparent", style.iconColor)
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                lineNumber: 93,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardContent"], {
                className: "p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-start mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('p-3 rounded-xl transition-colors', style.iconBg),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('w-6 h-6', style.iconColor)
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                    lineNumber: 97,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                lineNumber: 96,
                                columnNumber: 21
                            }, this),
                            trend && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : trend.direction === 'down' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'),
                                children: [
                                    trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•',
                                    " ",
                                    trend.value
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                lineNumber: 100,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                        lineNumber: 95,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-muted-foreground",
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                lineNumber: 112,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-baseline gap-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-3xl font-bold tracking-tight text-foreground",
                                    children: value
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                    lineNumber: 114,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                lineNumber: 113,
                                columnNumber: 21
                            }, this),
                            description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-muted-foreground mt-1 font-normal",
                                children: description
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                                lineNumber: 117,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                        lineNumber: 111,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
                lineNumber: 94,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx",
        lineNumber: 78,
        columnNumber: 9
    }, this);
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/skeleton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Skeleton",
    ()=>Skeleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
function Skeleton({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "skeleton",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-accent animate-pulse rounded-md", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/skeleton.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VisionHeroMetrics",
    ()=>VisionHeroMetrics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useUserProfile.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useDashboardMetrics$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useDashboardMetrics.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/currency.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-ssr] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/target.js [app-ssr] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/calendar.js [app-ssr] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-ssr] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-ssr] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/activity.js [app-ssr] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionMetricCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/skeleton.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function VisionHeroMetrics() {
    const { isSecretaria, isVendedor, isLoading: isLoadingProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUserProfile"])();
    const { data: dashboardMetrics, isLoading: isLoadingDashboard } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useDashboardMetrics$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDashboardMetrics"])();
    const isLoading = isLoadingProfile || isLoadingDashboard;
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: [
                1,
                2,
                3
            ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                    className: "h-40 w-full rounded-xl"
                }, i, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 36,
                    columnNumber: 21
                }, this))
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
            lineNumber: 34,
            columnNumber: 13
        }, this);
    }
    // Secretária - placeholder metrics (can be enhanced with real data later)
    if (isSecretaria) {
        const secretaryMetrics = {
            todayAppointments: 8,
            confirmedToday: 5,
            pendingConfirmation: 3
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                    title: "Agenda Hoje",
                    value: secretaryMetrics.todayAppointments || 0,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"],
                    variant: "purple",
                    description: `${secretaryMetrics.confirmedToday || 0} confirmadas`,
                    trend: {
                        value: 'Hoje',
                        direction: 'neutral'
                    }
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 52,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                    title: "Confirmações Pendentes",
                    value: secretaryMetrics.pendingConfirmation || 0,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"],
                    variant: "orange",
                    description: "Precisam de contato"
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 60,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                    title: "Taxa de Confirmação",
                    value: `${(secretaryMetrics.confirmedToday / (secretaryMetrics.todayAppointments || 1) * 100).toFixed(0)}%`,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"],
                    variant: "green",
                    description: "Performance diária"
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 67,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
            lineNumber: 51,
            columnNumber: 13
        }, this);
    }
    // Vendedor
    if (isVendedor && dashboardMetrics) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                    title: "Pipeline Ativo",
                    value: dashboardMetrics.activeDeals || 0,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"],
                    variant: "blue",
                    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(dashboardMetrics.totalPipelineValue || 0)
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 82,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                    title: "Vendas Fechadas",
                    value: dashboardMetrics.wonDeals || 0,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"],
                    variant: "green",
                    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(dashboardMetrics.totalClosedValue || 0)
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 89,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                    title: "Taxa de Conversão",
                    value: `${(dashboardMetrics.conversionRate || 0).toFixed(1)}%`,
                    icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"],
                    variant: "cyan",
                    description: "Média de conversão"
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                    lineNumber: 96,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
            lineNumber: 81,
            columnNumber: 13
        }, this);
    }
    // Admin/Dono (Default)
    const financials = dashboardMetrics?.financials || {
        revenue: 0,
        expenses: 0,
        balance: 0,
        previousRevenue: 0,
        previousExpenses: 0,
        previousBalance: 0
    };
    const calculateTrend = (current, previous)=>{
        if (previous === 0) return {
            value: '100%',
            direction: 'neutral'
        };
        const percent = (current - previous) / previous * 100;
        return {
            value: `${Math.abs(percent).toFixed(1)}%`,
            direction: percent >= 0 ? 'up' : 'down'
        };
    };
    const revenueTrend = calculateTrend(financials.revenue, financials.previousRevenue);
    const expensesTrend = calculateTrend(financials.expenses, financials.previousExpenses);
    const balanceTrend = calculateTrend(financials.balance, financials.previousBalance);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                title: "Receita Mensal",
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(financials.revenue),
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"],
                variant: "green",
                trend: {
                    value: revenueTrend.value,
                    direction: revenueTrend.direction
                },
                description: "Entradas este mês"
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                lineNumber: 132,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                title: "Despesas Mensais",
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(financials.expenses),
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"],
                variant: "orange",
                trend: {
                    value: expensesTrend.value,
                    direction: expensesTrend.direction === 'up' ? 'down' : 'up'
                },
                description: "Saídas este mês"
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                lineNumber: 144,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionMetricCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionMetricCard"], {
                title: "Saldo Líquido",
                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(financials.balance),
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"],
                variant: financials.balance >= 0 ? "cyan" : "pink",
                trend: {
                    value: balanceTrend.value,
                    direction: balanceTrend.direction
                },
                description: "Resultado do mês"
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
                lineNumber: 156,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx",
        lineNumber: 131,
        columnNumber: 9
    }, this);
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VisionCard",
    ()=>VisionCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
'use client';
;
;
function VisionCard({ children, className, title, action }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl shadow-card overflow-hidden transition-all duration-300 hover:border-white/10', className),
        children: [
            (title || action) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30",
                children: [
                    title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-semibold text-lg tracking-tight text-foreground",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx",
                        lineNumber: 21,
                        columnNumber: 31
                    }, this),
                    action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: action
                    }, void 0, false, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx",
                        lineNumber: 22,
                        columnNumber: 32
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx",
                lineNumber: 20,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 text-card-foreground",
                children: children
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx",
                lineNumber: 25,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx",
        lineNumber: 15,
        columnNumber: 9
    }, this);
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/input.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
function Input({ className, type, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        "data-slot": "input",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/input.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VisionDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * Dashboard principal com visão geral da clínica
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionHeroMetrics$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionHeroMetrics.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/vision/VisionCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useUserProfile.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useDashboardMetrics$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useDashboardMetrics.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/skeleton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/calendar.js [app-ssr] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$funnel$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/funnel.js [app-ssr] (ecmascript) <export default as Filter>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/search.js [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/target.js [app-ssr] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/currency.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
function VisionDashboard({ viewMode, onViewModeChange }) {
    const { profile, isVendedor } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUserProfile"])();
    const { data: dashboardMetrics } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useDashboardMetrics$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDashboardMetrics"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    if (!profile) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                className: "h-96 w-full"
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 30,
                columnNumber: 37
            }, this)
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
            lineNumber: 30,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-background text-foreground p-4 md:p-8 space-y-8 font-sans transition-colors duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold tracking-tight text-foreground",
                                children: [
                                    "Olá, ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-primary",
                                        children: profile.full_name?.split(' ')[0] || 'Bem-vindo'
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 40,
                                        columnNumber: 30
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 39,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-muted-foreground mt-1 font-light tracking-wide",
                                children: "Aqui está o relatório geral da sua clínica hoje."
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 42,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 38,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative hidden md:block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                        className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 49,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "Buscar...",
                                        className: "pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground w-64 focus-visible:ring-primary rounded-xl transition-all hover:bg-muted/50"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 50,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 48,
                                columnNumber: 21
                            }, this),
                            onViewModeChange && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: viewMode === 'vision' ? 'default' : 'ghost',
                                        size: "sm",
                                        onClick: ()=>onViewModeChange('vision'),
                                        className: `text-xs h-8 px-3 rounded-lg ${viewMode === 'vision' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`,
                                        children: "Visão Geral"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 58,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: viewMode === 'detailed' ? 'default' : 'ghost',
                                        size: "sm",
                                        onClick: ()=>onViewModeChange('detailed'),
                                        className: `text-xs h-8 px-3 rounded-lg ${viewMode === 'detailed' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`,
                                        children: "Detalhada"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 66,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 57,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                variant: "outline",
                                size: "icon",
                                className: "bg-card border-border text-foreground hover:bg-muted/50 rounded-xl",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$funnel$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__["Filter"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 77,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 76,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                className: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 border-0 rounded-xl",
                                onClick: ()=>router.push('/agenda'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                        className: "h-4 w-4 mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 83,
                                        columnNumber: 25
                                    }, this),
                                    "Agendar"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 79,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 37,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionHeroMetrics$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionHeroMetrics"], {}, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                    lineNumber: 91,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 90,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-2 space-y-6",
                        children: isVendedor ? // Vendedor View
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                            title: "Pipeline de Vendas",
                                            className: "h-full",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PipelineFunnelPreview, {
                                                dealsByStage: dashboardMetrics?.dealsByStage || {}
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                lineNumber: 104,
                                                columnNumber: 37
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                            lineNumber: 103,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                            title: "Acesso Rápido",
                                            className: "h-full",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 gap-3 h-full items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: "outline",
                                                        className: "h-full py-4 flex flex-col items-center justify-center gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all",
                                                        onClick: ()=>router.push('/crm'),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                                                className: "h-6 w-6 text-primary"
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                                lineNumber: 116,
                                                                columnNumber: 45
                                                            }, this),
                                                            "CRM"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                        lineNumber: 111,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: "outline",
                                                        className: "h-full py-4 flex flex-col items-center justify-center gap-2 border-border/50 hover:border-orange-500/50 hover:bg-orange-500/5 text-muted-foreground hover:text-orange-500 transition-all",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                                                                className: "h-6 w-6 text-orange-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                                lineNumber: 123,
                                                                columnNumber: 45
                                                            }, this),
                                                            "Tarefas"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                        lineNumber: 119,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                lineNumber: 110,
                                                columnNumber: 37
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                            lineNumber: 109,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 102,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                    title: "Performance Mensal",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MonthlyRevenuePreview, {
                                        monthlyRevenue: dashboardMetrics?.monthlyRevenue || []
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 131,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 130,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true) : // Admin View
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                    title: "Fluxo de Caixa Real",
                                    action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex bg-muted/50 rounded-lg p-0.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "ghost",
                                                size: "sm",
                                                className: "h-7 text-xs rounded-md bg-card shadow-sm text-foreground",
                                                children: "Fluxo"
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                lineNumber: 141,
                                                columnNumber: 37
                                            }, void 0),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "ghost",
                                                size: "sm",
                                                className: "h-7 text-xs rounded-md text-muted-foreground hover:text-foreground",
                                                children: "Saldo"
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                                lineNumber: 142,
                                                columnNumber: 37
                                            }, void 0)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 140,
                                        columnNumber: 33
                                    }, void 0),
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FinancialFlowPreview, {
                                        monthlyFinancials: dashboardMetrics?.monthlyFinancials || []
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 145,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 139,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                    title: "Previsão de Receita (CRM)",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MonthlyRevenuePreview, {
                                        monthlyRevenue: dashboardMetrics?.monthlyRevenue || []
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 151,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 150,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                    title: "Deals por Estágio",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PipelineFunnelPreview, {
                                        dealsByStage: dashboardMetrics?.dealsByStage || {}
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 157,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 156,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 98,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                title: "Deals Recentes",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RecentDealsPreview, {
                                    recentDeals: dashboardMetrics?.recentDeals || []
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 168,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 167,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$vision$2f$VisionCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VisionCard"], {
                                title: "Métricas de Conversão",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ConversionPreview, {
                                    conversionByStage: dashboardMetrics?.conversionByStage || []
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 174,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 173,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 166,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 95,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
        lineNumber: 34,
        columnNumber: 9
    }, this);
}
// Sub-components for dashboard sections
function PipelineFunnelPreview({ dealsByStage }) {
    const stages = [
        {
            key: 'lead_novo',
            label: 'Leads Novos',
            color: 'bg-blue-500'
        },
        {
            key: 'qualificado',
            label: 'Qualificados',
            color: 'bg-purple-500'
        },
        {
            key: 'apresentacao',
            label: 'Apresentação',
            color: 'bg-cyan-500'
        },
        {
            key: 'proposta',
            label: 'Proposta',
            color: 'bg-orange-500'
        },
        {
            key: 'negociacao',
            label: 'Negociação',
            color: 'bg-amber-500'
        },
        {
            key: 'fechado_ganho',
            label: 'Ganhos',
            color: 'bg-emerald-500'
        }
    ];
    const maxCount = Math.max(...stages.map((s)=>dealsByStage[s.key]?.count || 0), 1);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: stages.map((stage)=>{
            const data = dealsByStage[stage.key] || {
                count: 0,
                value: 0
            };
            const width = data.count / maxCount * 100;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-muted-foreground",
                                children: stage.label
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 208,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: data.count
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 209,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 207,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-2 bg-muted rounded-full overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `h-full ${stage.color} rounded-full transition-all duration-500`,
                            style: {
                                width: `${width}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                            lineNumber: 212,
                            columnNumber: 29
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 211,
                        columnNumber: 25
                    }, this)
                ]
            }, stage.key, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 206,
                columnNumber: 21
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
        lineNumber: 200,
        columnNumber: 9
    }, this);
}
function MonthlyRevenuePreview({ monthlyRevenue }) {
    const lastSixMonths = monthlyRevenue.slice(-6);
    const maxValue = Math.max(...lastSixMonths.flatMap((m)=>[
            m.projected,
            m.closed
        ]), 1);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 text-xs text-muted-foreground",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 bg-primary rounded"
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 232,
                                columnNumber: 21
                            }, this),
                            "Projetado"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 231,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 bg-emerald-500 rounded"
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 236,
                                columnNumber: 21
                            }, this),
                            "Fechado"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 235,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 230,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end justify-between gap-2 h-32",
                children: lastSixMonths.map((month, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full flex gap-1 items-end h-24",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 bg-primary/30 rounded-t",
                                        style: {
                                            height: `${month.projected / maxValue * 100}%`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 244,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 bg-emerald-500 rounded-t",
                                        style: {
                                            height: `${month.closed / maxValue * 100}%`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 248,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 243,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-muted-foreground capitalize",
                                children: month.month
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 253,
                                columnNumber: 25
                            }, this)
                        ]
                    }, idx, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 242,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 240,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
        lineNumber: 229,
        columnNumber: 9
    }, this);
}
function RecentDealsPreview({ recentDeals }) {
    if (recentDeals.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-muted-foreground text-sm text-center py-8",
            children: "Nenhum deal recente"
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
            lineNumber: 264,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: recentDeals.slice(0, 5).map((deal)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between p-3 bg-muted/30 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-medium text-sm",
                                children: deal.title || deal.contact?.full_name || 'Sem título'
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 275,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-muted-foreground capitalize",
                                children: deal.stage?.replace('_', ' ')
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 276,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 274,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-medium text-primary",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(deal.value || 0)
                    }, void 0, false, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 278,
                        columnNumber: 21
                    }, this)
                ]
            }, deal.id, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 273,
                columnNumber: 17
            }, this))
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
        lineNumber: 271,
        columnNumber: 9
    }, this);
}
function ConversionPreview({ conversionByStage }) {
    const stageLabels = {
        'lead_novo': 'Lead → Qualificado',
        'qualificado': 'Qualificado → Apresentação',
        'apresentacao': 'Apresentação → Proposta',
        'proposta': 'Proposta → Negociação',
        'negociacao': 'Negociação → Fechado'
    };
    if (conversionByStage.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-muted-foreground text-sm text-center py-8",
            children: "Sem dados de conversão"
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
            lineNumber: 298,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: conversionByStage.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm text-muted-foreground",
                        children: stageLabels[item.stage] || item.stage
                    }, void 0, false, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 308,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-16 h-2 bg-muted rounded-full overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-full bg-primary rounded-full",
                                    style: {
                                        width: `${Math.min(item.conversion, 100)}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                    lineNumber: 311,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 310,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-medium w-12 text-right",
                                children: [
                                    item.conversion.toFixed(0),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 316,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 309,
                        columnNumber: 21
                    }, this)
                ]
            }, item.stage, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 307,
                columnNumber: 17
            }, this))
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
        lineNumber: 305,
        columnNumber: 9
    }, this);
}
function FinancialFlowPreview({ monthlyFinancials }) {
    const lastSixMonths = monthlyFinancials.slice(-6);
    const maxValue = Math.max(...lastSixMonths.flatMap((m)=>[
            m.revenue,
            m.expenses
        ]), 1);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 text-xs text-muted-foreground",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 bg-emerald-500 rounded"
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 332,
                                columnNumber: 21
                            }, this),
                            "Receitas"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 331,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 bg-rose-500 rounded"
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 336,
                                columnNumber: 21
                            }, this),
                            "Despesas"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 335,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-1 bg-cyan-500 rounded-full"
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 340,
                                columnNumber: 21
                            }, this),
                            "Saldo"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 339,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 330,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end justify-between gap-2 h-32",
                children: lastSixMonths.map((month, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col items-center gap-1 group relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-lg z-10 whitespace-nowrap border border-border",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-emerald-500",
                                        children: [
                                            "Rec: ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(month.revenue)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 349,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-rose-500",
                                        children: [
                                            "Desp: ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(month.expenses)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 350,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-cyan-500 font-bold border-t border-border/50 mt-1 pt-1",
                                        children: [
                                            "Saldo: ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$currency$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCurrency"])(month.balance)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 351,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 348,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full flex gap-1 items-end h-24 relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 bg-emerald-500 rounded-t hover:bg-emerald-400 transition-colors",
                                        style: {
                                            height: `${month.revenue / maxValue * 100}%`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 358,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 bg-rose-500 rounded-t hover:bg-rose-400 transition-colors",
                                        style: {
                                            height: `${month.expenses / maxValue * 100}%`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                        lineNumber: 363,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 356,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-muted-foreground capitalize",
                                children: month.month
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                                lineNumber: 368,
                                columnNumber: 25
                            }, this)
                        ]
                    }, idx, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                        lineNumber: 346,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
                lineNumber: 344,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx",
        lineNumber: 329,
        columnNumber: 9
    }, this);
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * Página principal do Dashboard
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useUserProfile.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useDashboardMetrics$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/hooks/useDashboardMetrics.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$VisionDashboard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/dashboard/VisionDashboard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/skeleton.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function DashboardPage() {
    const { isSecretaria, isLoading: isLoadingProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useUserProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUserProfile"])();
    const { isLoading: isLoadingMetrics, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$hooks$2f$useDashboardMetrics$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDashboardMetrics"])();
    const [viewMode, setViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('vision');
    if (isLoadingProfile || isLoadingMetrics) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10 pt-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                            className: "h-10 w-64"
                        }, void 0, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                            lineNumber: 22,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                            className: "h-6 w-48"
                        }, void 0, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                            lineNumber: 23,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                    lineNumber: 21,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                    children: [
                        1,
                        2,
                        3
                    ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                            className: "h-40 w-full rounded-xl"
                        }, i, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                            lineNumber: 27,
                            columnNumber: 25
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                    lineNumber: 25,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                            className: "lg:col-span-2 h-80 rounded-xl"
                        }, void 0, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                            lineNumber: 31,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Skeleton"], {
                            className: "h-80 rounded-xl"
                        }, void 0, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                            lineNumber: 32,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                    lineNumber: 30,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
            lineNumber: 20,
            columnNumber: 13
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center bg-background text-foreground",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center text-destructive",
                children: [
                    "Erro ao carregar métricas: ",
                    error.message
                ]
            }, void 0, true, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
                lineNumber: 41,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
            lineNumber: 40,
            columnNumber: 13
        }, this);
    }
    // Main Dashboard - VisionDashboard handles role-based views internally
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$dashboard$2f$VisionDashboard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        viewMode: viewMode,
        onViewModeChange: setViewMode
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/app/(dashboard)/page.tsx",
        lineNumber: 50,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=dashmedpro-1_dashmed-nextjs_src_0a72fc75._.js.map