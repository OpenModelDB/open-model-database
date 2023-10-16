import { ChangeEvent, KeyboardEvent } from 'react';
import { joinClasses } from '../../lib/util';
import { SearchIcon } from './custom-icons';

type SearchBarProps = {
    className?: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onEnter?: (event: KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    brightIcon?: boolean;
};

export const SearchBar = ({
    className,
    value,
    onChange,
    onEnter,
    placeholder = 'Search',
    brightIcon,
}: SearchBarProps) => (
    <div className={joinClasses(className, 'relative flex h-10')}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon
                aria-hidden="true"
                className={`${brightIcon ? '' : 'text-gray-500 dark:text-gray-400'} h-5 w-5`}
            />
        </div>
        <input
            className="w-full rounded-lg border border-solid border-gray-300 bg-white px-4 py-2 pl-10 text-gray-700 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-700 dark:bg-fade-900 dark:text-gray-100 dark:focus:border-accent-500 dark:focus:ring-accent-500"
            placeholder={placeholder}
            size={1}
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onEnter?.(e);
                }
            }}
        />
    </div>
);
