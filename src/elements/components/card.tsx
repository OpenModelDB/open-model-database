import { joinClasses } from '../../lib/util';
import style from './card.module.scss';

type ImageSize = 'sm' | 'md' | 'lg';

export interface CardProps {
    title: string;
    description: string;
    tags: readonly string[];
    image?: string;
    href?: string;
    imgSize?: ImageSize;
}

const getImgSize = (size: ImageSize) => {
    switch (size) {
        case 'sm':
            return 'h-32';
        case 'md':
            return 'h-64';
        case 'lg':
            return 'h-96';
        default:
            return 'h-32';
    }
};

export function Card({ title, description, tags, image, href, imgSize = 'sm' }: CardProps) {
    return (
        <a
            className={joinClasses(
                'relative flex w-64 flex-col items-start justify-between overflow-hidden rounded-xl shadow-md',
                style.card
            )}
            href={href}
        >
            {image && (
                <div className={joinClasses('m-0 w-full p-0', getImgSize(imgSize))}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt="img"
                        className={joinClasses('w-full overflow-hidden object-cover', getImgSize(imgSize))}
                        src={image}
                    />
                </div>
            )}
            <div className="p-4 text-gray-500">
                <h3 className="my-0 text-lg font-bold text-gray-900 ">{title}</h3>

                <p className="my-3 hidden text-sm sm:block">{description}</p>

                <div className="flex w-full flex-row flex-wrap">
                    {tags.map((tag) => (
                        <span
                            className="mr-2 mb-2 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-600"
                            key={tag}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </a>
    );
}
