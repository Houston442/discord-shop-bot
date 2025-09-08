// utils/youtubeMonitor.js
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

class YouTubeMonitor {
    constructor(database) {
        this.database = database;
        this.apiKey = process.env.YOUTUBE_API_KEY;
    }

    async checkForNewVideos() {
        if (!this.apiKey) {
            console.log('YouTube API key not configured');
            return;
        }

        try {
            const creators = await this.database.getCreators('youtube');
            
            for (const creator of creators) {
                await this.checkCreatorVideos(creator);
            }
        } catch (error) {
            console.error('Error checking YouTube videos:', error);
        }
    }

    async checkCreatorVideos(creator) {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    key: this.apiKey,
                    channelId: creator.creator_id,
                    order: 'date',
                    maxResults: 1,
                    part: 'snippet',
                    type: 'video'
                }
            });

            const videos = response.data.items;
            if (videos.length === 0) return;

            const latestVideo = videos[0];
            
            // Check if this is a new video
            if (latestVideo.id.videoId !== creator.last_video_id) {
                await this.announceNewVideo(creator, latestVideo);
                
                // Update last video ID in database
                await this.database.pool.query(
                    'UPDATE creators SET last_video_id = $1 WHERE id = $2',
                    [latestVideo.id.videoId, creator.id]
                );
            }
        } catch (error) {
            console.error(`Error checking videos for ${creator.creator_name}:`, error);
        }
    }

    async announceNewVideo(creator, video) {
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
                .setTitle('🎥 New YouTube Video!')
                .setDescription(`**${creator.creator_name}** just uploaded a new video!`)
                .addFields(
                    { name: 'Title', value: video.snippet.title },
                    { name: 'Link', value: `https://www.youtube.com/watch?v=${video.id.videoId}` }
                )
                .setThumbnail(video.snippet.thumbnails.medium.url)
                .setColor('#FF0000')
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`Announced new video from ${creator.creator_name}`);
            
            client.destroy();
        } catch (error) {
            console.error('Error announcing new video:', error);
        }
    }
}

module.exports = YouTubeMonitor;