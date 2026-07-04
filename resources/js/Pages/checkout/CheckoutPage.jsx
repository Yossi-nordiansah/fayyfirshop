import React, { useEffect, useMemo, useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import { useLanguage } from "@/Contexts/LanguageContext";
import axios from "axios";

// Import checkout components
import ShippingAddress from "@/Components/checkout/ShippingAddress";
import WarehouseSelection from "@/Components/checkout/WarehouseSelection";
import ShippingServiceOptions from "@/Components/checkout/ShippingServiceOptions";
import PaymentMethodSelection from "@/Components/checkout/PaymentMethodSelection";
import OrderNotes from "@/Components/checkout/OrderNotes";
import OrderSummary from "@/Components/checkout/OrderSummary";

export default function CheckoutPage({ user, storeBranches, userVouchers = [], addresses = [] }) {
    const { t, locale } = useLanguage();
    const isRtl = locale === 'arabic';

    const [cartItems, setCartItems] = useState([]);
    const [stocksData, setStocksData] = useState({});
    const [isLoadingStock, setIsLoadingStock] = useState(true);

    // Voucher States
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedManualVoucher, setAppliedManualVoucher] = useState(null);
    const [appliedEventVoucher, setAppliedEventVoucher] = useState(null);
    const [voucherError, setVoucherError] = useState("");
    const [voucherSuccess, setVoucherSuccess] = useState("");
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    // Referral States
    const [appliedReferral, setAppliedReferral] = useState(null);

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
        country: user?.country ?? 'ID',
    });

    // Reload user and addresses from server on mount (so that going back from Edit Profile gets fresh address data)
    useEffect(() => {
        router.reload({ only: ['addresses', 'user'] });
    }, []);

    const prevAddresses = useRef(addresses);
    const prevAddressesLength = useRef(addresses.length);

    // Sync addressForm with the latest addresses prop from Inertia
    useEffect(() => {
        if (addresses && addresses.length > 0) {
            // If a new address was added (addresses list length increased), auto-select it
            if (addresses.length > prevAddressesLength.current) {
                const newAddr = addresses.find(addr => !prevAddresses.current.some(p => p.id === addr.id));
                if (newAddr) {
                    setAddressForm({
                        receiver_name: newAddr.receiver_name ?? '',
                        phone: newAddr.phone ?? '',
                        address: newAddr.address ?? '',
                        province: newAddr.province ?? '',
                        city: newAddr.city ?? '',
                        district: newAddr.district ?? '',
                        postal_code: newAddr.postal_code ?? '',
                        area_id: newAddr.area_id ?? '',
                        country: newAddr.country ?? 'ID',
                    });
                }
            } else {
                // Otherwise, fall back to default behavior (e.g. initial mount or update to default status)
                const activeAddr = addresses.find(a => a.is_default) || addresses[0];
                if (activeAddr) {
                    setAddressForm({
                        receiver_name: activeAddr.receiver_name ?? '',
                        phone: activeAddr.phone ?? '',
                        address: activeAddr.address ?? '',
                        province: activeAddr.province ?? '',
                        city: activeAddr.city ?? '',
                        district: activeAddr.district ?? '',
                        postal_code: activeAddr.postal_code ?? '',
                        area_id: activeAddr.area_id ?? '',
                        country: activeAddr.country ?? 'ID',
                    });
                }
            }
        }
        prevAddresses.current = addresses;
        prevAddressesLength.current = addresses.length;
    }, [addresses]);

    // Warehouse/Branch Selection
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    // Shipping Rates States
    const [rates, setRates] = useState([]);
    const [isLoadingRates, setIsLoadingRates] = useState(false);
    const [selectedRate, setSelectedRate] = useState(null);

    // Order/Payment details
    const [paymentMethod, setPaymentMethod] = useState("bca_va");
    const [notes, setNotes] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [backUrl, setBackUrl] = useState("/cart");

    // Load Cart Items and Check Branch Stock levels
    useEffect(() => {
        const checkoutKey = user ? `fayyfir_checkout_${user.id}` : "fayyfir_checkout";
        const sourceKey = user ? `fayyfir_checkout_source_${user.id}` : "fayyfir_checkout_source";
        const items = JSON.parse(localStorage.getItem(checkoutKey) || "[]");
        setCartItems(items);

        if (items.length === 0) {
            router.visit('/cart');
            return;
        }

        const source = localStorage.getItem(sourceKey);
        if (source === 'detail' && items.length > 0 && items[0].slug) {
            setBackUrl(`/product/${items[0].slug}`);
        } else {
            setBackUrl('/cart');
        }

        // Fetch stock levels for all branches
        setIsLoadingStock(true);
        axios.post(route('checkout.check-stock'), {
            items: items.map(item => ({ id: item.id, variantId: item.variantId }))
        })
            .then(res => {
                if (res.data) {
                    let updatedItems = [...items];
                    if (res.data.weights) {
                        updatedItems = items.map(item => {
                            const key = `${item.id}-${item.variantId ?? 'null'}`;
                            const freshWeight = res.data.weights[key];
                            if (freshWeight !== undefined && freshWeight !== item.weight) {
                                return { ...item, weight: freshWeight };
                            }
                            return item;
                        });
                        setCartItems(updatedItems);
                        localStorage.setItem(checkoutKey, JSON.stringify(updatedItems));
                    }

                    if (res.data.stocks) {
                        setStocksData(res.data.stocks);

                        // Auto select default branch based on user's country code
                        // Defaults: ID = 1 (Mojokerto), MY = 2 (Selangor), SA = 3 (Riyadh)
                        const userCountry = addressForm.country ?? user?.country ?? 'ID';
                        let defaultBranch = storeBranches.find(b => b.code === userCountry && b.is_active);

                        if (!defaultBranch) {
                            defaultBranch = storeBranches.find(b => b.is_default && b.is_active) || storeBranches[0];
                        }

                        // Verify stock in default branch. If out of stock, see if another branch has it
                        const defaultBranchStocks = res.data.stocks[defaultBranch?.id] || [];
                        const isOutOfStockInDefault = updatedItems.some(item => {
                            const stockItem = defaultBranchStocks.find(s => s.id === item.id && s.variantId === item.variantId);
                            return !stockItem || stockItem.stock < item.quantity;
                        });

                        if (isOutOfStockInDefault) {
                            // Try to find a branch that has stock for all items
                            const matchingBranch = storeBranches.find(branch => {
                                const branchStocks = res.data.stocks[branch.id] || [];
                                return updatedItems.every(item => {
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

    // Sync selectedBranchId automatically when address country changes
    useEffect(() => {
        if (addressForm.country && storeBranches.length > 0) {
            const targetBranch = storeBranches.find(b => b.code === addressForm.country && b.is_active);
            if (targetBranch) {
                setSelectedBranchId(targetBranch.id);
            }
        }
    }, [addressForm.country, storeBranches]);

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
        const currencySymbol = locale === "indonesia" ? "Rp" : "IDR";
        const formattedNumber = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);

        return `${currencySymbol} ${formattedNumber}`;
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

    // Recalculate voucher discounts on the client side in stackable order (Manual first, then Event)
    const manualDiscount = useMemo(() => {
        if (!appliedManualVoucher) return 0;
        let discount = 0;
        if (appliedManualVoucher.type === 'fixed') {
            discount = parseFloat(appliedManualVoucher.value);
        } else if (appliedManualVoucher.type === 'percentage') {
            discount = subtotal * (parseFloat(appliedManualVoucher.value) / 100);
            if (appliedManualVoucher.max_discount > 0 && discount > appliedManualVoucher.max_discount) {
                discount = parseFloat(appliedManualVoucher.max_discount);
            }
        }
        return Math.min(discount, subtotal);
    }, [appliedManualVoucher, subtotal]);

    const eventDiscount = useMemo(() => {
        if (!appliedEventVoucher) return 0;
        const remainingSubtotal = Math.max(0, subtotal - manualDiscount);
        let discount = 0;
        if (appliedEventVoucher.type === 'fixed') {
            discount = parseFloat(appliedEventVoucher.value);
        } else if (appliedEventVoucher.type === 'percentage') {
            discount = remainingSubtotal * (parseFloat(appliedEventVoucher.value) / 100);
            if (appliedEventVoucher.max_discount > 0 && discount > appliedEventVoucher.max_discount) {
                discount = parseFloat(appliedEventVoucher.max_discount);
            }
        }
        return Math.min(discount, remainingSubtotal);
    }, [appliedEventVoucher, subtotal, manualDiscount]);

    const referralDiscount = useMemo(() => {
        if (!appliedReferral) return 0;
        const remainingSubtotal = Math.max(0, subtotal - manualDiscount - eventDiscount);
        let discount = 0;
        if (appliedReferral.type === 'fixed') {
            discount = parseFloat(appliedReferral.value);
        } else if (appliedReferral.type === 'percentage') {
            discount = remainingSubtotal * (parseFloat(appliedReferral.value) / 100);
        }
        return Math.min(discount, remainingSubtotal);
    }, [appliedReferral, subtotal, manualDiscount, eventDiscount]);

    const appliedDiscount = manualDiscount + eventDiscount + referralDiscount;
    const grandTotal = Math.max(0, subtotal + shippingCost - appliedDiscount);

    const totalWeight = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            let itemWeight = item.weight;
            if (itemWeight === undefined || itemWeight === null || itemWeight === 0) {
                const textToParse = String(item.size || item.title || '');
                const matches = textToParse.match(/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g|ml|l|pcs)?/i);
                if (matches) {
                    let valueStr = matches[1];
                    const unit = matches[2] ? matches[2].toLowerCase() : '';
                    
                    const isKgOrL = ['kg', 'kilogram', 'l'].includes(unit);
                    if (!isKgOrL && /\.\d{3}$/.test(valueStr)) {
                        valueStr = valueStr.replace('.', '');
                    }
                    
                    const value = parseFloat(valueStr);
                    if (unit === 'kg' || unit === 'kilogram') {
                        itemWeight = Math.round(value * 1000);
                    } else if (['g', 'gr', 'gram'].includes(unit)) {
                        itemWeight = Math.round(value);
                    } else {
                        itemWeight = Math.round(value);
                    }
                } else {
                    itemWeight = 1000;
                }
            }
            return sum + (itemWeight * item.quantity);
        }, 0);
    }, [cartItems]);

    // Apply Manual Voucher Handler (dropdown selection)
    const handleApplyManualVoucher = (voucherId) => {
        setVoucherError("");
        setVoucherSuccess("");
        setIsApplyingVoucher(true);

        const otherDiscount = eventDiscount;

        axios.post(route('checkout.apply-voucher'), {
            subtotal: subtotal,
            other_discount: otherDiscount,
            voucher_id: voucherId
        })
            .then(res => {
                if (res.data && res.data.success) {
                    setAppliedManualVoucher(res.data.voucher);
                    setVoucherSuccess(res.data.message || "Voucher manual berhasil diterapkan.");
                }
            })
            .catch(err => {
                console.error(err);
                setVoucherError(err.response?.data?.message || "Voucher tidak valid.");
            })
            .finally(() => {
                setIsApplyingVoucher(false);
            });
    };

    // Apply Event Voucher / Referral Code Handler (manually typed code)
    const handleApplyEventVoucher = (code) => {
        setVoucherError("");
        setVoucherSuccess("");
        setIsApplyingVoucher(true);

        const otherDiscount = manualDiscount;

        axios.post(route('checkout.apply-voucher'), {
            subtotal: subtotal,
            other_discount: otherDiscount,
            code: code
        })
            .then(res => {
                if (res.data && res.data.success) {
                    if (res.data.applied_type === 'referral') {
                        setAppliedReferral(res.data.referral);
                        setAppliedEventVoucher(null);
                        setVoucherSuccess(res.data.message || "Kode referral berhasil diterapkan.");
                        setVoucherCode(res.data.referral.code);
                    } else {
                        setAppliedEventVoucher(res.data.voucher);
                        setAppliedReferral(null);
                        setVoucherSuccess(res.data.message || "Voucher event berhasil diterapkan.");
                        setVoucherCode(res.data.voucher.code);
                    }
                }
            })
            .catch(err => {
                console.error(err);
                setVoucherError(err.response?.data?.message || "Kode voucher atau referral tidak valid.");
            })
            .finally(() => {
                setIsApplyingVoucher(false);
            });
    };

    const handleRemoveManualVoucher = () => {
        setAppliedManualVoucher(null);
        setVoucherError("");
        setVoucherSuccess("");
    };

    const handleRemoveEventVoucher = () => {
        setAppliedEventVoucher(null);
        setVoucherCode("");
        setVoucherError("");
        setVoucherSuccess("");
    };

    const handleRemoveReferral = () => {
        setAppliedReferral(null);
        setVoucherCode("");
        setVoucherError("");
        setVoucherSuccess("");
    };

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
            })),
            voucher_id: appliedManualVoucher ? appliedManualVoucher.id : null,
            event_voucher_id: appliedEventVoucher ? appliedEventVoucher.id : null,
            event_voucher_code: appliedEventVoucher ? appliedEventVoucher.code : null,
            referral_id: appliedReferral ? appliedReferral.id : null,
            referral_code: appliedReferral ? appliedReferral.code : null,
        };

        axios.post(route('checkout.place-order'), payload)
            .then(res => {
                if (res.data && res.data.success) {
                    const clearCartAndRedirect = (orderId) => {
                        const cartKey = user ? `fayyfir_cart_${user.id}` : "fayyfir_cart";
                        const checkoutKey = user ? `fayyfir_checkout_${user.id}` : "fayyfir_checkout";

                        // Remove purchased items from the main cart
                        const mainCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
                        const updatedMainCart = mainCart.filter(item =>
                            !cartItems.some(purchasedItem =>
                                purchasedItem.id === item.id &&
                                purchasedItem.variantId === item.variantId &&
                                purchasedItem.color === item.color &&
                                purchasedItem.size === item.size
                            )
                        );
                        localStorage.setItem(cartKey, JSON.stringify(updatedMainCart));

                        // Clear the checkout items
                        localStorage.removeItem(checkoutKey);

                        window.dispatchEvent(new Event("fayyfir-cart-updated"));
                        // Redirect to custom payment details page
                        router.visit(route('checkout.payment', orderId));
                    };

                    clearCartAndRedirect(res.data.order.id);
                } else {
                    setErrorMsg(res.data.message || "Gagal membuat pesanan.");
                    setIsPlacingOrder(false);
                }
            })
            .catch(err => {
                console.error(err);
                setErrorMsg(err.response?.data?.message || "Terjadi kesalahan saat memproses pesanan Anda.");
                setIsPlacingOrder(false);
            });
    };

    const selectedBranch = storeBranches.find(b => b.id === selectedBranchId);

    return (
        <MainLayout>
            <Head title={`Fayyfir - ${t("checkout.title", "Checkout")}`} />

            <div className="min-h-screen pb-20 font-sans bg-slate-50 pt-28">
                <div className="px-2 mx-auto w-full sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200/60">
                        <Link href={backUrl} className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                                {t("checkout.title", "Checkout Pembayaran")}
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">
                                {t("checkout.subtitle", "Harap periksa pesanan dan konfirmasi detail pengiriman Anda.")}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_450px]">
                        {/* Left Column: Form & Selections */}
                        <div className="space-y-6 max-w-3xl">
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
                                addresses={addresses}
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
                            locale={locale}
                            cartItems={cartItems}
                            selectedBranch={selectedBranch}
                            selectedRate={selectedRate}
                            subtotal={subtotal}
                            shippingCost={shippingCost}
                            grandTotal={grandTotal}
                            totalWeight={totalWeight}
                            errorMsg={errorMsg}
                            isPlacingOrder={isPlacingOrder}
                            formatPrice={formatPrice}
                            formatNumber={formatNumber}
                            handlePlaceOrder={handlePlaceOrder}
                            userVouchers={userVouchers}
                            voucherCode={voucherCode}
                            setVoucherCode={setVoucherCode}
                            appliedManualVoucher={appliedManualVoucher}
                            appliedEventVoucher={appliedEventVoucher}
                            manualDiscount={manualDiscount}
                            eventDiscount={eventDiscount}
                            applyManualVoucher={handleApplyManualVoucher}
                            applyEventVoucher={handleApplyEventVoucher}
                            removeManualVoucher={handleRemoveManualVoucher}
                            removeEventVoucher={handleRemoveEventVoucher}
                            voucherError={voucherError}
                            voucherSuccess={voucherSuccess}
                            isApplyingVoucher={isApplyingVoucher}
                            appliedReferral={appliedReferral}
                            referralDiscount={referralDiscount}
                            removeReferral={handleRemoveReferral}
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
