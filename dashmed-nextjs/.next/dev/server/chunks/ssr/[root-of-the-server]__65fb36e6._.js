module.exports = [
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatCurrency",
    ()=>formatCurrency,
    "formatDate",
    ()=>formatDate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip,
    "TooltipContent",
    ()=>TooltipContent,
    "TooltipProvider",
    ()=>TooltipProvider,
    "TooltipTrigger",
    ()=>TooltipTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@radix-ui/react-tooltip/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function TooltipProvider({ delayDuration = 0, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"], {
        "data-slot": "tooltip-provider",
        delayDuration: delayDuration,
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
function Tooltip({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TooltipProvider, {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
            "data-slot": "tooltip",
            ...props
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
function TooltipTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "tooltip-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
        lineNumber: 34,
        columnNumber: 10
    }, this);
}
function TooltipContent({ className, sideOffset = 0, children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
            "data-slot": "tooltip-content",
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance", className),
            ...props,
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Arrow"], {
                    className: "bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
                    lineNumber: 55,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
            lineNumber: 45,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Popover",
    ()=>Popover,
    "PopoverAnchor",
    ()=>PopoverAnchor,
    "PopoverContent",
    ()=>PopoverContent,
    "PopoverDescription",
    ()=>PopoverDescription,
    "PopoverHeader",
    ()=>PopoverHeader,
    "PopoverTitle",
    ()=>PopoverTitle,
    "PopoverTrigger",
    ()=>PopoverTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@radix-ui/react-popover/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function Popover({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "popover",
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 11,
        columnNumber: 10
    }, this);
}
function PopoverTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "popover-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 17,
        columnNumber: 10
    }, this);
}
function PopoverContent({ className, align = "center", sideOffset = 4, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
            "data-slot": "popover-content",
            align: align,
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden", className),
            ...props
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
function PopoverAnchor({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Anchor"], {
        "data-slot": "popover-anchor",
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 45,
        columnNumber: 10
    }, this);
}
function PopoverHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "popover-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-1 text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
function PopoverTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "popover-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("font-medium", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
function PopoverDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        "data-slot": "popover-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScrollArea",
    ()=>ScrollArea,
    "ScrollBar",
    ()=>ScrollBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$scroll$2d$area$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@radix-ui/react-scroll-area/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function ScrollArea({ className, children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$scroll$2d$area$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "scroll-area",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$scroll$2d$area$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"], {
                "data-slot": "scroll-area-viewport",
                className: "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
                children: children
            }, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScrollBar, {}, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$scroll$2d$area$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Corner"], {}, void 0, false, {
                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
function ScrollBar({ className, orientation = "vertical", ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$scroll$2d$area$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ScrollAreaScrollbar"], {
        "data-slot": "scroll-area-scrollbar",
        orientation: orientation,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex touch-none p-px transition-colors select-none", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent", className),
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$scroll$2d$area$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ScrollAreaThumb"], {
            "data-slot": "scroll-area-thumb",
            className: "bg-border relative flex-1 rounded-full"
        }, void 0, false, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx",
            lineNumber: 50,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9",
            "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
            "icon-sm": "size-8",
            "icon-lg": "size-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        "data-variant": variant,
        "data-size": size,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/button.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/badge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
            secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
            destructive: "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
            ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
            link: "text-primary underline-offset-4 [a&]:hover:underline"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant = "default", asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "span";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "badge",
        "data-variant": variant,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/badge.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeToggle",
    ()=>ThemeToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/moon.js [app-ssr] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/sun.js [app-ssr] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function ThemeToggle({ isCollapsed = false }) {
    const { theme, setTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
    }, []);
    if (!mounted) {
        return null;
    }
    const toggleTheme = ()=>{
        setTheme(theme === "light" ? "dark" : "light");
    };
    const Icon = theme === "light" ? __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"] : __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"];
    const linkContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `flex items-center ${isCollapsed ? '' : 'gap-4'}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                    className: `
          w-7 h-7 transition-all duration-200
          text-muted-foreground group-hover:text-foreground
          group-hover:scale-105
        `
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this),
                !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: `
            text-lg font-medium transition-colors duration-200 whitespace-nowrap
            text-muted-foreground group-hover:text-foreground
          `,
                    children: [
                        "Tema ",
                        theme === "light" ? "Escuro" : "Claro"
                    ]
                }, void 0, true, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
                    lineNumber: 43,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
    const buttonContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleTheme,
        className: `
        block ${isCollapsed ? 'p-3.5' : 'px-4 py-3.5'} rounded-2xl transition-all duration-200 group relative w-full
        text-muted-foreground hover:bg-accent hover:text-accent-foreground
      `,
        children: linkContent
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
    if (isCollapsed) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipTrigger"], {
                    asChild: true,
                    children: buttonContent
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipContent"], {
                    side: "right",
                    className: "bg-card text-foreground border-border",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            "Alternar para tema ",
                            theme === "light" ? "escuro" : "claro"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
                        lineNumber: 73,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx",
            lineNumber: 68,
            columnNumber: 7
        }, this);
    }
    return buttonContent;
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@supabase/ssr/dist/module/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-ssr] (ecmascript)");
;
let client = null;
function createClient() {
    if (client) return client;
    client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBrowserClient"])(("TURBOPACK compile-time value", "https://adzaqkduxnpckbcuqpmg.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc"));
    return client;
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppSidebar",
    ()=>AppSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-ssr] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/file-text.js [app-ssr] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-ssr] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/target.js [app-ssr] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$pie$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PieChart$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/chart-pie.js [app-ssr] (ecmascript) <export default as PieChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/house.js [app-ssr] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/user-plus.js [app-ssr] (ecmascript) <export default as UserPlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/log-out.js [app-ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare2$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/square-check.js [app-ssr] (ecmascript) <export default as CheckSquare2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/calendar.js [app-ssr] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-ssr] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/workflow.js [app-ssr] (ecmascript) <export default as Workflow>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$brain$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Brain$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/brain.js [app-ssr] (ecmascript) <export default as Brain>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [app-ssr] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$megaphone$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Megaphone$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/megaphone.js [app-ssr] (ecmascript) <export default as Megaphone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/receipt.js [app-ssr] (ecmascript) <export default as Receipt>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-ssr] (ecmascript) <export default as MessageCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/building-2.js [app-ssr] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/zap.js [app-ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleDollarSign$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/circle-dollar-sign.js [app-ssr] (ecmascript) <export default as CircleDollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/package.js [app-ssr] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/popover.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$scroll$2d$area$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/scroll-area.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/badge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$theme$2d$toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/theme-toggle.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
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
;
;
;
const navigationGroups = [
    {
        label: "Principal",
        items: [
            {
                title: "Dashboard",
                url: "/",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"]
            },
            {
                title: "Tarefas",
                url: "/tasks",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare2$3e$__["CheckSquare2"]
            },
            {
                title: "Estoque",
                url: "/inventory",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
                alertBadge: true
            }
        ]
    },
    {
        label: "Vendas & Marketing",
        items: [
            {
                title: "Marketing",
                url: "/marketing",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
            },
            {
                title: "CRM",
                url: "/crm",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"],
                subItems: [
                    {
                        title: "Dashboard",
                        url: "/crm?tab=dashboard",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"]
                    },
                    {
                        title: "Pipeline",
                        url: "/crm?tab=pipeline",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__["Workflow"]
                    },
                    {
                        title: "Leads & Conversoes",
                        url: "/crm?tab=leads",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
                    },
                    {
                        title: "Inteligencia",
                        url: "/crm?tab=intelligence",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$brain$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Brain$3e$__["Brain"]
                    },
                    {
                        title: "Vendas & Procedimentos",
                        url: "/crm?tab=sales",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"]
                    },
                    {
                        title: "Campanhas",
                        url: "/crm?tab=campaigns",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$megaphone$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Megaphone$3e$__["Megaphone"]
                    },
                    {
                        title: "Relatorios",
                        url: "/crm?tab=reports",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"]
                    }
                ]
            },
            {
                title: "Tabela de Precos",
                url: "/procedures",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"],
                medicoOnly: true,
                badge: "Novo",
                variant: "new"
            },
            {
                title: "Metricas de Equipe",
                url: "/team-metrics",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"]
            },
            {
                title: "Calendario",
                url: "/agenda",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"],
                badge: "Novo",
                variant: "new"
            }
        ]
    },
    {
        label: "Atendimento",
        items: [
            {
                title: "WhatsApp",
                url: "/whatsapp",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"],
                badge: "Novo",
                variant: "new"
            },
            {
                title: "Prontuarios",
                url: "/medical-records",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"],
                medicoOnly: true
            },
            {
                title: "Meu Financeiro",
                url: "/secretary/financial",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__["Receipt"],
                secretariaOnly: true
            }
        ]
    },
    {
        label: "Ferramentas",
        items: [
            {
                title: "Financeiro",
                url: "/financial",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$pie$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PieChart$3e$__["PieChart"],
                subItems: [
                    {
                        title: "Dashboard",
                        url: "/financial?tab=dashboard",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"]
                    },
                    {
                        title: "Transacoes",
                        url: "/financial?tab=transacoes",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__["Receipt"]
                    },
                    {
                        title: "Sinais",
                        url: "/financial?tab=sinais",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$dollar$2d$sign$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleDollarSign$3e$__["CircleDollarSign"]
                    },
                    {
                        title: "Contas",
                        url: "/financial?tab=contas",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"]
                    },
                    {
                        title: "Categorias",
                        url: "/financial?tab=categorias",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"]
                    },
                    {
                        title: "Recorrencias",
                        url: "/financial?tab=recorrencias",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"]
                    },
                    {
                        title: "Relatorios",
                        url: "/financial?tab=relatorios",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"]
                    },
                    {
                        title: "Orcamentos",
                        url: "/financial?tab=orcamentos",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
                    },
                    {
                        title: "Previsoes",
                        url: "/financial?tab=previsoes",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
                    }
                ]
            },
            {
                title: "Relatorios",
                url: "/reports",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"]
            }
        ]
    },
    {
        label: "Administracao",
        items: [
            {
                title: "Gerenciar Equipe",
                url: "/team",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__["UserPlus"],
                medicoOnly: true
            }
        ]
    }
];
function AppSidebar({ isCollapsed = false, userProfile, organization }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const currentPath = pathname;
    const currentSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'dono';
    const isMedico = userProfile.role === 'medico';
    const isSecretaria = userProfile.role === 'secretaria';
    const isVendedor = userProfile.role === 'vendedor';
    const isGestorTrafego = userProfile.role === 'gestor_trafego';
    const [expandedItems, setExpandedItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (currentPath.startsWith('/crm')) {
            setExpandedItems([
                'CRM'
            ]);
        } else if (currentPath.startsWith('/financial')) {
            setExpandedItems([
                'Financeiro'
            ]);
        }
    }, [
        currentPath
    ]);
    const toggleExpanded = (title)=>{
        setExpandedItems((prev)=>prev.includes(title) ? [] : [
                title
            ]);
    };
    const isExpanded = (title)=>expandedItems.includes(title);
    const isActive = (path)=>currentPath === path;
    const isSubItemActive = (url)=>{
        const [basePath, queryString] = url.split('?');
        if (currentPath !== basePath) return false;
        if (!queryString) return currentPath === basePath && !currentSearch;
        return currentSearch === `?${queryString}`;
    };
    const handleSignOut = async ()=>{
        try {
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
            await supabase.auth.signOut();
            __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success("Logout realizado com sucesso");
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error("Erro ao fazer logout");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipProvider"], {
        delayDuration: 0,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `flex h-full flex-col bg-sidebar text-sidebar-foreground font-sans ${isCollapsed ? 'w-full' : ''}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$scroll$2d$area$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ScrollArea"], {
                    className: "flex-1",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${isCollapsed ? 'p-1 space-y-3' : 'p-4 space-y-4'}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `
                flex items-center
                ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-4 px-5 py-4'}
                rounded-2xl bg-white/5 shadow-sm
                transition-all duration-300
              `,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        src: "/dashmed-logo.png",
                                        alt: "DashMed Pro Logo",
                                        width: isCollapsed ? 40 : 48,
                                        height: isCollapsed ? 40 : 48,
                                        className: "transition-all duration-300"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this),
                                    !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-foreground font-semibold text-xl tracking-wide whitespace-nowrap overflow-hidden",
                                                children: organization?.name || "DASHMED PRO"
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                lineNumber: 232,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-muted-foreground text-sm whitespace-nowrap overflow-hidden",
                                                children: organization ? "DASHMED PRO" : "Dashboard"
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                lineNumber: 235,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                        lineNumber: 231,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                lineNumber: 215,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: isCollapsed ? 'space-y-2.5' : 'space-y-4',
                                children: navigationGroups.map((group, groupIndex)=>{
                                    const filteredItems = group.items.filter((item)=>{
                                        if (item.hidden) return false;
                                        const hiddenUrls = [
                                            '/calculadora',
                                            '/email-marketing',
                                            '/landing-pages',
                                            '/reports'
                                        ];
                                        if (hiddenUrls.includes(item.url)) return false;
                                        if (item.adminOnly === true && !isAdmin) return false;
                                        if (item.medicoOnly === true && !isMedico && !isAdmin) return false;
                                        if (item.secretariaOnly === true && !isSecretaria) return false;
                                        if (isVendedor) {
                                            if (item.url === '/financial') return false;
                                            if (item.url === '/reports') return false;
                                            if (item.url === '/marketing') return false;
                                        }
                                        if (isGestorTrafego) {
                                            if (item.url === '/financial') return false;
                                            if (item.url === '/crm') return false;
                                        }
                                        if (isSecretaria) {
                                            if (item.url === '/marketing') return false;
                                            if (item.url === '/financial') return false;
                                            if (item.url === '/inventory') return false;
                                            if (item.url === '/team-metrics') return false;
                                        }
                                        return true;
                                    });
                                    if (filteredItems.length === 0) return null;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-1",
                                        children: [
                                            !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "px-3 mb-1.5",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs font-semibold text-muted-foreground/70 uppercase tracking-[0.18em] whitespace-nowrap overflow-hidden text-ellipsis",
                                                    children: group.label
                                                }, void 0, false, {
                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 25
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                lineNumber: 286,
                                                columnNumber: 23
                                            }, this),
                                            isCollapsed && groupIndex > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-px bg-white/10 my-1"
                                            }, void 0, false, {
                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                lineNumber: 294,
                                                columnNumber: 23
                                            }, this),
                                            filteredItems.map((item)=>{
                                                const hasSubItems = item.subItems && item.subItems.length > 0;
                                                const active = isActive(item.url) || hasSubItems && currentPath.startsWith(item.url.split('?')[0]);
                                                const expanded = isExpanded(item.title);
                                                // Popover for collapsed sidebar with sub-items
                                                if (hasSubItems && isCollapsed) {
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Popover"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PopoverTrigger"], {
                                                                asChild: true,
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: `
                                  group relative w-full flex items-center justify-center
                                  p-2.5 rounded-2xl text-base font-medium
                                  transition-all duration-200
                                  ${active ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border-l-2 border-l-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'text-muted-foreground hover:bg-white/5 hover:text-white border-l-2 border-transparent'}
                                `,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                                        className: `
                                    w-8 h-8 transition-all duration-300
                                    ${active ? 'text-primary fill-primary/20 drop-shadow-[0_0_12px_rgba(37,99,235,0.8)] scale-110 rotate-3' : 'text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] group-hover:scale-105'}
                                  `
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                        lineNumber: 318,
                                                                        columnNumber: 33
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                    lineNumber: 307,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                lineNumber: 306,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PopoverContent"], {
                                                                side: "right",
                                                                align: "start",
                                                                className: "w-56 p-2 bg-sidebar border-white/10",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "space-y-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "px-2 py-1.5 text-sm font-semibold text-muted-foreground",
                                                                            children: item.title
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                            lineNumber: 335,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        item.subItems?.filter((subItem)=>{
                                                                            if (isSecretaria && subItem.url.includes('intelligence')) return false;
                                                                            return true;
                                                                        }).map((subItem)=>{
                                                                            const subActive = isSubItemActive(subItem.url);
                                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                                href: subItem.url,
                                                                                className: `
                                          flex items-center gap-3 px-3 py-2 rounded-xl
                                          text-sm font-medium transition-all duration-200
                                          ${subActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                                        `,
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(subItem.icon, {
                                                                                        className: "w-4 h-4"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                                        lineNumber: 358,
                                                                                        columnNumber: 41
                                                                                    }, this),
                                                                                    subItem.title
                                                                                ]
                                                                            }, subItem.title, true, {
                                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                                lineNumber: 346,
                                                                                columnNumber: 39
                                                                            }, this);
                                                                        })
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                    lineNumber: 334,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                lineNumber: 329,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, item.title, true, {
                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                        lineNumber: 305,
                                                        columnNumber: 27
                                                    }, this);
                                                }
                                                // Expanded sidebar with sub-items
                                                if (hasSubItems && !isCollapsed) {
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>{
                                                                    router.push(item.url);
                                                                    if (!expanded) {
                                                                        toggleExpanded(item.title);
                                                                    }
                                                                },
                                                                className: `
                                group relative w-full flex items-center justify-between
                                px-4 py-3.5 rounded-2xl text-base font-medium
                                transition-all duration-200
                                ${active ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border-l-2 border-l-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'text-muted-foreground hover:bg-white/5 hover:text-white border-l-2 border-transparent'}
                              `,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex items-center gap-4",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                                                className: `
                                    w-7 h-7 transition-all duration-300
                                    ${active ? 'text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] scale-110' : 'text-muted-foreground group-hover:text-foreground group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'}
                                  `
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                                lineNumber: 391,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: `
                                    text-lg font-medium transition-colors duration-200 whitespace-nowrap overflow-hidden
                                    ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                                  `,
                                                                                children: item.title
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                                lineNumber: 400,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                        lineNumber: 390,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        onClick: (e)=>{
                                                                            e.stopPropagation();
                                                                            toggleExpanded(item.title);
                                                                        },
                                                                        className: "p-1 hover:bg-white/10 rounded-lg",
                                                                        children: expanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                            className: "w-5 h-5 text-muted-foreground transition-transform duration-200"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                            lineNumber: 417,
                                                                            columnNumber: 35
                                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                                            className: "w-5 h-5 text-muted-foreground transition-transform duration-200"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                            lineNumber: 419,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                        lineNumber: 409,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                lineNumber: 373,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                              `,
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "pl-4 space-y-0.5 pt-1",
                                                                    children: item.subItems?.filter((subItem)=>{
                                                                        if (isSecretaria && subItem.url.includes('intelligence')) return false;
                                                                        return true;
                                                                    }).map((subItem)=>{
                                                                        const subActive = isSubItemActive(subItem.url);
                                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                            href: subItem.url,
                                                                            className: `
                                          group flex items-center gap-3 px-4 py-2.5 rounded-xl
                                          text-sm font-medium transition-all duration-200
                                          ${subActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                                        `,
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(subItem.icon, {
                                                                                    className: `
                                            w-5 h-5 transition-all duration-200
                                            ${subActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}
                                          `
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                                    lineNumber: 451,
                                                                                    columnNumber: 41
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "whitespace-nowrap overflow-hidden text-ellipsis",
                                                                                    children: subItem.title
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                                    lineNumber: 457,
                                                                                    columnNumber: 41
                                                                                }, this)
                                                                            ]
                                                                        }, subItem.title, true, {
                                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                            lineNumber: 439,
                                                                            columnNumber: 39
                                                                        }, this);
                                                                    })
                                                                }, void 0, false, {
                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                    lineNumber: 430,
                                                                    columnNumber: 31
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                lineNumber: 424,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, item.title, true, {
                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                        lineNumber: 372,
                                                        columnNumber: 27
                                                    }, this);
                                                }
                                                // Normal item without sub-items
                                                const linkContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `flex items-center ${isCollapsed ? '' : 'gap-4'}`,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                                    className: `
                                w-7 h-7 transition-all duration-300
                                ${active ? 'text-primary fill-primary/20 drop-shadow-[0_0_12px_rgba(37,99,235,0.8)] scale-110 rotate-3' : 'text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] group-hover:scale-105'}
                              `
                                                                }, void 0, false, {
                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                    lineNumber: 471,
                                                                    columnNumber: 29
                                                                }, this),
                                                                !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `
                                  text-lg font-medium transition-colors duration-200 whitespace-nowrap overflow-hidden
                                  ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                                `,
                                                                    children: item.title
                                                                }, void 0, false, {
                                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                    lineNumber: 481,
                                                                    columnNumber: 31
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                            lineNumber: 470,
                                                            columnNumber: 27
                                                        }, this),
                                                        !isCollapsed && item.badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Badge"], {
                                                            variant: item.variant === 'new' ? 'default' : 'secondary',
                                                            className: `
                                text-[10px] px-2 h-5 rounded-full border
                                ${item.variant === 'new' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-accent/50 text-foreground border-border'}
                              `,
                                                            children: item.badge
                                                        }, void 0, false, {
                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                            lineNumber: 492,
                                                            columnNumber: 29
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                    lineNumber: 469,
                                                    columnNumber: 25
                                                }, this);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipTrigger"], {
                                                            asChild: true,
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                href: item.url,
                                                                onClick: ()=>setExpandedItems([]),
                                                                className: `
                                group relative w-full block
                                ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}
                                rounded-2xl text-base font-medium
                                transition-all duration-200
                                ${active ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border-l-2 border-l-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'text-muted-foreground hover:bg-white/5 hover:text-white border-l-2 border-transparent'}
                              `,
                                                                children: linkContent
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                lineNumber: 511,
                                                                columnNumber: 29
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                            lineNumber: 510,
                                                            columnNumber: 27
                                                        }, this),
                                                        isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipContent"], {
                                                            side: "right",
                                                            className: "bg-card text-foreground border-border",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    item.title,
                                                                    item.badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Badge"], {
                                                                        variant: "secondary",
                                                                        className: "text-xs",
                                                                        children: item.badge
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                        lineNumber: 533,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                                lineNumber: 530,
                                                                columnNumber: 31
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                            lineNumber: 529,
                                                            columnNumber: 29
                                                        }, this)
                                                    ]
                                                }, item.title, true, {
                                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                                    lineNumber: 509,
                                                    columnNumber: 25
                                                }, this);
                                            })
                                        ]
                                    }, group.label, true, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                        lineNumber: 284,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                lineNumber: 243,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                        lineNumber: 213,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                    lineNumber: 212,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `flex-shrink-0 border-t border-border ${isCollapsed ? 'p-1 space-y-2.5' : 'p-4 space-y-2.5'}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$theme$2d$toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeToggle"], {
                            isCollapsed: isCollapsed
                        }, void 0, false, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                            lineNumber: 552,
                            columnNumber: 11
                        }, this),
                        (()=>{
                            const active = isActive('/settings');
                            const linkContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex items-center ${isCollapsed ? '' : 'gap-4'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                            className: `
                      w-7 h-7 transition-all duration-200
                      ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                      group-hover:scale-105
                    `
                                        }, void 0, false, {
                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                            lineNumber: 560,
                                            columnNumber: 19
                                        }, this),
                                        !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `
                        text-lg font-medium transition-colors duration-200 whitespace-nowrap overflow-hidden
                        ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                      `,
                                            children: "Configuracoes"
                                        }, void 0, false, {
                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                            lineNumber: 568,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                    lineNumber: 559,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                lineNumber: 558,
                                columnNumber: 15
                            }, this);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipTrigger"], {
                                        asChild: true,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/settings",
                                            className: `
                      group relative w-full block
                      ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}
                      rounded-2xl text-base font-medium
                      transition-all duration-200
                      ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                    `,
                                            children: linkContent
                                        }, void 0, false, {
                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                            lineNumber: 584,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                        lineNumber: 583,
                                        columnNumber: 17
                                    }, this),
                                    isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipContent"], {
                                        side: "right",
                                        className: "bg-card text-foreground border-border",
                                        children: "Configuracoes"
                                    }, void 0, false, {
                                        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                        lineNumber: 601,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                lineNumber: 582,
                                columnNumber: 15
                            }, this);
                        })(),
                        !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-3 px-3 py-2.5 bg-white/5 rounded-2xl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm text-muted-foreground mb-2 truncate",
                                    children: userProfile.email
                                }, void 0, false, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                    lineNumber: 612,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    size: "sm",
                                    onClick: handleSignOut,
                                    className: "w-full justify-start px-2.5 py-2 h-9 rounded-2xl text-base text-muted-foreground hover:text-foreground hover:bg-accent",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                            className: "mr-2 h-5 w-5"
                                        }, void 0, false, {
                                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                            lineNumber: 621,
                                            columnNumber: 17
                                        }, this),
                                        "Sair"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                                    lineNumber: 615,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                            lineNumber: 611,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
                    lineNumber: 551,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
            lineNumber: 211,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppSidebar.tsx",
        lineNumber: 210,
        columnNumber: 5
    }, this);
}
}),
"[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppHeader.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppHeader",
    ()=>AppHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/lucide-react/dist/esm/icons/log-out.js [app-ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashmedpro-1/dashmed-nextjs/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function AppHeader({ userProfile }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleLogout = async ()=>{
        try {
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])();
            await supabase.auth.signOut();
            __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success('Logout realizado');
            router.push('/login');
            router.refresh();
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('Erro ao fazer logout');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "h-16 border-b bg-card flex items-center justify-end px-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
            variant: "ghost",
            size: "sm",
            onClick: handleLogout,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashmedpro$2d$1$2f$dashmed$2d$nextjs$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                    className: "h-4 w-4 mr-2"
                }, void 0, false, {
                    fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppHeader.tsx",
                    lineNumber: 27,
                    columnNumber: 17
                }, this),
                "Sair"
            ]
        }, void 0, true, {
            fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppHeader.tsx",
            lineNumber: 26,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashmedpro-1/dashmed-nextjs/src/components/layout/AppHeader.tsx",
        lineNumber: 25,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__65fb36e6._.js.map