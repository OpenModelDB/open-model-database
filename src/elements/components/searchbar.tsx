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
    /** `large` is for a page's primary search; `default` for the header and inline use. */
    size?: 'default' | 'large';
    'aria-label'?: string;
};

export const SearchBar = ({
    className,
    value,
    onChange,
    onEnter,
    placeholder = 'Search',
    brightIcon,
    size = 'default',
    'aria-label': ariaLabel,
}: SearchBarProps) => {
    const large = size === 'large';

    return (
        <div className={joinClasses(className, 'relative flex', large ? 'h-14' : 'h-10')}>
            <div
                className={joinClasses(
                    'pointer-events-none absolute inset-y-0 left-0 flex items-center',
                    large ? 'pl-5' : 'pl-3'
                )}
            >
                <SearchIcon
                    aria-hidden="true"
                    className={joinClasses(brightIcon ? '' : 'text-ink-subtle', large ? 'h-6 w-6' : 'h-5 w-5')}
                />
            </div>
            <input
                aria-label={ariaLabel ?? placeholder}
                className={joinClasses(
                    'w-full border border-solid border-line bg-surface text-ink shadow-card',
                    'placeholder:text-ink-subtle',
                    'transition-colors duration-150',
                    'hover:border-line-strong',
                    'focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40',
                    large ? 'rounded-card px-5 pl-14 text-lg' : 'rounded-control px-4 pl-10 text-base'
                )}
                placeholder={placeholder}
                size={1}
                type="search"
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
};
