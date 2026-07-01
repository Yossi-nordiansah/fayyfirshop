import React from "react";
import { usePage } from "@inertiajs/react";

export default function WhatsAppFloatingButton() {
    const { activeStoreBranches = [], visitorCountryCode = 'ID', visitorLatitude, visitorLongitude } = usePage().props;

    // Resolve the best matching branch for the visitor
    const resolvedBranch = React.useMemo(() => {
        if (!activeStoreBranches || activeStoreBranches.length === 0) {
            return null;
        }

        // A. Coba cari cabang dengan kode negara yang sama dulu (SA, MY, ID)
        const countryMatch = activeStoreBranches.find(
            b => b.country_code === visitorCountryCode && b.is_active
        );
        if (countryMatch) {
            return countryMatch;
        }

        // B. Jika tidak ada kecocokan negara, coba hitung jarak terdekat menggunakan koordinat IP
        const visLat = parseFloat(visitorLatitude);
        const visLon = parseFloat(visitorLongitude);
        if (!isNaN(visLat) && !isNaN(visLon)) {
            let nearestBranch = null;
            let minDistance = Infinity;

            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                const toRad = (value) => (value * Math.PI) / 180;
                const R = 6371; // km
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(lat1)) *
                        Math.cos(toRad(lat2)) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            activeStoreBranches.forEach(b => {
                if (b.is_active) {
                    const branchLat = parseFloat(b.latitude);
                    const branchLon = parseFloat(b.longitude);
                    if (!isNaN(branchLat) && !isNaN(branchLon)) {
                        const dist = calculateDistance(visLat, visLon, branchLat, branchLon);
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestBranch = b;
                        }
                    }
                }
            });

            if (nearestBranch) {
                return nearestBranch;
            }
        }

        // C. Fallback: cari cabang default
        const defaultMatch = activeStoreBranches.find(b => b.is_default && b.is_active);
        if (defaultMatch) {
            return defaultMatch;
        }

        // D. Fallback terakhir: cabang pertama yang aktif
        return activeStoreBranches.find(b => b.is_active) || activeStoreBranches[0] || null;
    }, [activeStoreBranches, visitorCountryCode, visitorLatitude, visitorLongitude]);

    const phoneNumber = resolvedBranch?.whatsapp_number || "6285655230897";
    const waUrl = `https://wa.me/${phoneNumber}`;

    return (
        <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[99] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20ba5a] transition-all focus:outline-none focus:ring-4 focus:ring-green-300"
            title="Chat via WhatsApp"
        >
            <img src="/images/icons/whatsapp.svg" className="w-8 h-8" alt="WhatsApp" />
        </a>
    );
}
