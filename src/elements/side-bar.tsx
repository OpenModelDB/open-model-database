import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import { BsDot } from 'react-icons/bs';
import { IconType } from 'react-icons/lib';
import { SideBar, SideBarItem } from '../lib/docs/side-bar';
import style from './side-bar.module.scss';

export interface SideBarProps {
    sideBar: SideBar;
}
export function SideBarView({ sideBar }: SideBarProps) {
    const { asPath } = useRouter();

    const [currentLink, setCurrentLink] = useState<string | undefined>(asPath.replace(/\/?(?:#[^]*)?$/, ''));

    useEffect(() => {
        setCurrentLink(asPath);
    }, [asPath]);

    const isCurrent = useCallback(
        ({ link }: SideBarItem): boolean => {
            if (!link || !currentLink) return false;

            let current = currentLink;
            while (current && current.includes('/')) {
                if (link === current) return true;
                current = current.replace(/\/?(?:#[^]*)$|\/[^#/]*$/, '');
            }
            return false;
        },
        [currentLink]
    );

    return (
        <div className={style.sideBar}>
            <p>Documentation</p>
            <SideBarItems
                isCurrent={isCurrent}
                items={sideBar.items}
                level={1}
            />
        </div>
    );
}

interface CurrentProps {
    isCurrent: (item: SideBarItem) => boolean;
}
interface RecurseProps extends CurrentProps {
    level: number;
}

function SideBarItems({ items, level, isCurrent }: { items: readonly SideBarItem[] } & RecurseProps) {
    return (
        <div className={`${style.list} ${getLevelClass(level)}`}>
            {items.map((item, i) => {
                const key = i;
                if (isBranch(item)) {
                    return (
                        <SideBarBranch
                            isCurrent={isCurrent}
                            item={item}
                            key={key}
                            level={level}
                        />
                    );
                } else {
                    return (
                        <SideBarItem
                            icon="leaf"
                            isCurrent={isCurrent}
                            item={item}
                            key={key}
                        />
                    );
                }
            })}
        </div>
    );
}

type Branch = SideBarItem & Required<Pick<SideBarItem, 'items'>>;
function isBranch(item: SideBarItem): item is Branch {
    return item.items !== undefined;
}

function SideBarBranch({ item, level, isCurrent }: { item: Branch } & RecurseProps) {
    const [collapsed, setCollapsed] = useState(false);
    const toggle = useCallback(() => setCollapsed((prev) => !prev), []);
    return (
        <div className={style.branch}>
            <SideBarItem
                icon={collapsed ? 'branch-collapsed' : 'branch-open'}
                isCurrent={isCurrent}
                item={item}
                onClick={toggle}
            />
            {!collapsed && (
                <SideBarItems
                    isCurrent={isCurrent}
                    items={item.items}
                    level={level + 1}
                />
            )}
        </div>
    );
}
type ItemIcon = 'leaf' | 'branch-open' | 'branch-collapsed';
const iconMap: Record<ItemIcon, IconType> = {
    leaf: BsDot,
    'branch-open': BiChevronDown,
    'branch-collapsed': BiChevronRight,
};
function SideBarItem({
    item,
    icon,
    onClick,
    isCurrent,
}: {
    item: Omit<SideBarItem, 'items'>;
    icon: ItemIcon;
    onClick?: () => void;
} & CurrentProps) {
    const Icon = iconMap[icon];

    const classes = [style.item];
    if (isCurrent(item)) classes.push(style.current);

    return (
        <div className={classes.join(' ')}>
            <Icon
                className={style.itemIcon + (onClick ? ` ${style.clickable}` : '')}
                onClick={onClick}
            />
            {!item.fakeLink ? (
                <Link
                    className={`${style.itemText} ${style.clickable}`}
                    href={item.link}
                >
                    {item.title}
                </Link>
            ) : (
                <button className={style.itemText}>{item.title}</button>
            )}
        </div>
    );
}

function getLevelClass(level: number): string {
    switch (level) {
        case 1:
        case 2:
        case 3:
            return style[`level${level}`];
        default:
            throw new Error('Unsupported level. 4 levels of nesting are not supported.');
    }
}
