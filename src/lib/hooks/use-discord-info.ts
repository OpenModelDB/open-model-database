import { useEffect, useState } from 'react';
import { DiscordData } from '../schema';

const discordApiToken = process.env.DISCORD_API_TOKEN;

const rest = new REST().setToken(token);

const fetchUser = async (id) => rest.get(Routes.user(id));

const getUserInfo = async (userId) => {
    try {
        const user = await fetchUser(userId);
        console.log('🚀 ~ file: single_user.js:18 ~ getUserInfo ~ user:', user);

        const { id, username, display_name, discriminator, avatar, banner, banner_color, accent_color } = user;

        try {
            const avatar_url = avatar
                ? await rest.cdn.avatar(id, avatar, {
                      extension: 'png',
                      size: 1024,
                  })
                : null;
            const banner_url = banner
                ? await rest.cdn.banner(id, banner, {
                      extension: 'png',
                      size: 1024,
                  })
                : null;
            return {
                id,
                username,
                display_name,
                discriminator,
                avatar_url,
                banner_url,
                banner_color,
                accent_color,
            };
        } catch (e) {
            console.log(e);
            return {
                id,
                username,
                display_name,
                discriminator,
                avatar_url: null,
                banner_url: null,
                banner_color,
                accent_color,
            };
        }
    } catch (e) {
        console.log(e);
        return;
    }
};

export const useDiscordInfo = (id: string) => {
    const [userInfo, setUserInfo] = useState<DiscordData>();

    useEffect(() => {
        // Fetch request to Discord API
    }, []);

    return webApi ? { webApi, editMode: true } : { webApi, editMode: false };
};
