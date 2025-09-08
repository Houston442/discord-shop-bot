// utils/twitchMonitor.js
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

class TwitchMonitor {
    constructor(database) {
        this.database = database;
        this.clientId = process.env.TWITCH_CLIENT_ID;
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
        this.accessToken = null;
    }

    async getAccessToken() {
        try {
            const response = await axios.post('https://id.twitch.tv/oauth2/token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials'
            });
            
            this.accessToken = response.data.access_token;
            return this.accessToken;
        } catch (error) {
            console.error('Error getting Twitch access token:', error);
            return null;
        }
    }

    async checkForLiveStreams() {
        if (!this.clientId || !this.clientSecret) {
            console.log('Twitch API credentials not configured');
            return;
        }

        try {
            if (!this.accessToken) {
                await this.getAccessToken();
            }

            const creators = await this.database.getCreators('twitch');
            
            for (const creator of creators) {
                await this.checkCreatorStream(creator);
            }
        } catch (error) {
            console.error('Error checking Twitch streams:', error);
        }
    }

    async checkCreatorStream(creator) {
        try {
            const response = await axios.get('https://api.twitch.tv/helix/streams', {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: {
                    user_login: creator.creator_id
                }
            });

            const streams = response.data.data;
            const isLive = streams.length > 0;

            // Check if stream status changed
            if (isLive && !creator.is_live) {
                // Just went live
                await this.announceLiveStream(creator, streams[0]);
                await this.database.pool.query(
                    'UPDATE creators SET is_live = TRUE WHERE id = $1',
                    [creator.id]
                );
            } else if (!isLive && creator.is_live) {
                // Just went offline
                await this.database.pool.query(
                    'UPDATE creators SET is_live = FALSE WHERE id = $1',
                    [creator.id]
                );
            }
        } catch (error) {
            if (error.response?.status === 401) {
                // Token expired, get new one
                await this.getAccessToken();
            } else {
                console.error(`Error checking stream for ${creator.creator_name}:`, error);
            }
        }
    }

    async announceLiveStream(creator, stream) {
        try {
            const { Client, GatewayIntentBits } = require('discord.js');
            const client = new Client({ intents: [GatewayIntentBits.Guilds] });
            
            await client.login(process.env.DISCORD_TOKEN);
            
            const channel = client.channels.cache.get(creator.channel_id);
            if (!channel) {
                client.destroy();
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🔴 LIVE ON TWITCH!')
                .setDescription(`**${creator.creator_name}** is now live!`)
                .addFields(
                    { name: 'Title', value: stream.title || 'No title' },
                    { name: 'Game', value: stream.game_name || 'Not specified' },
                    { name: 'Viewers', value: stream.viewer_count.toString(), inline: true },
                    { name: 'Link', value: `https://www.twitch.tv/${creator.creator_id}` }
                )
                .setThumbnail(stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'))
                .setColor('#9146FF')
                .setTimestamp();

            await channel.send({ content: '@everyone', embeds: [embed] });
            console.log(`Announced live stream from ${creator.creator_name}`);
            
            client.destroy();
        } catch (error) {
            console.error('Error announcing live stream:', error);
        }
    }
}

module.exports = TwitchMonitor;