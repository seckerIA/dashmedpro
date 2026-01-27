module.exports = [
"[project]/dashmedpro-1/dashmed-nextjs/src/actions/inventory.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00af0eb22a512c863d31c6f078b3a232d9cc4e86cf":"getSuppliers","00eff0b91bc59bf9bd292367b88edfed03e2839406":"getInventoryItems","40b8073a0085d51816f19cafe08a3077de24de9be3":"deleteInventoryItem","40e041966a0cbc4c0984bb0c1550d0b0f2f5b7a1b5":"addBatch","40f834c6d715a3a4a6cc549c384b0940c2bf61ce7f":"createInventoryItem","607426f182ea3ebf385ae5b46d406914027b54d60d":"updateInventoryItem"},"",""] */ __turbopack_context__.s([
    "addBatch",
    ()=>addBatch,
    "createInventoryItem",
    ()=>createInventoryItem,
    "deleteInventoryItem",
    ()=>deleteInventoryItem,
    "getInventoryItems",
    ()=>getInventoryItems,
    "getSuppliers",
    ()=>getSuppliers,
    "updateInventoryItem",
    ()=>updateInventoryItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function getInventoryItems() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch items with their batches to calculate total quantity
    const { data, error } = await supabase.from('inventory_items').select(`
      *,
      batches:inventory_batches(
        id, quantity, expiration_date, batch_number, is_active
      )
    `).order('name');
    if (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
    // Calculate total quantity for each item
    const items = data.map((item)=>({
            ...item,
            total_quantity: item.batches?.reduce((acc, batch)=>acc + (batch.is_active ? batch.quantity : 0), 0) || 0
        }));
    return items;
}
async function createInventoryItem(data) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const { data: newItem, error } = await supabase.from('inventory_items').insert({
        ...data,
        user_id: user.id
    }).select().single();
    if (error) throw new Error(error.message);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/inventory');
    return newItem;
}
async function updateInventoryItem(id, data) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error } = await supabase.from('inventory_items').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/inventory');
}
async function deleteInventoryItem(id) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Usually we might check for dependencies/movements before deleting
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/inventory');
}
async function getSuppliers() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('inventory_suppliers') // Assuming table name
    .select('*').order('name');
    if (error) return [] // Soft fail if table doesn't exist yet
    ;
    return data;
}
async function addBatch(data) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: batch, error } = await supabase.from('inventory_batches').insert(data).select().single();
    if (error) throw new Error(error.message);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/inventory');
    return batch;
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getSuppliers,
    addBatch
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getInventoryItems, "00eff0b91bc59bf9bd292367b88edfed03e2839406", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createInventoryItem, "40f834c6d715a3a4a6cc549c384b0940c2bf61ce7f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateInventoryItem, "607426f182ea3ebf385ae5b46d406914027b54d60d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteInventoryItem, "40b8073a0085d51816f19cafe08a3077de24de9be3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getSuppliers, "00af0eb22a512c863d31c6f078b3a232d9cc4e86cf", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addBatch, "40e041966a0cbc4c0984bb0c1550d0b0f2f5b7a1b5", null);
}),
"[project]/dashmedpro-1/dashmed-nextjs/.next-internal/server/app/(dashboard)/inventory/page/actions.js { ACTIONS_MODULE0 => \"[project]/dashmedpro-1/dashmed-nextjs/src/actions/inventory.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/actions/inventory.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/.next-internal/server/app/(dashboard)/inventory/page/actions.js { ACTIONS_MODULE0 => \"[project]/dashmedpro-1/dashmed-nextjs/src/actions/inventory.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00af0eb22a512c863d31c6f078b3a232d9cc4e86cf",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSuppliers"],
    "00eff0b91bc59bf9bd292367b88edfed03e2839406",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getInventoryItems"],
    "40b8073a0085d51816f19cafe08a3077de24de9be3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteInventoryItem"],
    "40e041966a0cbc4c0984bb0c1550d0b0f2f5b7a1b5",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addBatch"],
    "40f834c6d715a3a4a6cc549c384b0940c2bf61ce7f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createInventoryItem"],
    "607426f182ea3ebf385ae5b46d406914027b54d60d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateInventoryItem"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$inventory$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/dashmedpro-1/dashmed-nextjs/.next-internal/server/app/(dashboard)/inventory/page/actions.js { ACTIONS_MODULE0 => "[project]/dashmedpro-1/dashmed-nextjs/src/actions/inventory.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$actions$2f$inventory$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/actions/inventory.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=dashmedpro-1_dashmed-nextjs_1fd649c8._.js.map