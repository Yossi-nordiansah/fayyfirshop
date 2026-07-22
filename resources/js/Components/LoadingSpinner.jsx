import React from 'react';
import loadingGif from '@/assets/images/loading_transparent.gif';

/**
 * LoadingSpinner component that uses the high-quality loading_transparent.gif
 * to provide a premium and consistent loading animation across the app.
 */
export default function LoadingSpinner({ className = 'h-16 w-16', containerClassName = '', ...props }) {
    return (
        <div className={`flex items-center justify-center ${containerClassName}`}>
            <img
                src={loadingGif}
                alt="Loading..."
                className={`object-contain transition-all duration-300 ${className}`}
                {...props}
            />
        </div>
    );
}
