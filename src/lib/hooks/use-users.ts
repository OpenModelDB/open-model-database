import { User, UserId } from '../schema';
import { STATIC_USER_DATA } from '../static-data';

export interface UseUsers {
    readonly userData: ReadonlyMap<UserId, User>;
}

const result: UseUsers = {
    userData: STATIC_USER_DATA,
};

export function useUsers(): UseUsers {
    return result;
}
