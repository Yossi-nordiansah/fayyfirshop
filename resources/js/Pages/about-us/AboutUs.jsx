import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useLanguage } from '@/Contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
    MapPin,
    Clock,
    Phone,
    Sparkles,
    ShieldCheck,
    Award,
    UserCheck
} from 'lucide-react';

const CONTENT = {
    indonesia: {
        title: "Tentang Kami",
        subtitle: "Menghadirkan Seni Wewangian Autentik Timur Tengah & Modern di Bandung",
        story_title: "Kisah Alsharif Perfume",
        story_p1: "Alsharif Perfume Bandung lahir dari kecintaan yang mendalam terhadap seni pembuatan wewangian tradisional Timur Tengah yang dipadukan dengan kemewahan modern. Kami percaya bahwa setiap aroma memiliki kekuatan untuk menceritakan kisah, membangkitkan ingatan emosional, dan mengekspresikan karakter unik dari pemakainya.",
        story_p2: "Berlandaskan komitmen tinggi terhadap kualitas kelas dunia, kami menyeleksi bahan baku pilihan secara ketat. Mulai dari minyak esensial oud yang pekat, kelembutan mawar Taif, hingga kehangatan amber murni. Setiap racikan wewangian kami diformulasikan dengan cermat untuk menghadirkan aroma yang kaya, tahan lama, dan memikat di kulit Anda.",
        story_p3: "Toko fisik kami di Bandung dirancang bukan sekadar sebagai tempat belanja wewangian, melainkan ruang eksplorasi sensorik di mana Anda dapat menemukan signature scent yang sejati. Staf konsultan parfum kami siap membantu memandu perjalanan aromatik Anda dengan layanan ramah dan profesional.",
        values_title: "Nilai Utama Kami",
        value_quality: "Kualitas Premium",
        value_quality_desc: "Menggunakan konsentrasi minyak wangi berkualitas tinggi untuk memastikan kepekatan dan kemurnian aroma.",
        value_authentic: "100% Autentik",
        value_authentic_desc: "Seluruh produk bersumber dari penyuling terpercaya untuk menjaga keaslian warisan aroma parfum.",
        value_lasting: "Aroma Tahan Lama",
        value_lasting_desc: "Diformulasikan secara khusus agar wewangian tetap tercium elegan mendampingi aktivitas Anda sepanjang hari.",
        value_customer: "Konsultasi Personal",
        value_customer_desc: "Konsultan toko kami akan membantu Anda memilih karakter aroma yang sesuai dengan kepribadian Anda.",
        gallery_title: "Galeri Toko Kami",
        gallery_subtitle: "Jelajahi keindahan sudut toko dan koleksi wewangian eksklusif Alsharif Perfume Bandung.",
        location_title: "Lokasi Toko",
        location_subtitle: "Kunjungi toko kami di Bandung untuk merasakan langsung kemewahan aroma kami secara tatap muka.",
        hours: "Jam Operasional",
        hours_desc: "Setiap Hari: 09:00 - 21:00 WIB",
        address: "Alamat Kami",
        address_desc: "Aljazeerah signature, Jl. Ternate No.03, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115",
        phone: "Hubungi Kami",
        label_journey: "PERJALANAN KAMI",
        label_why_choose_us: "MENGAPA MEMILIH KAMI",
        label_visual_experience: "PENGALAMAN VISUAL",
        label_store_finder: "PENCARIAN TOKO",
    },
    english: {
        title: "About Us",
        subtitle: "Bringing the Art of Authentic Middle Eastern & Modern Fragrances to Bandung",
        story_title: "The Alsharif Perfume Story",
        story_p1: "Alsharif Perfume Bandung was born from a deep-rooted passion for traditional Middle Eastern perfumery combined with modern luxury. We believe that a fragrance is more than a scent; it has the power to narrate stories, evoke emotions, and express the unique character of its wearer.",
        story_p2: "Grounded in a commitment to world-class quality, we carefully select and source premium raw materials. From rich oud essential oils and mystical Taif roses to pure warm amber. Each of our blends is meticulously formulated to deliver rich, long-lasting, and captivating scents.",
        story_p3: "Our physical store in Bandung is designed not just as a shop, but as a sensory exploration space where you can discover your true signature scent. Our expert perfume consultants are here to guide your olfactory journey with warm, personalized, and professional service.",
        values_title: "Our Core Values",
        value_quality: "Premium Quality",
        value_quality_desc: "We only use selected, high-concentration ingredients to ensure the richness, complexity, and purity of the scent.",
        value_authentic: "100% Authentic",
        value_authentic_desc: "All formulations are sourced from trusted distillers to preserve the authentic heritage of fine perfumery.",
        value_lasting: "Long-Lasting Scent",
        value_lasting_desc: "Specifically formulated so the elegant fragrance accompanies your activities beautifully all day long.",
        value_customer: "Personal Consultation",
        value_customer_desc: "Our store consultants are ready to assist you in selecting scents that match your personal style.",
        gallery_title: "Our Store Gallery",
        gallery_subtitle: "Browse through the visual moments of our elegant showroom and exclusive collections in Bandung.",
        location_title: "Store Location",
        location_subtitle: "Visit our Bandung store to experience the allure of our premium fragrances in person.",
        hours: "Operating Hours",
        hours_desc: "Daily: 09:00 AM - 09:00 PM",
        address: "Our Address",
        address_desc: "Jl. Dipati Ukur No. 80, Bandung, West Java, Indonesia (Alsharif Perfume Bandung)",
        phone: "Contact Us",
        label_journey: "OUR JOURNEY",
        label_why_choose_us: "WHY CHOOSE US",
        label_visual_experience: "VISUAL EXPERIENCE",
        label_store_finder: "STORE FINDER",
    },
    arabic: {
        title: "من نحن",
        subtitle: "تقديم فن العطور الشرقية الأصيلة والحديثة الفاخرة في باندونغ",
        story_title: "قصة الشريف للعطور",
        story_p1: "ولدت عطور الشريف باندونغ من شغف عميق بصناعة العطور الشرقية التقليدية الممزوجة بالرفاهية الحديثة. نحن نؤمن بأن العطور تمتلك القوة لرواية القصص، وإيقاظ المشاعر، وعكس الطابع الفريد لمن يرتديها.",
        story_p2: "تأسست على الالتزام بالجودة العالمية، ونحن نختار بعناية المواد الخام الممتازة. من زيوت العود الغنية وورد الطائف الغامض إلى العنبر الدافئ النقي. تمت صياغة كل من خلطاتنا بدقة لتقديم روائح غنية تدوم طويلاً وتأسر الحواس.",
        story_p3: "متجرنا الفعلي في باندونغ ليس مجرد متجر تجزئة، بل هو مساحة للاستكشاف الحسي حيث يمكنك اكتشاف عطرك المميز الحقيقي. مستشارو العطور لدينا مستعدون لمساعدتك في رحلتك العطرية بكل ود وخبرة احترافية.",
        values_title: " قيمنا الأساسية",
        value_quality: "جودة ممتازة",
        value_quality_desc: "نستخدم تركيزات عالية من زيوت العطور الفاخرة لضمان غنى الرائحة وثباتها الاستثنائي.",
        value_authentic: "أصيل ١٠٠٪",
        value_authentic_desc: "جميع تركيباتنا تأتي من مقطرات موثوقة للحفاظ على التراث الأصيل لصناعة العطور الراقية.",
        value_lasting: "رائحة تدوم طويلاً",
        value_lasting_desc: "صُممت تركيباتنا خصيصاً لترافق نشاطاتك اليومية بأناقة وجمال طوال اليوم.",
        value_customer: "استشارة شخصية",
        value_customer_desc: "مستشارو متجرنا مستعدون لمساعدتك في اختيار العطور التي تتناسب مع أسلوبك الفريد.",
        gallery_title: "معرض متجرنا",
        gallery_subtitle: "تصفح الصور الحية لمعرضنا الأنيق ومجموعاتنا العطرية الحصرية في باندونغ.",
        location_title: "موقع المتجر",
        location_subtitle: "تفضل بزيارة متجرنا في باندونغ لتجربة جاذبية عطورنا الفاخرة بنفسك وبشكل مباشر.",
        hours: "ساعات العمل",
        hours_desc: "يومياً: ٠٩:٠٠ صباحاً - ٠٩:٠٠ مساءً",
        address: "عنواننا",
        address_desc: "شارع ديباتي اوكور رقم ٨٠، باندونغ، جاوة الغربية، إندونيسيا (عطور الشريف باندونغ)",
        phone: "اتصل بنا",
        label_journey: "رحلتنا",
        label_why_choose_us: "لماذا تختارنا",
        label_visual_experience: "التجربة البصرية",
        label_store_finder: "موقع المتجر",
    }
};

const GALLERY_IMAGES = [
    { src: '/images/alsharif.webp', alt: 'Alsharif Perfume Storefront & Main Counter' },
    { src: '/images/alsharif2.webp', alt: 'Premium Perfume Bottles Collection' },
    { src: '/images/alsharif3.webp', alt: 'Exclusive Attar & Fragrance Display' },
    { src: '/images/alsharif4.webp', alt: 'Fragrance Selection & Consultant Area' },
    { src: '/images/alsharif5.webp', alt: 'Luxury Packaging & Gift Sets' }
];

export default function AboutUs() {
    const { locale, t } = useLanguage();
    const currentLang = CONTENT[locale] ? locale : 'indonesia';
    const text = CONTENT[currentLang];

    const values = [
        {
            icon: <Award className="h-6 w-6 text-amber-500" />,
            title: text.value_quality,
            desc: text.value_quality_desc
        },
        {
            icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
            title: text.value_authentic,
            desc: text.value_authentic_desc
        },
        {
            icon: <Sparkles className="h-6 w-6 text-blue-500" />,
            title: text.value_lasting,
            desc: text.value_lasting_desc
        },
        {
            icon: <UserCheck className="h-6 w-6 text-indigo-500" />,
            title: text.value_customer,
            desc: text.value_customer_desc
        }
    ];

    const isRtl = locale === 'arabic';

    return (
        <MainLayout alwaysSolid={true} showWhatsAppFloatingButton={true}>
            <Head title={text.title} />

            <div className="pb-16 pt-20 text-slate-800 selection:bg-blue-900 selection:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* ── HERO BANNER SECTION ─────────────────────────────────── */}
                <div className="relative overflow-hidden bg-slate-950 py-24 text-white">
                    {/* Background Overlay Graphics */}
                    <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("/images/alsharif.webp")' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-slate-950/30 to-slate-950/40"></div>

                    <div className="relative max-w-7xl mx-auto px-6 text-center space-y-4">
                        <motion.span
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest"
                        >
                            <Sparkles className="h-3 w-3" />
                            Alsharif Perfume Bandung
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
                        >
                            {text.title}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="max-w-3xl mx-auto text-sm md:text-base text-slate-300 font-medium leading-relaxed"
                        >
                            {text.subtitle}
                        </motion.p>
                    </div>
                </div>

                {/* ── BRAND STORY SECTION ─────────────────────────────────── */}
                <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <span className="text-xs font-bold tracking-widest text-amber-600 uppercase block">{text.label_journey}</span>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{text.story_title}</h2>
                            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded mx-auto"></div>
                        </div>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed text-justify md:text-center">{text.story_p1}</p>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed text-justify md:text-center">{text.story_p2}</p>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed font-bold text-center">{text.story_p3}</p>
                    </motion.div>
                </div>

                {/* ── CORE VALUES SECTION ─────────────────────────────────── */}
                <div className="bg-slate-100/60 border-y border-slate-200 py-16">
                    <div className="max-w-7xl mx-auto px-6 space-y-12">
                        <div className="text-center space-y-2 mb-5">
                            <span className="text-xs font-bold tracking-widest text-amber-600 uppercase block">{text.label_why_choose_us}</span>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{text.values_title}</h2>
                            <div className="h-1 w-20 bg-amber-500 rounded mx-auto"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((val, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md hover:border-slate-300 transition duration-300 text-center"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner">
                                        {val.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-slate-900">{val.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{val.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── IMAGE GALLERY SECTION ───────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
                    <div className="text-center space-y-2">
                        <span className="text-xs font-bold tracking-widest text-amber-600 uppercase block">{text.label_visual_experience}</span>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{text.gallery_title}</h2>
                        <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto font-medium">{text.gallery_subtitle}</p>
                        <div className="h-1 w-20 bg-amber-500 rounded mx-auto"></div>
                    </div>

                    {/* Gallery Grid - Masonry style to display full landscape/portrait dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {/* Column 1 */}
                        <div className="flex flex-col gap-6">
                            {[GALLERY_IMAGES[0], GALLERY_IMAGES[2]].map((img) => {
                                const originalIdx = GALLERY_IMAGES.indexOf(img);
                                return (
                                    <motion.div
                                        key={originalIdx}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200 group bg-slate-50"
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.alt}
                                            className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col gap-6">
                            {[GALLERY_IMAGES[1], GALLERY_IMAGES[4]].map((img) => {
                                const originalIdx = GALLERY_IMAGES.indexOf(img);
                                return (
                                    <motion.div
                                        key={originalIdx}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200 group bg-slate-50"
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.alt}
                                            className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col gap-6">
                            {[GALLERY_IMAGES[3]].map((img) => {
                                const originalIdx = GALLERY_IMAGES.indexOf(img);
                                return (
                                    <motion.div
                                        key={originalIdx}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200 group bg-slate-50"
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.alt}
                                            className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── BOUTIQUE LOCATION & MAP SECTION ─────────────────────── */}
                <div className="bg-transparent text-slate-800 py-16 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Map Details Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:col-span-5 space-y-8"
                        >
                            <div className="space-y-2">
                                <span className="text-xs font-bold tracking-widest text-amber-600 uppercase block">{text.label_store_finder}</span>
                                <h2 className="text-3xl font-black tracking-tight text-slate-900">{text.location_title}</h2>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{text.location_subtitle}</p>
                                <div className="h-1 w-20 bg-amber-500 rounded"></div>
                            </div>

                            <div className="space-y-2">
                                {/* Address Card */}
                                <div className="flex gap-4 items-start bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-black uppercase text-amber-600 block">{text.address}</span>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{text.address_desc}</p>
                                    </div>
                                </div>

                                {/* Hours Card */}
                                <div className="flex gap-4 items-start bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-black uppercase text-amber-600 block">{text.hours}</span>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{text.hours_desc}</p>
                                    </div>
                                </div>

                                {/* Phone Card */}
                                <div className="flex gap-4 items-start bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-black uppercase text-amber-600 block">{text.phone}</span>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">+62 821-2244-6688</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Interactive Google Map Embed */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="lg:col-span-7 overflow-hidden rounded-3xl border border-slate-200 shadow-xl relative"
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3424.4884337527733!2d107.6141787!3d-6.908044599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e72a82693ee9%3A0xc27462f85026a2c5!2sAlsharif%20Perfume%20Bandung!5e1!3m2!1sid!2sid!4v1782458213773!5m2!1sid!2sid"
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerpolicy="strict-origin-when-cross-origin"
                                title="Alsharif Perfume Bandung Google Map"
                            ></iframe>
                        </motion.div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
