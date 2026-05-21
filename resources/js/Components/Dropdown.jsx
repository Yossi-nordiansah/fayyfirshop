import { createContext, useContext, useState } from 'react';
import { Link } from '@inertiajs/react';

const DropdownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((previousState) => !previousState);
    return (
        <DropdownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropdownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, toggleOpen } = useContext(DropdownContext);
    return <div onClick={toggleOpen}>{children}</div>;
};

const Content = ({ align = 'right', width = '48', contentClasses = 'py-1 bg-white', children }) => {
    const { open, setOpen } = useContext(DropdownContext);
    if (!open) return null;
    return (
        <div className="absolute z-50 mt-2 rounded-md shadow-lg" onClick={() => setOpen(false)}>
            <div className={`rounded-md ring-1 ring-black ring-opacity-5 ${contentClasses}`}>{children}</div>
        </div>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
