import React from 'react';
import { BsPersonFillAdd } from 'react-icons/bs';
import { MdRemoveCircle } from 'react-icons/md';
import { useUsers } from '../../lib/hooks/use-users';
import { UserId } from '../../lib/schema';
import { Link } from './link';

export interface EditableUsersProps {
    users: readonly UserId[];
    readonly?: boolean;
    onChange?: (users: UserId[]) => void;
}

export function EditableUsers({ users, onChange, readonly }: EditableUsersProps) {
    const { userData } = useUsers();
    const [randomUser] = userData.keys();

    return (
        <div className="flex flex-row flex-wrap gap-2">
            <strong className="m-0 flex flex-row flex-wrap gap-2 text-lg text-accent-600 dark:text-accent-500">
                {users.map((userId, index) => {
                    if (!readonly && onChange) {
                        return (
                            <div
                                className="flex flex-row gap-2"
                                key={`${userId} ${index}`}
                            >
                                <select
                                    value={userId}
                                    onChange={(event) => {
                                        const newUsers = [...users];
                                        newUsers[index] = event.target.value as UserId;
                                        onChange(newUsers);
                                    }}
                                >
                                    {[...userData].map(([userId, user]) => (
                                        <option
                                            key={userId}
                                            value={userId}
                                        >
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                                {index > 0 && (
                                    <button
                                        onClick={() => {
                                            const newUsers = [...users];
                                            newUsers.splice(index, 1);
                                            onChange(newUsers);
                                        }}
                                    >
                                        <MdRemoveCircle />
                                    </button>
                                )}
                            </div>
                        );
                    }
                    return (
                        <Link
                            href={`/users/${userId}`}
                            key={userId}
                        >
                            {userData.get(userId)?.name ?? `unknown user:${userId}`}
                        </Link>
                    );
                })}
                {!readonly && onChange && (
                    <button
                        onClick={() => {
                            onChange([...users, randomUser]);
                        }}
                    >
                        <BsPersonFillAdd />
                    </button>
                )}
            </strong>
        </div>
    );
}
