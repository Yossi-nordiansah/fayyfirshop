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
    const initialDefaultAddress = addresses && addresses.length > 0
        ? (addresses.find(a => a.is_default) || addresses[0])
        : null;

    const [addressForm, setAddressForm] = useState({
        id: initialDefaultAddress?.id ?? null,
        receiver_name: initialDefaultAddress?.receiver_name ?? user?.receiver_name ?? user?.name ?? '',
        phone: initialDefaultAddress?.phone ?? user?.phone ?? '',
        address: initialDefaultAddress?.address ?? user?.address ?? '',
        province: initialDefaultAddress?.province ?? user?.province ?? '',
        city: initialDefaultAddress?.city ?? user?.city ?? '',
        district: initialDefaultAddress?.district ?? user?.district ?? '',
        postal_code: initialDefaultAddress?.postal_code ?? user?.postal_code ?? '',
        area_id: initialDefaultAddress?.area_id ?? user?.area_id ?? '',
        country: initialDefaultAddress?.country ?? user?.country ?? 'ID',
    });

    // Reload user and addresses from server on mount (so that going back from Edit Profile gets fresh address data)
    useEffect(() => {
        router.reload({ only: ['addresses', 'user'] });
    }, []);

    const prevAddresses = useRef(addresses);
    const prevAddressesLength = useRef(addresses?.length || 0);

    // Sync addressForm with the latest addresses prop from Inertia
    useEffect(() => {
        if (addresses && addresses.length > 0) {
            // If a new address was added (addresses list length increased), auto-select it
            if (addresses.length > prevAddressesLength.current) {
                const newAddr = addresses.find(addr => !prevAddresses.current.some(p => p.id === addr.id));
                if (newAddr) {
                    setAddressForm({
                        id: newAddr.id,
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
                // Keep the currently selected address if available, otherwise pick default
                const currentSelected = addressForm.id ? addresses.find(a => a.id === addressForm.id) : null;
                const activeAddr = currentSelected || addresses.find(a => a.is_default) || addresses[0];
                if (activeAddr) {
                    setAddressForm({
                        id: activeAddr.id,
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
    const [paymentMethod, setPaymentMethod] = useState("bri_va");
    const [notes, setNotes] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [backUrl, setBackUrl] = useState("/cart");

    // Payment error modal state
    const [paymentErrorModal, setPaymentErrorModal] = useState({ show: false, type: 'general' });

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
                        if (res.data.weights || res.data.prices) {
                            updatedItems = items.map(item => {
                                const key = `${item.id}-${item.variantId ?? 'null'}`;
                                const freshWeight = res.data.weights?.[key];
                                const freshPriceInfo = res.data.prices?.[key];
                                let newItem = { ...item };
                                if (freshWeight !== undefined && freshWeight !== item.weight) {
                                    newItem.weight = freshWeight;
                                }
                                if (freshPriceInfo) {
                                    newItem.price = Number(freshPriceInfo.price);
                                    newItem.original_price = Number(freshPriceInfo.original_price);
                                    newItem.discount_price = freshPriceInfo.discount_price ? Number(freshPriceInfo.discount_price) : null;
                                }
                                return newItem;
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

        // Format shipping address cleanly to prevent duplicating area components
        const rawAddr = (addressForm.address || '').trim();
        const districtStr = (addressForm.district || '').trim();
        const cityStr = (addressForm.city || '').trim();
        const provStr = (addressForm.province || '').trim();
        const postalStr = (addressForm.postal_code || '').trim();

        const extraParts = [];
        if (districtStr && !rawAddr.toLowerCase().includes(districtStr.toLowerCase())) {
            extraParts.push(districtStr);
        }
        if (cityStr && !rawAddr.toLowerCase().includes(cityStr.toLowerCase())) {
            extraParts.push(cityStr);
        }
        if (provStr && !rawAddr.toLowerCase().includes(provStr.toLowerCase())) {
            extraParts.push(provStr);
        }
        if (postalStr && !rawAddr.includes(postalStr)) {
            extraParts.push(postalStr);
        }

        const formattedShippingAddress = extraParts.length > 0
            ? `${rawAddr}, ${extraParts.join(', ')}`
            : rawAddr;

        const payload = {
            store_branch_id: selectedBranchId,
            shipping_courier: selectedRate.courier_name,
            shipping_service: selectedRate.courier_service_name,
            shipping_cost: shippingCost,
            receiver_name: addressForm.receiver_name,
            receiver_phone: addressForm.phone,
            shipping_address: formattedShippingAddress,
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
                        // Redirect to custom payment details page with history replace
                        router.visit(route('checkout.payment', orderId), { replace: true });
                    };

                    clearCartAndRedirect(res.data.order.id);
                } else {
                    const rawMsg = (res.data?.message || '').toLowerCase();
                    const isPaymentErr = rawMsg.includes('payment') || rawMsg.includes('doku') || rawMsg.includes('va') || rawMsg.includes('virtual account') || rawMsg.includes('failed to place order') || rawMsg.includes('payment gateway');
                    const isMaintErr = rawMsg.includes('maintenance') || rawMsg.includes('unavailable') || rawMsg.includes('disturbed');

                    if (isMaintErr) {
                        setPaymentErrorModal({ show: true, type: 'maintenance' });
                    } else if (isPaymentErr) {
                        setPaymentErrorModal({ show: true, type: 'general' });
                    } else {
                        setErrorMsg(res.data.message || t('checkout.error.generic', 'Gagal membuat pesanan.'));
                    }
                    setIsPlacingOrder(false);
                }
            })
            .catch(err => {
                console.error(err);
                setIsPlacingOrder(false);

                const status = err.response?.status;
                const rawMsg = (err.response?.data?.message || '').toLowerCase();

                // Detect payment gateway / maintenance errors
                const isPaymentError = status === 500 && (
                    rawMsg.includes('payment gateway') ||
                    rawMsg.includes('payment') ||
                    rawMsg.includes('doku') ||
                    rawMsg.includes('va') ||
                    rawMsg.includes('virtual account') ||
                    rawMsg.includes('failed to place order')
                );

                const isMaintenanceError =
                    status === 503 ||
                    rawMsg.includes('maintenance') ||
                    rawMsg.includes('unavailable') ||
                    rawMsg.includes('not available') ||
                    rawMsg.includes('service unavailable') ||
                    rawMsg.includes('temporary') ||
                    rawMsg.includes('disturbed');

                if (isMaintenanceError) {
                    setPaymentErrorModal({ show: true, type: 'maintenance' });
                } else if (isPaymentError) {
                    setPaymentErrorModal({ show: true, type: 'general' });
                } else {
                    // Non-payment errors (validation, stock, etc.) still show inline
                    setErrorMsg(err.response?.data?.message || t('checkout.error.generic', 'Terjadi kesalahan saat memproses pesanan Anda.'));
                }
            });
    };

    const selectedBranch = storeBranches.find(b => b.id === selectedBranchId);

    return (
        <MainLayout>
            <Head title={t("checkout.title", "Checkout")} />

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
                            <div id="payment-method-section">
                                <PaymentMethodSelection
                                    t={t}
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                />
                            </div>

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
            {/* Payment Error Modal */}
            <AnimatePresence>
                {paymentErrorModal.show && (
                    <motion.div
                        key="payment-error-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setPaymentErrorModal({ show: false, type: 'general' })}
                    >
                        <motion.div
                            key="payment-error-box"
                            initial={{ opacity: 0, scale: 0.88, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 24 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                            dir={isRtl ? 'rtl' : 'ltr'}
                        >
                            {/* Top decorative strip */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500" />

                            <div className="px-7 pt-7 pb-6 flex flex-col items-center text-center gap-4">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-100">
                                    <AlertCircle className="w-8 h-8 text-amber-500" strokeWidth={2} />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                                    {t('checkout.payment_error.title', 'Metode Pembayaran Tidak Tersedia')}
                                </h3>

                                {/* Message */}
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {paymentErrorModal.type === 'maintenance'
                                        ? t('checkout.payment_error.maintenance', 'Metode pembayaran yang Anda pilih sedang dalam pemeliharaan sementara. Silakan pilih metode pembayaran lain atau coba beberapa saat lagi.')
                                        : t('checkout.payment_error.general', 'Terjadi kendala pada proses pembayaran Anda. Silakan coba lagi atau gunakan metode pembayaran yang berbeda.')
                                    }
                                </p>

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentErrorModal({ show: false, type: 'general' });
                                            // Scroll to payment method section
                                            setTimeout(() => {
                                                document.getElementById('payment-method-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 150);
                                        }}
                                        className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        {t('checkout.payment_error.btn_change', 'Pilih Metode Lain')}
                                    </button>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        onClick={() => {
                                            setPaymentErrorModal({ show: false, type: 'general' });
                                            setTimeout(() => {
                                                handlePlaceOrder({ preventDefault: () => {} });
                                            }, 200);
                                        }}
                                        className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white text-sm font-bold shadow-lg hover:brightness-110 transition-all"
                                    >
                                        {t('checkout.payment_error.btn_retry', 'Coba Lagi')}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
}
