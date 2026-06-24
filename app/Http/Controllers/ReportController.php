<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\StoreBranch;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        // --- Monthly Revenue & Order Count (last 12 months) ---
        $monthlySales = collect();
        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $revenue = Order::where('status', 'completed')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('total_amount');
            $orderCount = Order::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();

            $monthlySales->push([
                'label' => $month->format('M Y'),
                'month' => $month->format('M'),
                'revenue' => (float) $revenue,
                'orders' => $orderCount,
            ]);
        }

        // --- Orders by Status ---
        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($row) => [$row->status => $row->count]);

        // --- Top 10 Best-Selling Products ---
        $topProducts = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(quantity * price) as total_revenue'))
            ->whereHas('order', fn($q) => $q->where('status', 'completed'))
            ->with('product:id,title,name_translations,slug')
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(10)
            ->get()
            ->map(fn($item) => [
                'name' => $item->product?->name ?? 'Unknown',
                'slug' => $item->product?->slug,
                'total_qty' => (int) $item->total_qty,
                'total_revenue' => (float) $item->total_revenue,
            ]);

        // --- Revenue by Store Branch ---
        $revenueByBranch = Order::where('status', 'completed')
            ->select('store_branch_id', DB::raw('SUM(total_amount) as revenue'), DB::raw('COUNT(*) as orders'))
            ->with('storeBranch:id,name')
            ->groupBy('store_branch_id')
            ->get()
            ->map(fn($row) => [
                'branch' => $row->storeBranch?->name ?? 'Unknown',
                'revenue' => (float) $row->revenue,
                'orders' => (int) $row->orders,
            ]);

        // --- Recent Transactions (last 15) ---
        $recentTransactions = Order::with(['user:id,name,email', 'storeBranch:id,name'])
            ->latest()
            ->take(15)
            ->get()
            ->map(fn($o) => [
                'invoice' => $o->invoice_number,
                'customer' => $o->user?->name ?? 'Guest',
                'email' => $o->user?->email ?? '',
                'branch' => $o->storeBranch?->name ?? '-',
                'total' => (float) $o->total_amount,
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'date' => $o->created_at->format('d M Y'),
            ]);

        // --- Summary Stats ---
        $totalRevenue = Order::where('status', 'completed')->sum('total_amount');
        $totalOrders = Order::count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalProductsSold = OrderItem::whereHas('order', fn($q) => $q->where('status', 'completed'))->sum('quantity');

        $startOfMonth = $now->copy()->startOfMonth();
        $revenueThisMonth = Order::where('status', 'completed')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('total_amount');
        $ordersThisMonth = Order::where('created_at', '>=', $startOfMonth)->count();

        return Inertia::render('backoffice/menu/Reports', [
            'stats' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalOrders' => $totalOrders,
                'totalCustomers' => $totalCustomers,
                'totalProductsSold' => (int) $totalProductsSold,
                'revenueThisMonth' => (float) $revenueThisMonth,
                'ordersThisMonth' => $ordersThisMonth,
            ],
            'monthlySales' => $monthlySales,
            'ordersByStatus' => $ordersByStatus,
            'topProducts' => $topProducts,
            'revenueByBranch' => $revenueByBranch,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}
