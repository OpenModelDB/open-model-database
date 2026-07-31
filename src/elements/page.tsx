import { ReactNode } from 'react';
import { joinClasses } from '../lib/util';
import { ScrollToTop } from './components/scroll-to-top';
import { SiteNotice } from './components/site-notice';
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
            <SiteNotice />
            <main className={joinClasses(style.main, wrapper ? style.padded : style.standard)}>{children}</main>
            <Footer />
            {scrollToTop && <ScrollToTop />}
        </div>
    );
}
