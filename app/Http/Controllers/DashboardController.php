<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // --- Summary Stats ---
        $totalRevenue = Order::whereIn('status', ['completed'])
            ->sum('total_amount');

        $totalOrders = Order::count();
        $pendingOrdersCount = Order::where('status', 'pending')->count();
        $processingOrdersCount = Order::where('status', 'processing')->count();

        $totalCustomers = User::where('role', 'customer')->count();
        $newCustomersThisMonth = User::where('role', 'customer')
            ->where('created_at', '>=', $startOfMonth)
            ->count();
        $newCustomersLastMonth = User::where('role', 'customer')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->count();

        $productsSoldThisMonth = OrderItem::whereHas('order', function ($q) use ($startOfMonth) {
            $q->where('status', 'completed')->where('created_at', '>=', $startOfMonth);
        })->sum('quantity');

        $revenueThisMonth = Order::where('status', 'completed')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('total_amount');
        $revenueLastMonth = Order::where('status', 'completed')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total_amount');

        $revenueGrowth = $revenueLastMonth > 0
            ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
            : null;

        $customerGrowth = $newCustomersLastMonth > 0
            ? round((($newCustomersThisMonth - $newCustomersLastMonth) / $newCustomersLastMonth) * 100, 1)
            : null;

        // --- Pending Orders (latest 5) ---
        $pendingOrders = Order::with(['user', 'storeBranch'])
            ->where('status', 'pending')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($o) => [
                'id' => $o->invoice_number,
                'customer' => $o->user->name ?? 'Guest',
                'total' => 'Rp ' . number_format($o->total_amount, 0, ',', '.'),
                'created_at' => $o->created_at->diffForHumans(),
            ]);

        // --- Low Stock Products (stock < 10, excludes stock_type='parent' which tracks stock via branches) ---
        $lowStockProducts = Product::where('stock', '<', 10)
            ->where('stock_type', '!=', 'parent')
            ->orderBy('stock')
            ->take(8)
            ->get()
            ->map(fn($p) => [
                'name' => $p->name,
                'stock' => $p->stock,
                'slug' => $p->slug,
            ]);

        // --- Monthly Sales Trend (last 12 months) ---
        $monthlySales = collect();
        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $revenue = Order::where('status', 'completed')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('total_amount');

            $monthlySales->push([
                'label' => $month->format('M Y'),
                'month' => $month->format('M'),
                'sales' => (float) round($revenue / 1_000_000, 2), // in millions
                'revenue' => (float) $revenue,
            ]);
        }

        return Inertia::render('backoffice/dashboard', [
            'stats' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalOrders' => $totalOrders,
                'pendingOrdersCount' => $pendingOrdersCount,
                'processingOrdersCount' => $processingOrdersCount,
                'totalCustomers' => $totalCustomers,
                'newCustomersThisMonth' => $newCustomersThisMonth,
                'customerGrowth' => $customerGrowth,
                'productsSoldThisMonth' => (int) $productsSoldThisMonth,
                'revenueThisMonth' => (float) $revenueThisMonth,
                'revenueLastMonth' => (float) $revenueLastMonth,
                'revenueGrowth' => $revenueGrowth,
            ],
            'pendingOrders' => $pendingOrders,
            'lowStockProducts' => $lowStockProducts,
            'monthlySales' => $monthlySales,
        ]);
    }

    public function visitorLogs()
    {
        $logs = \App\Models\VisitorLog::latest('id')
            ->paginate(15);

        $countryStats = \App\Models\VisitorLog::select('country', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('country')
            ->orderByDesc('count')
            ->get();

        $timeStats = \App\Models\VisitorLog::select(\Illuminate\Support\Facades\DB::raw('DATE(created_at) as date'), \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => date('d M', strtotime($item->date)),
                    'count' => $item->count,
                ];
            });

        return Inertia::render('backoffice/visitor-logs/Index', [
            'logs' => $logs,
            'countryStats' => $countryStats,
            'timeStats' => $timeStats,
        ]);
    }
}
