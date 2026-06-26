import React from "react";
import { motion } from "framer-motion";

export default function WhatsAppFloatingButton() {
    const phoneNumber = "6285655230897";
    const waUrl = `https://wa.me/${phoneNumber}`;

    return (
        <motion.a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            className="fixed bottom-6 right-6 z-[99] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20ba5a] transition-all focus:outline-none focus:ring-4 focus:ring-green-300"
            title="Chat via WhatsApp"
        >
            {/* Green Pulse Ring */}
            <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping -z-10" />
            
            {/* WhatsApp SVG Icon */}
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.597-1.01-5.038-2.85-6.88-1.839-1.843-4.283-2.859-6.883-2.86-5.404 0-9.807 4.393-9.81 9.8-.001 1.97.525 3.897 1.52 5.623l-.991 3.624 3.702-.97c.002 0-.001 0 0 0zm10.741-6.953c-.301-.15-1.78-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.3-.775.979-.95 1.179-.175.2-.35.225-.65.075-1.04-.52-1.78-.9-2.485-2.11-.2-.35-.2-.175.1-.475.2-.2.35-.45.475-.6.125-.15.05-.3-.025-.45-.075-.15-.675-1.625-.925-2.225-.244-.589-.496-.589-.675-.597-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.22 5.11 4.52.714.31 1.272.495 1.708.634.717.228 1.368.196 1.884.119.575-.085 1.78-.727 2.03-1.429.25-.701.25-1.301.175-1.429-.075-.125-.275-.225-.575-.375z" />
            </svg>
        </motion.a>
    );
}
