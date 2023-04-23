import { ReactNode } from 'react';
import { Header } from './header';
import style from './page.module.scss';

interface PageContainerProps {
    children?: ReactNode;
    wrapper?: boolean;
}

export function PageContainer({ children, wrapper }: PageContainerProps) {
    return (
        <div className={style.container}>
            <Header />
            {wrapper ? (
                <main className={`${style.main} p-0 lg:p-4`}>
                    <div className="mb-6 bg-fade-100 p-4 dark:bg-fade-800 lg:rounded-lg">{children}</div>
                </main>
            ) : (
                <main className={`${style.main} p-4`}>{children}</main>
            )}
        </div>
    );
}
