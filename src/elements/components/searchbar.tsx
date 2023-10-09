import { ChangeEvent, KeyboardEvent } from 'react';

type SearchBarProps = {
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onEnter?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export const SearchBar = ({ value, onChange, onEnter }: SearchBarProps) => (
    <div className="relative mb-4 flex h-10 w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
                aria-hidden="true"
                className="h-5 w-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                />
            </svg>
        </div>
        <input
            className="w-full rounded-lg border border-solid border-gray-300 bg-white px-4 py-2 pl-10 text-gray-700 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-700 dark:bg-fade-900 dark:text-gray-100 dark:focus:border-accent-500 dark:focus:ring-accent-500"
            placeholder="Search"
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
