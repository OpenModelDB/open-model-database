import { ReactNode } from 'react';
import { joinClasses } from '../lib/util';
import { ScrollToTop } from './components/scroll-to-top';
import { Footer } from './footer';
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
            <main className={joinClasses(style.main, wrapper ? style.padded : 'py-4')}>{children}</main>
            <Footer />
            {scrollToTop && <ScrollToTop />}
        </div>
    );
}
