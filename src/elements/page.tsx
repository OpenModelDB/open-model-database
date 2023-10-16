import { ReactNode } from 'react';
import { ScrollToTop } from './components/scroll-to-top';
import { Header } from './header';
import style from './page.module.scss';

interface PageContainerProps {
    children?: ReactNode;
    scrollToTop?: boolean;
    wrapper?: boolean;
    searchBar?: boolean;
}
export function PageContainer({ children, scrollToTop, wrapper, searchBar }: PageContainerProps) {
    return (
        <div className={style.container}>
            <Header searchBar={searchBar} />
            {wrapper ? (
                <main className={`${style.main} p-0 xl:p-4`}>
                    <div className={`${style.wrapper} mb-6 bg-fade-100 p-4 dark:bg-fade-800 xl:rounded-lg`}>
                        {children}
                    </div>
                </main>
            ) : (
                <main className={`${style.main} p-4`}>{children}</main>
            )}
            {scrollToTop && <ScrollToTop />}
        </div>
    );
}
