import React from 'react';

export default function MainLayout({ children }) {
    return (
        <div
            className="relative w-full bg-fixed bg-[length:550px_550px] bg-repeat pt-[0px]"
            style={{ backgroundImage: 'url("/images/bg4.png")' }}
        >
            {children}
        </div>
    );
}
