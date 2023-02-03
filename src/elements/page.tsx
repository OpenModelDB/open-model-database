import { ReactNode } from 'react';
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
        </div>
    );
}
