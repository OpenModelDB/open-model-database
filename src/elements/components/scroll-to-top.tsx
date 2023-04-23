import { memo, useEffect, useState } from 'react';
import { FiArrowUpCircle } from 'react-icons/fi';
import style from './scroll-to-top.module.scss';

// eslint-disable-next-line react/display-name
export const ScrollToTop = memo(() => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setVisible(window.pageYOffset > 600);
        };
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <button
            aria-label="Scroll to top"
            className={style.scrollToTop}
            style={{ opacity: visible ? undefined : '0', pointerEvents: visible ? undefined : 'none' }}
            title="Scroll to top"
            onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
        >
            <FiArrowUpCircle />
        </button>
    );
});
