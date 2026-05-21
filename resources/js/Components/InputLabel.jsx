export default function InputLabel({ value, className = '', children, ...props }) {
    return (
        <label className={'block font-medium text-sm text-gray-700 ' + className} {...props}>
            {value ? value : children}
        </label>
    );
}
