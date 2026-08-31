import React, { useEffect, useRef, useState } from "react";
import { Head } from "@inertiajs/react";
import { Printer, ArrowLeft } from "lucide-react";
import JsBarcode from "jsbarcode";

/* ─── Barcode Component (JsBarcode) ─────────────────────── */
// moduleWidth: lebar tiap bar dalam px (default 2 = normal, 1 = kompak)
function Barcode({ value, height = 48, fontSize = 11, showText = false, moduleWidth = 2 }) {
    const svgRef = useRef(null);
    useEffect(() => {
        if (!svgRef.current || !value) return;
        try {
            JsBarcode(svgRef.current, String(value), {
                format: "CODE128",
                width: moduleWidth,
                height,
                fontSize,
                textMargin: 2,
                margin: 4,
                displayValue: showText,
                fontOptions: "bold",
                font: "monospace",
                lineColor: "#111",
                background: "#ffffff",
            });
        } catch (e) {
            console.warn("Barcode error:", e);
        }
    }, [value, height, fontSize, showText, moduleWidth]);
    // margin: 0 auto → center barcode di sumbu X
    return <svg ref={svgRef} style={{ display: "block", maxWidth: "100%", margin: "0 auto" }} />;
}

/* ─── Courier Logo Map ───────────────────────────────────── */
const COURIER_LOGO = {
    pos: "/images/couriers/pos.webp",
    jne: "/images/couriers/jne.webp",
    jnt: "/images/couriers/jnt.webp",
    sicepat: "/images/couriers/sicepat.webp",
    anteraja: "/images/couriers/anteraja.webp",
    gojek: "/images/couriers/gojek.webp",
    grab: "/images/couriers/grab.webp",
    ninja: "/images/couriers/ninja.webp",
    tiki: "/images/couriers/tiki.webp",
    wahana: "/images/couriers/wahana.webp",
};

function getCourierLogo(courier = "") {
    const lower = courier.toLowerCase();
    for (const [k, v] of Object.entries(COURIER_LOGO)) {
        if (lower.includes(k)) return v;
    }
    return null;
}

function maskString(str = "", visibleStart = 1, visibleEnd = 2) {
    if (!str) return "—";
    if (str.length <= visibleStart + visibleEnd) return str;
    const stars = "*".repeat(Math.max(str.length - visibleStart - visibleEnd, 1));
    return str.slice(0, visibleStart) + stars + str.slice(str.length - visibleEnd);
}

function maskPhone(phone = "") {
    if (!phone) return "—";
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 6) return phone;
    const stars = "*".repeat(digits.length - 6);
    return digits.slice(0, 4) + stars + digits.slice(-2);
}

function formatRp(val) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(val || 0);
}

export default function PrintWaybillPage({ order, totalWeightGrams = 1000 }) {
    const [paperSize, setPaperSize] = useState("thermal");

    useEffect(() => {
        const originalTitle = document.title;
        // Kosongkan judul agar header/footer browser tidak muncul saat print
        document.title = '';
        const timer = setTimeout(() => {
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        }, 900);
        return () => clearTimeout(timer);
    }, []);

    const courierRaw = order.shipping_courier || "Ekspedisi";
    const courierDisplay = courierRaw.toUpperCase();
    const serviceDisplay = order.shipping_service || "Reguler";
    const courierLogo = getCourierLogo(courierRaw);

    // resiNumber → nomor resi/AWB untuk barcode BESAR
    // Jika masih PENDING (belum dapat nomor resi), strip prefix-nya agar tetap bisa di-scan
    const resiNumber = order.tracking_number
        ? order.tracking_number.startsWith("PENDING_")
            ? order.tracking_number.replace(/^PENDING_/, "")
            : order.tracking_number
        : "—";

    // invoiceNumber → nomor invoice/pesanan untuk barcode KECIL
    const invoiceNumber = order.invoice_number || "—";

    const weightKg =
        totalWeightGrams >= 1000
            ? Math.ceil(totalWeightGrams / 1000) + " Kg"
            : totalWeightGrams + " gr";


    const recipientName = maskString(
        order.receiver_name || order.user?.receiver_name || order.user?.name || "Pelanggan",
        1, 2
    );
    const recipientPhone = maskPhone(order.receiver_phone || order.user?.phone || "");

    const addressLine = order.shipping_address || (
        order.user?.address
            ? `${order.user.address}, Kec. ${order.user.district || ''}, ${(order.user.city || '').toUpperCase()}, ${(order.user.province || '').toUpperCase()} ${order.user.postal_code || ''}`
            : ""
    );

    // Pengirim: nama cabang + nomor WA dari backoffice cabang
    const senderName = order.store_branch?.name || "Fayyfir Store";
    const senderPhone = order.store_branch?.whatsapp_number || "";
    // Items: semua produk dengan detail lengkap (qty + nama + varian)
    // Product.name adalah virtual accessor, di JSON tersimpan sebagai "title"
    const totalQty = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1;
    const itemsList = order.items?.map((i) => {
        const productName = i.product?.title
            || i.product?.name_translations?.indonesia
            || i.product?.name
            || "Produk";
        const variantLabel = i.variant?.name ? ` - ${i.variant.name}` : "";
        return `${i.quantity || 1}x ${productName}${variantLabel}`;
    }) || [];


    // Catatan: tampilkan jika ada, kosongkan jika tidak ada (tanpa teks "Tidak Ada")
    const cleanNotes = (order.notes || "")
        .replace(/\[Biteship Order ID:[^\]]+\]/gi, "")
        .trim();


    const cell = {
        borderBottom: "1.5px solid #111",
        padding: "6px 8px",
    };

    return (
        <div className="bg-gray-200 font-sans text-black print:bg-white print:p-0">
            <Head title={`Cetak Resi - ${resiNumber}`} />

            {/* Toolbar */}
            <div className="no-print sticky top-0 z-50 bg-slate-900 text-white px-5 py-2.5 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.close()}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
                    >
                        <ArrowLeft size={14} /> Tutup
                    </button>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-bold text-slate-200">
                        Resi:{" "}
                        <span className="font-mono text-amber-400">{resiNumber}</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
                        {["thermal", "a4"].map((size) => (
                            <button
                                key={size}
                                onClick={() => setPaperSize(size)}
                                className={`px-3 py-1.5 rounded-md font-bold transition ${paperSize === size
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {size === "thermal" ? "Thermal (10×15 cm)" : "Kertas A4"}
                            </button>
                        ))}
                    </div>
                    <button
                    onClick={() => {
                            const t = document.title;
                            document.title = '';
                            window.print();
                            setTimeout(() => { document.title = t; }, 500);
                        }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
                    >
                        <Printer size={14} /> Cetak Sekarang
                    </button>
                </div>
            </div>

            {/* Label – screen: flex center; print: block top-left */}
            <div className="label-wrapper flex justify-center py-8">
                <div
                    style={{
                        width: paperSize === "thermal" ? "100mm" : "148mm",
                        background: "white",
                        border: "1px solid #bbb",
                        boxSizing: "border-box",
                        fontFamily: "Arial, sans-serif",
                        fontSize: "10px",
                        color: "#111",
                    }}
                >
                    {/* Row 1 – Logo website (left) + Courier LOGO image (right, large) */}
                    <div style={{ ...cell, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px" }}>
                        {/* Left – logo website Fayyfir */}
                        <div>
                            <img
                                src="/images/logo-footer.png"
                                alt="Fayyfir"
                                style={{ height: "40px", maxWidth: "110px", objectFit: "contain", display: "block" }}
                            />
                        </div>
                        {/* Right – courier logo image (large) */}
                        <div style={{ textAlign: "right" }}>
                            {courierLogo ? (
                                <img
                                    src={courierLogo}
                                    alt={courierDisplay}
                                    style={{ height: "52px", maxWidth: "90px", objectFit: "contain", display: "block" }}
                                />
                            ) : (
                                <div style={{ fontWeight: 900, fontSize: "13px", color: "#333" }}>{courierDisplay}</div>
                            )}
                        </div>
                    </div>

                    {/* Row 2 – Main barcode BESAR = Nomor Resi/AWB */}
                    <div style={{ ...cell, textAlign: "center", padding: "8px 8px 6px" }}>
                        <Barcode value={resiNumber} height={52} fontSize={11} showText={false} moduleWidth={2} />
                        <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "12px", letterSpacing: "1px", marginTop: "3px" }}>
                            {resiNumber}
                        </div>
                    </div>

                    {/* Row 3 – Ongkos Kirim */}
                    <div style={{ ...cell, textAlign: "center", fontWeight: 700, fontSize: "11px" }}>
                        Ongkos Kirim: {formatRp(order.shipping_cost ?? order.shipping_price ?? 0)}
                    </div>

                    {/* Row 4 – Jenis Layanan */}
                    <div style={{ ...cell, textAlign: "center", fontWeight: 700, fontSize: "11px" }}>
                        Jenis Layanan - {serviceDisplay}
                    </div>

                    {/* Row 5 – Reference barcode | Qty & Weight */}
                    <div style={{ ...cell, display: "flex", padding: 0 }}>
                        <div style={{ flex: 1, borderRight: "1.5px solid #111", padding: "5px 7px", textAlign: "center", overflow: "hidden" }}>
                            <div style={{ fontSize: "7.5px", color: "#666", marginBottom: "2px" }}>Reference Number</div>
                            {/* barcode KECIL = nomor invoice/pesanan */}
                            <div style={{ maxWidth: "100%", overflow: "hidden" }}>
                                <Barcode value={invoiceNumber} height={30} fontSize={8} showText={false} moduleWidth={1} />
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: "7px", fontWeight: 700, marginTop: "1px" }}>
                                {invoiceNumber}
                            </div>
                        </div>
                        <div style={{ width: "42%", padding: "8px 8px" }}>
                            <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 700, paddingBottom: "6px" }}>Quantity</td>
                                        <td style={{ paddingBottom: "6px" }}>: {totalQty} Pcs</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 700 }}>Weight</td>
                                        <td>: {weightKg}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Row 6 – Recipient | Sender */}
                    <div style={{ ...cell, display: "flex", padding: 0 }}>
                        <div style={{ flex: 1, borderRight: "1.5px solid #111", padding: "6px 7px", fontSize: "9.5px", lineHeight: "1.4" }}>
                            <div style={{ fontWeight: 700, marginBottom: "3px" }}>Alamat Penerima:</div>
                            <div style={{ fontWeight: 900, fontSize: "10px" }}>{recipientName}</div>
                            <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{recipientPhone}</div>
                            <div style={{ marginTop: "3px", lineHeight: "1.35" }}>{addressLine}, Indonesia</div>
                        </div>
                        <div style={{ width: "42%", padding: "6px 7px", fontSize: "9.5px", lineHeight: "1.4" }}>
                            <div style={{ fontWeight: 700, marginBottom: "3px" }}>Alamat Pengirim:</div>
                            <div style={{ fontWeight: 900, fontSize: "10px" }}>{senderName}</div>
                            {senderPhone && (
                                <div style={{ fontFamily: "monospace", fontWeight: 700, marginTop: "2px" }}>
                                    {senderPhone}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 7 – Items: semua produk detail */}
                    <div style={{ ...cell, fontSize: "9.5px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "2px" }}>Items Detail :</div>
                        {itemsList.length > 0 ? (
                            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                                {itemsList.map((item, idx) => (
                                    <li key={idx} style={{ lineHeight: "1.5" }}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <span>—</span>
                        )}
                    </div>

                    {/* Row 8 – Notes: hanya tampil jika ada catatan */}
                    {cleanNotes ? (
                        <div style={{ ...cell, fontSize: "9.5px" }}>
                            <span style={{ fontWeight: 700 }}>Catatan :</span>{" "}
                            {cleanNotes}
                        </div>
                    ) : (
                        <div style={{ ...cell, fontSize: "9.5px" }}>
                            <span style={{ fontWeight: 700 }}>Catatan :</span>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ padding: "6px 8px", textAlign: "center", fontSize: "8.5px", color: "#555" }}>
                        <div style={{ fontWeight: 700 }}>Pengiriman melalui platform Biteship</div>
                        <div style={{ color: "#aaa" }}>biteship.com</div>
                    </div>
                </div>
            </div>

            <style>{`
                /* ── @page HARUS di level atas, BUKAN di dalam @media print ── */
                @page {
                    size: ${paperSize === "thermal" ? "100mm 150mm" : "A4"};
                    margin: 0mm;
                }

                @media print {
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        min-height: 0 !important;
                        height: auto !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Sembunyikan toolbar */
                    .no-print { display: none !important; }
                    /* Hapus min-height agar konten tidak floating di tengah */
                    body > div {
                        min-height: 0 !important;
                        height: auto !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    /* Override flex centering: label mulai dari pojok kiri atas */
                    .label-wrapper {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-height: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}

