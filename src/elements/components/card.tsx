import { joinClasses } from '../../lib/util';
import style from './card.module.scss';

export interface CardProps {
    title: string;
    description: string;
    tags: readonly string[];
    image: string;
}

export function Card({ title, description, tags, image }: React.PropsWithChildren<CardProps>) {
    return (
        <a
            className={joinClasses(
                'relative flex w-64 flex-col items-start justify-between overflow-hidden rounded-xl border border-gray-100 shadow-xl',
                style.card
            )}
            href="#"
        >
            <div className="m-0 h-32 w-full p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="img"
                    className="h-32 w-full overflow-hidden object-cover"
                    src={image}
                />
            </div>
            <div className="p-4 text-gray-500 ">
                <h3 className="my-0 text-lg font-bold text-gray-900">{title}</h3>

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
