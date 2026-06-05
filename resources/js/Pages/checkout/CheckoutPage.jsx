import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLanguage } from "@/Contexts/LanguageContext";
import axios from "axios";

// Import checkout components
import ShippingAddress from "@/Components/checkout/ShippingAddress";
import WarehouseSelection from "@/Components/checkout/WarehouseSelection";
import ShippingServiceOptions from "@/Components/checkout/ShippingServiceOptions";
import PaymentMethodSelection from "@/Components/checkout/PaymentMethodSelection";
import OrderNotes from "@/Components/checkout/OrderNotes";
import OrderSummary from "@/Components/checkout/OrderSummary";

const CART_KEY = "fayyfir_cart";

export default function CheckoutPage({ user, storeBranches }) {
    const { t, locale } = useLanguage();
    const isRtl = locale === 'arabic';

    const [cartItems, setCartItems] = useState([]);
    const [stocksData, setStocksData] = useState({});
    const [isLoadingStock, setIsLoadingStock] = useState(true);

    // Address States
    const [addressForm, setAddressForm] = useState({
        receiver_name: user?.receiver_name ?? user?.name ?? '',
        phone: user?.phone ?? '',
        address: user?.address ?? '',
        province: user?.province ?? '',
        city: user?.city ?? '',
        district: user?.district ?? '',
        postal_code: user?.postal_code ?? '',
        area_id: user?.area_id ?? '',
    });

    // Warehouse/Branch Selection
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    // Shipping Rates States
    const [rates, setRates] = useState([]);
    const [isLoadingRates, setIsLoadingRates] = useState(false);
    const [selectedRate, setSelectedRate] = useState(null);

    // Order/Payment details
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [notes, setNotes] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Load Cart Items and Check Branch Stock levels
    useEffect(() => {
        const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        setCartItems(items);

        if (items.length === 0) {
            router.visit('/cart');
            return;
        }

        // Fetch stock levels for all branches
        setIsLoadingStock(true);
        axios.post(route('checkout.check-stock'), {
            items: items.map(item => ({ id: item.id, variantId: item.variantId }))
        })
        .then(res => {
            if (res.data && res.data.stocks) {
                setStocksData(res.data.stocks);

                // Auto select default branch based on user's country code
                // Defaults: ID = 1 (Mojokerto), MY = 2 (Selangor), SA = 3 (Riyadh)
                const userCountry = user?.country ?? 'ID';
                let defaultBranch = storeBranches.find(b => b.code === userCountry && b.is_active);

                if (!defaultBranch) {
                    defaultBranch = storeBranches.find(b => b.is_default && b.is_active) || storeBranches[0];
                }

                // Verify stock in default branch. If out of stock, see if another branch has it
                const defaultBranchStocks = res.data.stocks[defaultBranch?.id] || [];
                const isOutOfStockInDefault = items.some(item => {
                    const stockItem = defaultBranchStocks.find(s => s.id === item.id && s.variantId === item.variantId);
                    return !stockItem || stockItem.stock < item.quantity;
                });

                if (isOutOfStockInDefault) {
                    // Try to find a branch that has stock for all items
                    const matchingBranch = storeBranches.find(branch => {
                        const branchStocks = res.data.stocks[branch.id] || [];
                        return items.every(item => {
                            const stockItem = branchStocks.find(s => s.id === item.id && s.variantId === item.variantId);
                            return stockItem && stockItem.stock >= item.quantity;
                        });
                    });
                    if (matchingBranch) {
                        setSelectedBranchId(matchingBranch.id);
                    } else {
                        setSelectedBranchId(defaultBranch?.id);
                    }
                } else {
                    setSelectedBranchId(defaultBranch?.id);
                }
            }
        })
        .catch(err => {
            console.error("Error loading stocks:", err);
            // Fallback to first branch
            setSelectedBranchId(storeBranches[0]?.id);
        })
        .finally(() => {
            setIsLoadingStock(false);
        });
    }, [user, storeBranches]);

    // Trigger Shipping Rate Fetching when Branch, Area, or Cart changes
    useEffect(() => {
        if (!selectedBranchId || !addressForm.area_id || cartItems.length === 0) {
            return;
        }

        setIsLoadingRates(true);
        setSelectedRate(null);
        setRates([]);

        axios.post(route('checkout.rates'), {
            origin_branch_id: selectedBranchId,
            destination_area_id: addressForm.area_id,
            items: cartItems.map(item => ({
                id: item.id,
                variantId: item.variantId,
                quantity: item.quantity
            }))
        })
        .then(res => {
            if (res.data && res.data.rates) {
                setRates(res.data.rates);
                if (res.data.rates.length > 0) {
                    setSelectedRate(res.data.rates[0]);
                }
            }
        })
        .catch(err => {
            console.error("Rates fetch failed:", err);
            setErrorMsg("Gagal memuat tarif pengiriman. Silakan coba lagi.");
        })
        .finally(() => {
            setIsLoadingRates(false);
        });
    }, [selectedBranchId, addressForm.area_id, cartItems]);

    // Financial Formatting
    const formatPrice = (value) => {
        const currencyCode = locale === "indonesia" ? "IDR" : "SAR";
        const formatterLocale = locale === "indonesia" ? "id-ID-u-nu-latn" : locale === "arabic" ? "ar-SA-u-nu-latn" : "en-US-u-nu-latn";

        return new Intl.NumberFormat(formatterLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatNumber = (value) =>
        new Intl.NumberFormat("en-US-u-nu-latn", {
            maximumFractionDigits: 0,
        }).format(value || 0);

    // Sum financial details
    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cartItems]);

    const shippingCost = selectedRate ? selectedRate.price : 0;
    const grandTotal = subtotal + shippingCost;

    // Evaluate stock for the selected warehouse
    const currentBranchStockStatus = useMemo(() => {
        if (!selectedBranchId || Object.keys(stocksData).length === 0) return { ok: true, problems: [] };

        const branchStocks = stocksData[selectedBranchId] || [];
        const problems = [];

        cartItems.forEach(item => {
            const stockRecord = branchStocks.find(s => s.id === item.id && s.variantId === item.variantId);
            const availableStock = stockRecord ? stockRecord.stock : 0;
            if (availableStock < item.quantity) {
                problems.push({
                    title: item.title,
                    size: item.size,
                    color: item.color,
                    needed: item.quantity,
                    available: availableStock
                });
            }
        });

        return {
            ok: problems.length === 0,
            problems
        };
    }, [selectedBranchId, stocksData, cartItems]);

    const handlePlaceOrder = (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!addressForm.receiver_name || !addressForm.phone || !addressForm.address || !addressForm.area_id) {
            setErrorMsg(t("checkout.validation.address_incomplete", "Mohon lengkapi alamat pengiriman dan pilih Area ID."));
            return;
        }

        if (!currentBranchStockStatus.ok) {
            setErrorMsg(t("checkout.validation.insufficient_stock", "Stok di gudang pengirim tidak mencukupi untuk beberapa produk. Silakan pilih cabang alternatif."));
            return;
        }

        if (!selectedRate) {
            setErrorMsg(t("checkout.validation.courier_required", "Mohon pilih jasa pengiriman."));
            return;
        }

        setIsPlacingOrder(true);

        const payload = {
            store_branch_id: selectedBranchId,
            shipping_courier: selectedRate.courier_name,
            shipping_service: selectedRate.courier_service_name,
            shipping_cost: shippingCost,
            shipping_address: `${addressForm.address}, ${addressForm.district ? addressForm.district + ', ' : ''}${addressForm.city}, ${addressForm.province} ${addressForm.postal_code}`,
            notes: notes,
            payment_method: paymentMethod,
            area_id: addressForm.area_id,
            items: cartItems.map(item => ({
                id: item.id,
                variantId: item.variantId,
                quantity: item.quantity
            }))
        };

        axios.post(route('checkout.place-order'), payload)
            .then(res => {
                if (res.data && res.data.success) {
                    // Clear Cart
                    localStorage.removeItem(CART_KEY);
                    window.dispatchEvent(new Event("fayyfir-cart-updated"));
                    // Redirect to success page
                    router.visit(route('checkout.success', res.data.order.id));
                } else {
                    setErrorMsg(res.data.message || "Gagal membuat pesanan.");
                }
            })
            .catch(err => {
                console.error(err);
                setErrorMsg(err.response?.data?.message || "Terjadi kesalahan saat memproses pesanan Anda.");
            })
            .finally(() => {
                setIsPlacingOrder(false);
            });
    };

    const selectedBranch = storeBranches.find(b => b.id === selectedBranchId);

    return (
        <MainLayout>
            <Head title={`${t("checkout.title", "Checkout")} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen pb-20 font-sans bg-slate-50 pt-28">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200/60">
                        <Link href="/cart" className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="font-['Cinzel'] text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                                {t("checkout.title", "Checkout Pembayaran")}
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">
                                {t("checkout.subtitle", "Harap periksa pesanan dan konfirmasi detail pengiriman Anda.")}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
                        {/* Left Column: Form & Selections */}
                        <div className="space-y-6">
                            {/* Stock warning banner if warehouse stock is insufficient */}
                            {!currentBranchStockStatus.ok && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border border-rose-200 bg-rose-50 rounded-2xl">
                                    <div className="flex gap-3">
                                        <AlertCircle className="flex-shrink-0 w-5 h-5 text-rose-600" />
                                        <div>
                                            <h3 className="text-sm font-bold text-rose-800">
                                                {t("checkout.stock_error.title", "Stok Gudang Terpilih Kurang")}
                                            </h3>
                                            <p className="mt-1 text-xs text-rose-700">
                                                {t("checkout.stock_error.desc", "Cabang ini tidak memiliki stok yang cukup untuk produk berikut:")}
                                            </p>
                                            <ul className="mt-2 text-xs divide-y divide-rose-100/50">
                                                {currentBranchStockStatus.problems.map((p, idx) => (
                                                    <li key={idx} className="py-1 text-rose-800">
                                                        <strong>{p.title}</strong> {p.size ? `(${p.size})` : ''} - {t("checkout.stock_error.needed", "Dibutuhkan")}: {p.needed}, {t("checkout.stock_error.available", "Tersedia")}: {p.available}
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="mt-3 text-xs font-semibold text-rose-900">
                                                {t("checkout.stock_error.action", "Silakan pilih Cabang Gudang Alternatif di bawah yang memiliki stok mencukupi.")}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Section 1: Alamat Pengiriman */}
                            <ShippingAddress
                                t={t}
                                user={user}
                                addressForm={addressForm}
                                setAddressForm={setAddressForm}
                            />

                            {/* Section 2: Gudang Pengirim (Warehouse Switcher) */}
                            <WarehouseSelection
                                t={t}
                                storeBranches={storeBranches}
                                selectedBranchId={selectedBranchId}
                                setSelectedBranchId={setSelectedBranchId}
                                stocksData={stocksData}
                                cartItems={cartItems}
                                userCountry={user?.country ?? 'ID'}
                            />

                            {/* Section 3: Jasa Pengiriman (Shipping Rates) */}
                            <ShippingServiceOptions
                                t={t}
                                areaId={addressForm.area_id}
                                isLoadingRates={isLoadingRates}
                                rates={rates}
                                selectedRate={selectedRate}
                                setSelectedRate={setSelectedRate}
                                formatPrice={formatPrice}
                            />

                            {/* Section 4: Metode Pembayaran (Payment Method) */}
                            <PaymentMethodSelection
                                t={t}
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                            />

                            {/* Section 5: Catatan Pesanan */}
                            <OrderNotes
                                t={t}
                                notes={notes}
                                setNotes={setNotes}
                            />
                        </div>

                        {/* Right Column: Order Summary & Pay */}
                        <OrderSummary
                            t={t}
                            cartItems={cartItems}
                            selectedBranch={selectedBranch}
                            selectedRate={selectedRate}
                            subtotal={subtotal}
                            shippingCost={shippingCost}
                            grandTotal={grandTotal}
                            errorMsg={errorMsg}
                            isPlacingOrder={isPlacingOrder}
                            formatPrice={formatPrice}
                            formatNumber={formatNumber}
                            handlePlaceOrder={handlePlaceOrder}
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </MainLayout>
    );
}
