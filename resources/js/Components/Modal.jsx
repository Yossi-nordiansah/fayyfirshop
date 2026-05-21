export default function Modal({ children, show = false, maxWidth = '2xl', closeable = true, onClose = () => {} }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0 flex items-center justify-center">
            <div className="fixed inset-0 transform transition-all" onClick={closeable ? onClose : null}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className={`bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:w-full max-w-${maxWidth}`}>
                {children}
            </div>
        </div>
    );
}
