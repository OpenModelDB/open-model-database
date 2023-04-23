import { ReactNode } from 'react';
import { ScrollToTop } from './components/scroll-to-top';
import { Header } from './header';
import style from './page.module.scss';

interface PageContainerProps {
    children?: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
    return (
        <div className={style.container}>
            <Header />
            <main className={style.main}>{children}</main>
            <ScrollToTop />
        </div>
    );
}
