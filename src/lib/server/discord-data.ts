import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { DiscordData } from '../schema';

const discordApiToken = process.env.DISCORD_API_TOKEN || '';

const rest = new REST().setToken(discordApiToken);

export interface IDiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    banner: string | null;
    accent_color: number | null;
    banner_color: number | null;
    display_name: string | null;
}

const fetchUser = async (id: string) => rest.get(Routes.user(id)) as Promise<IDiscordUser>;

export const getDiscordUserInfo = async (userId: string): Promise<DiscordData | null> => {
    if (!discordApiToken) {
        return null;
    }
    try {
        const user = await fetchUser(userId);
        const { id, username, display_name, discriminator, avatar, banner, banner_color, accent_color } = user;

        let avatarUrl: string | null = null;
        let bannerUrl: string | null = null;

        try {
            avatarUrl = avatar
                ? rest.cdn.avatar(id, avatar, {
                      extension: 'png',
                      size: 128,
                  })
                : null;
            bannerUrl = banner
                ? rest.cdn.banner(id, banner, {
                      extension: 'png',
                      size: 256,
                  })
                : null;
        } catch (e) {
            console.log(e);
        }
        return {
            id,
            username,
            displayName: display_name,
            discriminator,
            avatarUrl,
            bannerUrl,
            bannerColor: banner_color,
            accentColor: accent_color,
        };
    } catch (e) {
        console.log(e);
        return null;
    }
};
