import React from 'react';
import logoPattern from '@/assets/images/Logo pattern.png';

/**
 * LoadingSpinner component that uses the Logo pattern.png
 * with a smooth spinning animation across the app.
 */
export default function LoadingSpinner({ className = 'h-16 w-16', containerClassName = '', ...props }) {
    return (
        <div className={`flex items-center justify-center ${containerClassName}`}>
            <img
                src={logoPattern}
                alt="Loading..."
                className={`object-contain transition-all duration-300 animate-spin ${className}`}
                style={{ animationDuration: '1.2s', animationTimingFunction: 'linear' }}
                {...props}
            />
        </div>
    );
}
