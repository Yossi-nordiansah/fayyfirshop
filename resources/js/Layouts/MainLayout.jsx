import React from 'react';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer';
import WhatsAppFloatingButton from '@/Components/WhatsAppFloatingButton';

export default function MainLayout({ children, alwaysSolid = true, showWhatsAppFloatingButton = false }) {
    return (
        <>
            <Navbar alwaysSolid={alwaysSolid} />
            <div
                className="relative w-full bg-fixed bg-[length:550px_550px] bg-repeat pt-[0px]"
                style={{ backgroundImage: 'url("/images/bg4.png")' }}
            >
                {children}
            </div>
            {showWhatsAppFloatingButton && <WhatsAppFloatingButton />}
            <Footer />
        </>
    );
}
