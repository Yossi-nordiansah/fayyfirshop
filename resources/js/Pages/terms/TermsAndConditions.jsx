import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useLanguage } from '@/Contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    RotateCcw,
    ShieldCheck,
    Truck,
    CreditCard,
    Lock,
    Phone,
    ChevronDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    ArrowLeft,
} from 'lucide-react';

/* ─────────────────────────────────────────────────
   MULTI-LANGUAGE CONTENT
───────────────────────────────────────────────── */
const CONTENT = {
    indonesia: {
        page_title: 'Syarat & Ketentuan Penggunaan',
        page_subtitle: 'Harap baca dengan seksama sebelum menggunakan layanan kami.',
        last_updated: 'Terakhir diperbarui: Agustus 2026',
        back_home: 'Kembali ke Beranda',

        sections: [
            {
                id: 'intro',
                icon: 'FileText',
                title: '1. Pendahuluan',
                content: [
                    'Selamat datang di Fayyfir Shop ("Kami", "Toko", atau "Platform"). Dengan mengakses dan menggunakan layanan kami — baik melalui website, aplikasi, maupun media lainnya — Anda ("Pelanggan" atau "Pengguna") dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan yang berlaku di bawah ini.',
                    'Syarat & Ketentuan ini merupakan perjanjian yang sah dan mengikat antara Anda selaku pengguna dengan Fayyfir Shop selaku penyedia layanan. Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak melanjutkan penggunaan layanan kami.',
                ],
            },
            {
                id: 'general',
                icon: 'ShieldCheck',
                title: '2. Ketentuan Umum Penggunaan',
                content: [
                    'Pengguna wajib berusia minimal 17 tahun atau telah mendapatkan izin dari orang tua/wali untuk menggunakan layanan ini.',
                    'Anda bertanggung jawab penuh atas keamanan dan kerahasiaan akun serta kata sandi Anda. Segala aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya.',
                    'Dilarang menggunakan platform ini untuk tujuan yang melanggar hukum, menipu, atau merugikan pihak lain.',
                    'Kami berhak memblokir atau menonaktifkan akun yang terbukti melanggar ketentuan penggunaan tanpa pemberitahuan terlebih dahulu.',
                    'Fayyfir Shop berhak memperbarui Syarat & Ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui website atau email terdaftar Anda.',
                ],
            },
            {
                id: 'order',
                icon: 'CreditCard',
                title: '3. Pemesanan & Pembayaran',
                content: [
                    'Setiap pesanan yang telah dikonfirmasi dan dibayar dianggap sah dan mengikat.',
                    'Harga produk yang tertera di platform sudah termasuk pajak yang berlaku, namun belum termasuk biaya pengiriman kecuali dinyatakan lain.',
                    'Pembayaran dapat dilakukan melalui metode yang tersedia di platform kami (Virtual Account, QRIS, dll). Pesanan akan diproses setelah pembayaran berhasil dikonfirmasi.',
                    'Fayyfir Shop tidak bertanggung jawab atas kegagalan transaksi yang disebabkan oleh gangguan layanan pihak ketiga (bank, gateway pembayaran, dll).',
                    'Jika terjadi selisih harga akibat kesalahan teknis sistem, kami berhak membatalkan pesanan dan mengembalikan pembayaran secara penuh.',
                ],
            },
            {
                id: 'shipping',
                icon: 'Truck',
                title: '4. Pengiriman',
                content: [
                    'Estimasi waktu pengiriman yang ditampilkan bersifat perkiraan dan dapat berubah tergantung kondisi mitra logistik, lokasi tujuan, dan situasi tak terduga (bencana alam, hari libur nasional, dll).',
                    'Kami tidak bertanggung jawab atas keterlambatan pengiriman yang disebabkan oleh kesalahan alamat yang diberikan oleh pembeli.',
                    'Setelah paket diserahkan kepada kurir dan memiliki nomor resi, tanggung jawab pengiriman beralih kepada mitra logistik yang bersangkutan.',
                    'Jika paket dinyatakan hilang dalam proses pengiriman, pembeli wajib melaporkan kepada kami dalam waktu 7 × 24 jam setelah estimasi tiba untuk kami tindak lanjuti.',
                ],
            },
            {
                id: 'refund',
                icon: 'RotateCcw',
                title: '5. Ketentuan Pengembalian Barang & Dana (Return & Refund)',
                isHighlighted: true,
                subsections: [
                    {
                        subtitle: '5.1 Syarat Pembatalan Pesanan',
                        icon: 'CheckCircle',
                        type: 'success',
                        points: [
                            '✅ Pembatalan pesanan HANYA dapat dilakukan selama status pesanan masih "Menunggu Pembayaran (Pending)" atau "Sedang Diproses".',
                            '❌ Pesanan yang statusnya sudah berubah menjadi "Dikirim" (dalam perjalanan) tidak dapat dibatalkan dalam kondisi apapun.',
                            'Mohon pastikan Anda memeriksa status pesanan sebelum mengajukan pembatalan.',
                        ],
                    },
                    {
                        subtitle: '5.2 Ketentuan Alasan Pembatalan',
                        icon: 'AlertTriangle',
                        type: 'warning',
                        points: [
                            'Setiap pengajuan pembatalan WAJIB disertai dengan alasan yang jelas, spesifik, dan dapat diverifikasi.',
                            'Contoh alasan yang diterima: "Salah pilih ukuran/warna", "Alamat pengiriman berubah", "Ingin mengganti produk".',
                            'Pengajuan pembatalan tanpa alasan yang jelas atau dengan alasan yang tidak dapat diverifikasi BERHAK untuk ditolak (reject) oleh tim kami.',
                            'Alasan pembatalan dapat disampaikan melalui menu Pesanan Saya di akun Anda atau langsung menghubungi tim kami via WhatsApp.',
                        ],
                    },
                    {
                        subtitle: '5.3 Proses Pengembalian Dana (Refund)',
                        icon: 'CreditCard',
                        type: 'info',
                        points: [
                            'Apabila pembatalan diajukan saat status pesanan sudah "Sedang Diproses" dan pembayaran telah berhasil dilakukan, tim admin kami akan segera menghubungi Anda melalui WhatsApp dan/atau email yang terdaftar.',
                            'Admin akan meminta Nomor Rekening Bank tujuan pengembalian dana Anda.',
                            'Dana akan dikembalikan ke rekening yang Anda berikan dalam waktu 1 × 3 hari kerja setelah verifikasi data selesai.',
                            'Fayyfir Shop tidak bertanggung jawab atas keterlambatan refund yang disebabkan oleh data rekening yang tidak valid atau tidak aktif.',
                            'Untuk pesanan yang statusnya masih "Menunggu Pembayaran" dan belum ada pembayaran, pembatalan langsung efektif tanpa proses refund.',
                        ],
                    },
                ],
            },
            {
                id: 'privacy',
                icon: 'Lock',
                title: '6. Privasi & Keamanan Data',
                content: [
                    'Fayyfir Shop berkomitmen untuk melindungi data pribadi Anda sesuai dengan peraturan perlindungan data yang berlaku.',
                    'Data yang Anda berikan (nama, alamat, nomor telepon, email) hanya digunakan untuk keperluan proses pemesanan, pengiriman, dan komunikasi layanan.',
                    'Kami tidak akan menjual atau membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum.',
                ],
            },
            {
                id: 'contact',
                icon: 'Phone',
                title: '7. Hubungi Kami',
                content: [
                    'Jika Anda memiliki pertanyaan, kendala, atau membutuhkan klarifikasi lebih lanjut terkait Syarat & Ketentuan ini, jangan ragu untuk menghubungi tim kami:',
                ],
                contact: {
                    wa: 'WhatsApp: +62 812-9000-7740',
                    email: 'Email: info@fayyfirshop.com',
                    hours: 'Jam Operasional: Setiap Hari, 09.00 – 21.00 WIB',
                },
            },
        ],
    },

    english: {
        page_title: 'Terms & Conditions of Use',
        page_subtitle: 'Please read carefully before using our services.',
        last_updated: 'Last updated: August 2026',
        back_home: 'Back to Home',

        sections: [
            {
                id: 'intro',
                icon: 'FileText',
                title: '1. Introduction',
                content: [
                    'Welcome to Fayyfir Shop ("We", "Store", or "Platform"). By accessing and using our services — whether through the website, application, or other media — you ("Customer" or "User") are deemed to have read, understood, and agreed to all applicable Terms & Conditions below.',
                    'These Terms & Conditions constitute a valid and binding agreement between you as the user and Fayyfir Shop as the service provider. If you do not agree to these terms, please discontinue using our services.',
                ],
            },
            {
                id: 'general',
                icon: 'ShieldCheck',
                title: '2. General Terms of Use',
                content: [
                    'Users must be at least 17 years old or have obtained parental/guardian permission to use this service.',
                    'You are fully responsible for the security and confidentiality of your account and password. All activities that occur under your account are solely your responsibility.',
                    'It is prohibited to use this platform for illegal, fraudulent, or harmful purposes.',
                    'We reserve the right to block or deactivate accounts that are found to violate the terms of use without prior notice.',
                    'Fayyfir Shop reserves the right to update these Terms & Conditions at any time. Changes will be notified through the website or your registered email.',
                ],
            },
            {
                id: 'order',
                icon: 'CreditCard',
                title: '3. Ordering & Payment',
                content: [
                    'Every order that has been confirmed and paid is considered valid and binding.',
                    'Product prices listed on the platform already include applicable taxes, but do not include shipping costs unless stated otherwise.',
                    'Payment can be made through the methods available on our platform (Virtual Account, QRIS, etc.). Orders will be processed after payment is successfully confirmed.',
                    'Fayyfir Shop is not responsible for transaction failures caused by third-party service disruptions (banks, payment gateways, etc.).',
                    'If a price discrepancy occurs due to a technical system error, we reserve the right to cancel the order and refund the payment in full.',
                ],
            },
            {
                id: 'shipping',
                icon: 'Truck',
                title: '4. Shipping',
                content: [
                    'Estimated delivery times displayed are approximate and may change depending on logistics partner conditions, destination location, and unforeseen circumstances (natural disasters, national holidays, etc.).',
                    'We are not responsible for shipping delays caused by incorrect addresses provided by the buyer.',
                    'Once the package is handed over to the courier and has a tracking number, shipping responsibility transfers to the respective logistics partner.',
                    'If a package is declared lost during shipping, the buyer must report it to us within 7 × 24 hours after the estimated arrival time for us to follow up.',
                ],
            },
            {
                id: 'refund',
                icon: 'RotateCcw',
                title: '5. Return & Refund Policy',
                isHighlighted: true,
                subsections: [
                    {
                        subtitle: '5.1 Order Cancellation Terms',
                        icon: 'CheckCircle',
                        type: 'success',
                        points: [
                            '✅ Order cancellation can ONLY be made while the order status is still "Awaiting Payment (Pending)" or "Being Processed".',
                            '❌ Orders whose status has changed to "Shipped" (in transit) cannot be cancelled under any circumstances.',
                            'Please make sure to check your order status before submitting a cancellation request.',
                        ],
                    },
                    {
                        subtitle: '5.2 Cancellation Reason Requirements',
                        icon: 'AlertTriangle',
                        type: 'warning',
                        points: [
                            'Every cancellation request MUST be accompanied by a clear, specific, and verifiable reason.',
                            'Examples of accepted reasons: "Wrong size/color selected", "Shipping address changed", "Wanting to replace product".',
                            'Cancellation requests without a clear reason or with an unverifiable reason may be REJECTED by our team.',
                            'Cancellation reasons can be submitted through the My Orders menu in your account or by contacting our team directly via WhatsApp.',
                        ],
                    },
                    {
                        subtitle: '5.3 Refund Process',
                        icon: 'CreditCard',
                        type: 'info',
                        points: [
                            'If a cancellation is requested when the order status is already "Being Processed" and payment has been successfully made, our admin team will promptly contact you via WhatsApp and/or your registered email.',
                            'The admin will request your Bank Account Number for the refund.',
                            'Funds will be returned to your provided account within 1–3 business days after data verification is complete.',
                            'Fayyfir Shop is not responsible for refund delays caused by invalid or inactive bank account data.',
                            'For orders with "Awaiting Payment" status where no payment has been made, cancellation is effective immediately with no refund process required.',
                        ],
                    },
                ],
            },
            {
                id: 'privacy',
                icon: 'Lock',
                title: '6. Privacy & Data Security',
                content: [
                    'Fayyfir Shop is committed to protecting your personal data in accordance with applicable data protection regulations.',
                    'Data you provide (name, address, phone number, email) is only used for order processing, shipping, and service communication purposes.',
                    'We will not sell or share your personal data with third parties without your consent, unless required by law.',
                ],
            },
            {
                id: 'contact',
                icon: 'Phone',
                title: '7. Contact Us',
                content: [
                    'If you have questions, issues, or need further clarification regarding these Terms & Conditions, feel free to contact our team:',
                ],
                contact: {
                    wa: 'WhatsApp: +62 812-9000-7740',
                    email: 'Email: info@fayyfirshop.com',
                    hours: 'Operating Hours: Every Day, 09:00 – 21:00 WIB',
                },
            },
        ],
    },

    arabic: {
        page_title: 'الشروط والأحكام',
        page_subtitle: 'يرجى القراءة بعناية قبل استخدام خدماتنا.',
        last_updated: 'آخر تحديث: أغسطس 2026',
        back_home: 'العودة إلى الرئيسية',

        sections: [
            {
                id: 'intro',
                icon: 'FileText',
                title: '١. المقدمة',
                content: [
                    'مرحباً بكم في Fayyfir Shop ("نحن" أو "المتجر" أو "المنصة"). من خلال الوصول إلى خدماتنا واستخدامها — سواء عبر الموقع الإلكتروني أو التطبيق أو أي وسيلة أخرى — يُعتبر المستخدم ("العميل" أو "المستخدم") قد اطلع على جميع الشروط والأحكام المعمول بها أدناه وفهمها ووافق عليها.',
                    'تُعدّ هذه الشروط والأحكام اتفاقية سارية وملزمة بينكم بوصفكم مستخدمين وبين Fayyfir Shop بوصفها مزود الخدمة. إن كنتم لا توافقون على هذه الشروط، يُرجى التوقف عن استخدام خدماتنا.',
                ],
            },
            {
                id: 'general',
                icon: 'ShieldCheck',
                title: '٢. الشروط العامة للاستخدام',
                content: [
                    'يجب أن يكون المستخدمون بعمر 17 عاماً على الأقل، أو أن يكونوا قد حصلوا على إذن من الوالدين أو الوصي لاستخدام هذه الخدمة.',
                    'أنتم مسؤولون مسؤولية كاملة عن أمان حساباتكم وكلمات المرور وسريتها. جميع الأنشطة التي تتم عبر حسابكم تقع على عاتقكم وحدكم.',
                    'يحظر استخدام هذه المنصة لأغراض غير مشروعة أو احتيالية أو ضارة.',
                    'نحتفظ بالحق في حظر أو إلغاء تنشيط الحسابات التي تنتهك شروط الاستخدام دون إشعار مسبق.',
                    'يحق لـ Fayyfir Shop تحديث هذه الشروط والأحكام في أي وقت، وسيتم الإخطار بالتغييرات عبر الموقع الإلكتروني أو البريد الإلكتروني المسجل.',
                ],
            },
            {
                id: 'order',
                icon: 'CreditCard',
                title: '٣. الطلبات والدفع',
                content: [
                    'كل طلب تم تأكيده والدفع له يُعدّ صحيحاً وملزماً.',
                    'أسعار المنتجات المعروضة على المنصة تشمل الضرائب المعمول بها، لكنها لا تشمل تكاليف الشحن إلا إذا نُص على ذلك.',
                    'يمكن الدفع عبر الوسائل المتاحة على منصتنا (حساب افتراضي، QRIS، إلخ). تتم معالجة الطلبات بعد تأكيد الدفع.',
                    'لا تتحمل Fayyfir Shop مسؤولية فشل المعاملات الناجم عن اضطرابات خدمات الأطراف الثالثة (البنوك، بوابات الدفع، إلخ).',
                    'في حال حدوث تفاوت في الأسعار بسبب خطأ تقني في النظام، يحق لنا إلغاء الطلب وإعادة المبلغ بالكامل.',
                ],
            },
            {
                id: 'shipping',
                icon: 'Truck',
                title: '٤. الشحن والتوصيل',
                content: [
                    'أوقات التسليم المقدرة المعروضة تقريبية وقابلة للتغيير تبعاً لظروف شركاء الخدمات اللوجستية وموقع الوجهة والظروف غير المتوقعة.',
                    'لا نتحمل مسؤولية تأخيرات الشحن الناجمة عن عناوين غير صحيحة يقدمها المشتري.',
                    'بمجرد تسليم الطرد للمندوب والحصول على رقم التتبع، تنتقل مسؤولية الشحن إلى شريك الخدمات اللوجستية.',
                    'إذا أُعلن عن فقدان طرد أثناء الشحن، يجب على المشتري إبلاغنا خلال 7 × 24 ساعة من موعد الوصول المقدر.',
                ],
            },
            {
                id: 'refund',
                icon: 'RotateCcw',
                title: '٥. سياسة الإرجاع واسترداد الأموال',
                isHighlighted: true,
                subsections: [
                    {
                        subtitle: '٥.١ شروط إلغاء الطلب',
                        icon: 'CheckCircle',
                        type: 'success',
                        points: [
                            '✅ يمكن إلغاء الطلب فقط عندما تكون حالته "في انتظار الدفع (معلق)" أو "قيد المعالجة".',
                            '❌ لا يمكن إلغاء الطلبات التي تغيرت حالتها إلى "تم الشحن" (في الطريق) تحت أي ظرف من الظروف.',
                            'يُرجى التحقق من حالة طلبكم قبل تقديم طلب الإلغاء.',
                        ],
                    },
                    {
                        subtitle: '٥.٢ اشتراطات سبب الإلغاء',
                        icon: 'AlertTriangle',
                        type: 'warning',
                        points: [
                            'يجب أن يكون كل طلب إلغاء مصحوباً بسبب واضح ومحدد وقابل للتحقق.',
                            'أمثلة على الأسباب المقبولة: "اخترت مقاساً أو لوناً خاطئاً"، "تغير عنوان الشحن"، "أريد استبدال المنتج".',
                            'يحق لفريقنا رفض طلبات الإلغاء التي لا تحتوي على سبب واضح أو يتعذر التحقق منه.',
                            'يمكن تقديم أسباب الإلغاء من خلال قسم "طلباتي" في حسابكم، أو بالتواصل مباشرة مع فريقنا عبر واتساب.',
                        ],
                    },
                    {
                        subtitle: '٥.٣ إجراءات استرداد الأموال',
                        icon: 'CreditCard',
                        type: 'info',
                        points: [
                            'إذا تم تقديم طلب الإلغاء وحالة الطلب "قيد المعالجة" وقد تم الدفع بنجاح، سيتواصل معكم فريق الإدارة لدينا فوراً عبر واتساب و/أو البريد الإلكتروني المسجل.',
                            'سيطلب المسؤول رقم حسابكم البنكي لاسترداد المبلغ.',
                            'ستُعاد الأموال إلى الحساب الذي قدمتموه خلال 1–3 أيام عمل بعد اكتمال التحقق من البيانات.',
                            'لا تتحمل Fayyfir Shop مسؤولية تأخر الاسترداد بسبب بيانات حساب بنكي غير صحيحة أو غير نشطة.',
                            'بالنسبة للطلبات التي لا تزال في حالة "انتظار الدفع" ولم يتم سداد أي مبلغ، يسري الإلغاء فوراً دون الحاجة إلى إجراء استرداد.',
                        ],
                    },
                ],
            },
            {
                id: 'privacy',
                icon: 'Lock',
                title: '٦. الخصوصية وأمن البيانات',
                content: [
                    'تلتزم Fayyfir Shop بحماية بياناتكم الشخصية وفقاً للوائح حماية البيانات المعمول بها.',
                    'البيانات التي تقدمونها (الاسم، العنوان، رقم الهاتف، البريد الإلكتروني) تُستخدم فقط لأغراض معالجة الطلبات والشحن والتواصل.',
                    'لن نبيع بياناتكم الشخصية أو نشاركها مع أطراف ثالثة دون موافقتكم، إلا إذا اقتضى القانون ذلك.',
                ],
            },
            {
                id: 'contact',
                icon: 'Phone',
                title: '٧. تواصل معنا',
                content: [
                    'إذا كان لديكم أسئلة أو مشكلات أو تحتاجون إلى مزيد من التوضيح بشأن هذه الشروط والأحكام، لا تترددوا في التواصل مع فريقنا:',
                ],
                contact: {
                    wa: 'واتساب: +62 812-9000-7740',
                    email: 'البريد الإلكتروني: info@fayyfirshop.com',
                    hours: 'ساعات العمل: كل يوم، 09:00 – 21:00 بتوقيت إندونيسيا الغربي',
                },
            },
        ],
    },
};

/* ─────────────────────────────────────────────────
   ICON MAP
───────────────────────────────────────────────── */
const iconMap = {
    FileText,
    ShieldCheck,
    CreditCard,
    Truck,
    RotateCcw,
    Lock,
    Phone,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Info,
};

/* ─────────────────────────────────────────────────
   SUB-BADGE CONFIG
───────────────────────────────────────────────── */
const subsectionConfig = {
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        dot: 'bg-emerald-500',
        icon: CheckCircle,
        iconColor: 'text-emerald-600',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-500',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-500',
        icon: Info,
        iconColor: 'text-blue-600',
    },
    neutral: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700',
        dot: 'bg-slate-400',
        icon: RotateCcw,
        iconColor: 'text-slate-500',
    },
};

/* ─────────────────────────────────────────────────
   ACCORDION SECTION
───────────────────────────────────────────────── */
function AccordionSection({ section, index, isRtl }) {
    const [open, setOpen] = useState(index === 4); // refund section open by default
    const IconComp = iconMap[section.icon] || FileText;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            id={section.id}
            className={`rounded-2xl border overflow-hidden ${
                section.isHighlighted
                    ? 'border-amber-300 shadow-lg shadow-amber-100/60'
                    : 'border-slate-200 shadow-sm'
            }`}
        >
            {/* Header */}
            <button
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between gap-4 p-5 text-left transition-all duration-200 ${
                    section.isHighlighted
                        ? open
                            ? 'bg-amber-600 text-white'
                            : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:brightness-105'
                        : open
                        ? 'bg-slate-800 text-white'
                        : 'bg-white hover:bg-slate-50 text-slate-800'
                }`}
            >
                <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-xl ${
                        section.isHighlighted
                            ? 'bg-white/20'
                            : open ? 'bg-white/10' : 'bg-slate-100'
                    }`}>
                        <IconComp
                            size={18}
                            className={section.isHighlighted || open ? 'text-white' : 'text-slate-600'}
                        />
                    </span>
                    <span className={`font-bold text-sm md:text-base leading-snug ${isRtl ? 'text-right' : ''}`}>
                        {section.title}
                    </span>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} className="shrink-0" />
                </motion.div>
            </button>

            {/* Body */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white p-5 space-y-4">
                            {/* Regular content paragraphs */}
                            {section.content?.map((para, i) => (
                                <p key={i} className={`text-slate-600 text-sm leading-relaxed ${isRtl ? 'text-right' : ''}`}>
                                    {para}
                                </p>
                            ))}

                            {/* Contact card */}
                            {section.contact && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    {Object.values(section.contact).map((val, i) => (
                                        <p key={i} className={`text-sm font-medium text-slate-700 ${isRtl ? 'text-right' : ''}`}>
                                            {val}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Subsections (Return & Refund) */}
                            {section.subsections?.map((sub, si) => {
                                const cfg = subsectionConfig[sub.type] || subsectionConfig.neutral;
                                const SubIcon = cfg.icon;
                                return (
                                    <div
                                        key={si}
                                        className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
                                    >
                                        <div className={`flex items-center gap-2 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <SubIcon size={16} className={cfg.iconColor} />
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                {sub.subtitle}
                                            </span>
                                        </div>
                                        <ul className="space-y-2">
                                            {sub.points.map((pt, pi) => (
                                                <li
                                                    key={pi}
                                                    className={`flex gap-2.5 text-sm text-slate-700 leading-relaxed ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                                                >
                                                    {!pt.startsWith('✅') && !pt.startsWith('❌') && (
                                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                                                    )}
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────
   TABLE OF CONTENTS (sticky sidebar)
───────────────────────────────────────────────── */
function TableOfContents({ sections, isRtl }) {
    return (
        <div className="hidden lg:block">
            <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 ${isRtl ? 'text-right' : ''}`}>
                    Daftar Isi
                </h3>
                <nav className="space-y-1">
                    {sections.map((sec) => {
                        const IconComp = iconMap[sec.icon] || FileText;
                        return (
                            <a
                                key={sec.id}
                                href={`#${sec.id}`}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors group ${sec.isHighlighted ? 'text-amber-700 font-bold' : ''}`}
                            >
                                <IconComp size={14} className="shrink-0 group-hover:text-amber-600" />
                                <span className={isRtl ? 'text-right' : ''}>{sec.title}</span>
                            </a>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────── */
export default function TermsAndConditions() {
    const { locale } = useLanguage();

    const lang = CONTENT[locale] || CONTENT.indonesia;
    const isRtl = locale === 'arabic';

    return (
        <MainLayout>
            <Head title={`Fayyfir Shop — ${lang.page_title}`}>
                <meta name="description" content={lang.page_subtitle} />
            </Head>

            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 pt-28 pb-16">
                {/* Decorative blobs */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-6">
                    <Link
                        href="/"
                        className={`inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-xs font-medium mb-8 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <ArrowLeft size={14} />
                        {lang.back_home}
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={`flex items-center gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                                <FileText size={24} className="text-amber-400" />
                            </div>
                            <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">
                                Legal
                            </span>
                        </div>

                        <h1 className={`text-3xl md:text-4xl font-black text-white leading-tight mb-3 ${isRtl ? 'text-right' : ''}`}>
                            {lang.page_title}
                        </h1>
                        <p className={`text-zinc-400 text-sm leading-relaxed max-w-2xl ${isRtl ? 'text-right' : ''}`}>
                            {lang.page_subtitle}
                        </p>
                        <p className={`mt-4 text-[11px] text-zinc-500 ${isRtl ? 'text-right' : ''}`}>
                            {lang.last_updated}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-screen bg-slate-50 py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
                        {/* Sidebar TOC */}
                        <TableOfContents sections={lang.sections} isRtl={isRtl} />

                        {/* Accordion Sections */}
                        <div className="space-y-4">
                            {lang.sections.map((section, idx) => (
                                <AccordionSection
                                    key={section.id}
                                    section={section}
                                    index={idx}
                                    isRtl={isRtl}
                                />
                            ))}

                            {/* Footer note */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-center pt-6 pb-2"
                            >
                                <p className="text-xs text-slate-400">
                                    {locale === 'indonesia'
                                        ? 'Dengan menggunakan layanan Fayyfir Shop, Anda telah menyetujui seluruh ketentuan di atas.'
                                        : locale === 'arabic'
                                        ? 'باستخدام خدمات Fayyfir Shop، فإنكم توافقون على جميع الشروط المذكورة أعلاه.'
                                        : 'By using Fayyfir Shop services, you agree to all the terms listed above.'}
                                </p>
                                <Link
                                    href="/"
                                    className="inline-block mt-4 text-xs text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2 transition-colors"
                                >
                                    {lang.back_home}
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
