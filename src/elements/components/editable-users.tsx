import React from 'react';
import { BsPersonFillAdd } from 'react-icons/bs';
import { MdRemoveCircle } from 'react-icons/md';
import { User, UserId } from '../../lib/schema';
import { asArray } from '../../lib/util';
import { Link } from './link';

export interface EditableUsersProps {
    author: readonly UserId[];
    users: ReadonlyMap<UserId, User>;
    readonly?: boolean;
    onAdd?: () => void;
    onChange?: (newAuthor: UserId, index: number) => void;
    onRemove?: (index: number) => void;
}

export function EditableUsers({ author, users, onChange, onAdd, onRemove, readonly }: EditableUsersProps) {
    return (
        <div className="flex flex-row flex-wrap gap-2">
            <strong className="m-0 flex flex-row flex-wrap gap-2 text-lg text-accent-600 dark:text-accent-500">
                {asArray(author).map((userId, userIndex) => {
                    if (!readonly && onChange && onRemove) {
                        return (
                            <div
                                className="flex flex-row gap-2"
                                key={`${userId}${userIndex}`}
                            >
                                <select
                                    defaultValue=""
                                    value={userId}
                                    onChange={(event) => {
                                        const content = event.target.value as UserId;
                                        onChange(content, userIndex);
                                    }}
                                >
                                    <option value="">Select user</option>
                                    {[...users].map(([userId, user]) => (
                                        <option
                                            key={userId}
                                            value={userId}
                                        >
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                                {userIndex > 0 && (
                                    <button
                                        onClick={() => {
                                            onRemove(userIndex);
                                        }}
                                    >
                                        <MdRemoveCircle />
                                    </button>
                                )}
                            </div>
                        );
                    }
                    return (
                        <React.Fragment key={userId}>
                            <Link href={`/users/${userId}`}>{users.get(userId)?.name ?? `unknown user:${userId}`}</Link>
                        </React.Fragment>
                    );
                })}
                {!readonly && onAdd && (
                    <button onClick={onAdd}>
                        <BsPersonFillAdd />
                    </button>
                )}
            </strong>
        </div>
    );
}
