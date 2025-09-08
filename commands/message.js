// commands/message.js - Simple message sending commands
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'message',
    description: 'Send messages through the bot with custom emoji support',
    
    async execute(message, args, database) {
        // Check if user has admin permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need administrator permissions to use this command!');
        }

        const subCommand = args[0];
        
        switch (subCommand) {
            case 'send':
                await this.sendMessage(message, args, database);
                break;
                
            case 'edit':
                await this.editMessage(message, args, database);
                break;
                
            case 'sendembed':
                await this.sendEmbed(message, args, database);
                break;
                
            case 'channel':
                await this.sendToChannel(message, args, database);
                break;
                
            case 'dm':
                await this.sendDM(message, args, database);
                break;
                
            case 'announce':
                await this.sendAnnouncement(message, args, database);
                break;
                
            default:
                await this.showHelp(message);
        }
    },

    // Send a simple message in current channel
    async sendMessage(message, args, database) {
        try {
            const messageContent = args.slice(1).join(' ');
            
            if (!messageContent) {
                return message.reply('Usage: `!message send Your message here with :custom_emoji: support`\nExample: `!message send Welcome to the shop! :shop_icon: Check out our deals :fire:`');
            }

            // Process custom emojis
            const processedMessage = await this.processEmojis(messageContent, message.guild);
            
            // Send the message
            const sentMessage = await message.channel.send(processedMessage);
            
            // Delete the command message
            await message.delete().catch(() => {});
            
            console.log(`Message sent by ${message.author.username}: ${messageContent}`);
            
        } catch (error) {
            console.error('Error sending message:', error);
            await message.reply('❌ Error sending message. Check emoji names and permissions.');
        }
    },

    // Edit an existing message by ID
    async editMessage(message, args, database) {
        try {
            const messageId = args[1];
            const newContent = args.slice(2).join(' ');
            
            if (!messageId || !newContent) {
                return message.reply('Usage: `!message edit <message_id> New message content here`\nTo get message ID: Enable Developer Mode → Right-click message → Copy Message ID');
            }

            // Find and edit the message
            const targetMessage = await message.channel.messages.fetch(messageId);
            const processedContent = await this.processEmojis(newContent, message.guild);
            
            await targetMessage.edit(processedContent);
            await message.reply(`✅ Message edited successfully!`);
            
            // Delete the command message
            setTimeout(async () => {
                await message.delete().catch(() => {});
            }, 2000);
            
        } catch (error) {
            console.error('Error editing message:', error);
            await message.reply('❌ Error editing message. Check message ID exists and bot has permissions.');
        }
    },

    // Send an embedded message
    async sendEmbed(message, args, database) {
        try {
            const content = args.slice(1).join(' ');
            
            if (!content) {
                return message.reply('Usage: `!message sendembed Title | Description | Color`\nExample: `!message sendembed Shop Rules | No scamming allowed :warning: | #FF0000`');
            }

            // Parse embed parts (title | description | color)
            const parts = content.split(' | ');
            const title = parts[0] || 'Message';
            const description = parts[1] || '';
            const color = parts[2] || '#0099FF';

            const processedDescription = await this.processEmojis(description, message.guild);

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(processedDescription)
                .setColor(color)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            
        } catch (error) {
            console.error('Error sending embed:', error);
            await message.reply('❌ Error sending embed. Check color format (#RRGGBB) and content.');
        }
    },

    // Send message to specific channel
    async sendToChannel(message, args, database) {
        try {
            const channelId = args[1]?.replace(/[<#>]/g, '');
            const messageContent = args.slice(2).join(' ');
            
            if (!channelId || !messageContent) {
                return message.reply('Usage: `!message channel #channel-name Your message here`\nExample: `!message channel #announcements New items available! :tada:`');
            }

            const targetChannel = message.guild.channels.cache.get(channelId);
            if (!targetChannel) {
                return message.reply('❌ Channel not found!');
            }

            const processedMessage = await this.processEmojis(messageContent, message.guild);
            await targetChannel.send(processedMessage);
            
            await message.reply(`✅ Message sent to ${targetChannel}!`);
            setTimeout(async () => {
                await message.delete().catch(() => {});
            }, 3000);
            
        } catch (error) {
            console.error('Error sending to channel:', error);
            await message.reply('❌ Error sending message to channel. Check permissions.');
        }
    },

    // Send DM to user
    async sendDM(message, args, database) {
        try {
            const userId = args[1]?.replace(/[<@!>]/g, '');
            const messageContent = args.slice(2).join(' ');
            
            if (!userId || !messageContent) {
                return message.reply('Usage: `!message dm @user Your message here`\nExample: `!message dm @customer Thank you for your purchase! :heart:`');
            }

            const targetUser = await message.guild.members.fetch(userId);
            if (!targetUser) {
                return message.reply('❌ User not found!');
            }

            const processedMessage = await this.processEmojis(messageContent, message.guild);
            await targetUser.send(processedMessage);
            
            await message.reply(`✅ DM sent to ${targetUser.user.username}!`);
            setTimeout(async () => {
                await message.delete().catch(() => {});
            }, 3000);
            
        } catch (error) {
            console.error('Error sending DM:', error);
            await message.reply('❌ Error sending DM. User may have DMs disabled.');
        }
    },

    // Send announcement with @everyone or @here
    async sendAnnouncement(message, args, database) {
        try {
            const pingType = args[1]; // 'everyone' or 'here'
            const messageContent = args.slice(2).join(' ');
            
            if (!pingType || !messageContent) {
                return message.reply('Usage: `!message announce <everyone|here> Your announcement here`\nExample: `!message announce everyone Server maintenance in 1 hour! :tools:`');
            }

            let ping = '';
            if (pingType === 'everyone') {
                ping = '@everyone ';
            } else if (pingType === 'here') {
                ping = '@here ';
            } else {
                return message.reply('❌ Ping type must be "everyone" or "here"');
            }

            const processedMessage = await this.processEmojis(messageContent, message.guild);
            const fullMessage = ping + processedMessage;
            
            await message.channel.send(fullMessage);
            await message.delete().catch(() => {});
            
        } catch (error) {
            console.error('Error sending announcement:', error);
            await message.reply('❌ Error sending announcement. Check permissions.');
        }
    },

    // Process custom emojis in message content
    async processEmojis(content, guild) {
        try {
            // Replace :emoji_name: with actual custom emoji
            return content.replace(/:(\w+):/g, (match, emojiName) => {
                // Find custom emoji in guild
                const customEmoji = guild.emojis.cache.find(emoji => emoji.name === emojiName);
                if (customEmoji) {
                    return customEmoji.toString();
                }
                // If not found, keep original format (might be Unicode emoji)
                return match;
            });
        } catch (error) {
            console.error('Error processing emojis:', error);
            return content; // Return original if error
        }
    },

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('📝 Message Commands')
            .setDescription('Send messages through the bot with custom emoji support')
            .addFields(
                { name: '**Basic Messaging**', value: '\u200B', inline: false },
                { name: '`!message send <message>`', value: 'Send message in current channel\nExample: `!message send Welcome! :shop_icon:`' },
                { name: '`!message edit <id> <message>`', value: 'Edit existing bot message by ID\nExample: `!message edit 123456 Updated text :check:`' },
                { name: '`!message sendembed <title|desc|color>`', value: 'Send embedded message\nExample: `!message sendembed Rules | No spam :x: | #FF0000`' },
                
                { name: '**Channel & User Messaging**', value: '\u200B', inline: false },
                { name: '`!message channel #channel <message>`', value: 'Send to specific channel\nExample: `!message channel #general Hello :wave:`' },
                { name: '`!message dm @user <message>`', value: 'Send DM to user\nExample: `!message dm @customer Thanks :heart:`' },
                { name: '`!message announce <everyone|here> <msg>`', value: 'Send announcement with ping\nExample: `!message announce everyone Update! :bell:`' },
                
                { name: '**Emoji Support**', value: '\u200B', inline: false },
                { name: 'Custom Emojis', value: 'Use `:emoji_name:` format for custom server emojis\nExample: `:shop_icon:`, `:verified:`, `:diamond:`' },
                { name: 'Unicode Emojis', value: 'Regular emojis work normally: 🎉 ❤️ ⚠️ 🛒 💎' },
                
                { name: '**Tips**', value: '\u200B', inline: false },
                { name: 'Message ID', value: 'Enable Developer Mode → Right-click message → Copy Message ID' },
                { name: 'Embed Colors', value: 'Use hex format: #FF0000 (red), #00FF00 (green), #0099FF (blue)' },
                { name: 'Permissions', value: 'Bot needs Send Messages permission in target channels' }
            )
            .setColor('#0099FF')
            .setFooter({ text: 'All commands require Administrator permissions' });
            
        await message.reply({ embeds: [embed] });
    }
};
