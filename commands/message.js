// commands/message.js - Complete Clean Version with Enhanced Embed Features
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Send messages through the bot with custom emoji support')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a message in the current channel')
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Message content with emoji support')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing bot message')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('ID of the message to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('New message content')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('Send an embedded message with full customization')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Embed title')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Embed description (use \\n for line breaks)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Embed color (hex format like #FF0000)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('thumbnail')
                        .setDescription('Thumbnail image URL')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('Main image URL')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('footer')
                        .setDescription('Footer text')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Send message to specific channel')
                .addChannelOption(option =>
                    option.setName('target_channel')
                        .setDescription('Channel to send message to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Message content with emoji support')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dm')
                .setDescription('Send direct message to user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to send DM to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Message content with emoji support')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('announce')
                .setDescription('Send announcement with ping')
                .addStringOption(option =>
                    option.setName('ping_type')
                        .setDescription('Type of ping to use')
                        .setRequired(true)
                        .addChoices(
                            { name: '@everyone', value: 'everyone' },
                            { name: '@here', value: 'here' }
                        ))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Announcement content with emoji support')
                        .setRequired(true))),
    
    async execute(interaction, database) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'send':
                await this.sendMessage(interaction, database);
                break;
            case 'edit':
                await this.editMessage(interaction, database);
                break;
            case 'embed':
                await this.sendEmbed(interaction, database);
                break;
            case 'channel':
                await this.sendToChannel(interaction, database);
                break;
            case 'dm':
                await this.sendDM(interaction, database);
                break;
            case 'announce':
                await this.sendAnnouncement(interaction, database);
                break;
        }
    },

    async sendMessage(interaction, database) {
        try {
            const content = interaction.options.getString('content');
            const processedMessage = await this.processEmojis(content, interaction.guild);
            
            await interaction.reply({ content: processedMessage });
            console.log(`Message sent by ${interaction.user.username}: ${content}`);
            
        } catch (error) {
            console.error('Error sending message:', error);
            await interaction.reply({ content: '❌ Error sending message. Check emoji names and permissions.', ephemeral: true });
        }
    },

    async editMessage(interaction, database) {
        try {
            const messageId = interaction.options.getString('message_id');
            const newContent = interaction.options.getString('content');
            
            const targetMessage = await interaction.channel.messages.fetch(messageId);
            const processedContent = await this.processEmojis(newContent, interaction.guild);
            
            await targetMessage.edit(processedContent);
            await interaction.reply({ content: '✅ Message edited successfully!', ephemeral: true });
            
        } catch (error) {
            console.error('Error editing message:', error);
            await interaction.reply({ content: '❌ Error editing message. Check message ID exists and bot has permissions.', ephemeral: true });
        }
    },

    async sendEmbed(interaction, database) {
        try {
            const title = interaction.options.getString('title');
            let description = interaction.options.getString('description');
            const color = interaction.options.getString('color') || '#0099FF';
            const thumbnail = interaction.options.getString('thumbnail');
            const image = interaction.options.getString('image');
            const footer = interaction.options.getString('footer');

            // Convert \n to actual line breaks for description
            if (description) {
                description = description.replace(/\\n/g, '\n');
            }

            // Process emojis in title, description, and footer
            const processedTitle = await this.processEmojis(title, interaction.guild);
            const processedDescription = await this.processEmojis(description, interaction.guild);
            const processedFooter = footer ? await this.processEmojis(footer, interaction.guild) : null;

            const embed = new EmbedBuilder()
                .setTitle(processedTitle)
                .setDescription(processedDescription)
                .setColor(color);

            // Add optional elements if provided
            if (thumbnail) {
                try {
                    embed.setThumbnail(thumbnail);
                } catch (error) {
                    console.error('Invalid thumbnail URL:', error);
                }
            }

            if (image) {
                try {
                    embed.setImage(image);
                } catch (error) {
                    console.error('Invalid image URL:', error);
                }
            }

            if (processedFooter) {
                embed.setFooter({ text: processedFooter });
            }

            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error sending embed:', error);
            await interaction.reply({ 
                content: 'Error sending embed. Check that:\n• Color is in hex format (#FF0000)\n• Image/thumbnail URLs are valid\n• Title and description are not too long', 
                ephemeral: true 
            });
        }
    },

    async sendToChannel(interaction, database) {
        try {
            const targetChannel = interaction.options.getChannel('target_channel');
            const content = interaction.options.getString('content');
            
            const processedMessage = await this.processEmojis(content, interaction.guild);
            await targetChannel.send(processedMessage);
            
            await interaction.reply({ content: `✅ Message sent to ${targetChannel}!`, ephemeral: true });
            
        } catch (error) {
            console.error('Error sending to channel:', error);
            await interaction.reply({ content: '❌ Error sending message to channel. Check permissions.', ephemeral: true });
        }
    },

    async sendDM(interaction, database) {
        try {
            const user = interaction.options.getUser('user');
            const content = interaction.options.getString('content');
            
            const processedMessage = await this.processEmojis(content, interaction.guild);
            await user.send(processedMessage);
            
            await interaction.reply({ content: `✅ DM sent to ${user.username}!`, ephemeral: true });
            
        } catch (error) {
            console.error('Error sending DM:', error);
            await interaction.reply({ content: '❌ Error sending DM. User may have DMs disabled.', ephemeral: true });
        }
    },

    async sendAnnouncement(interaction, database) {
        try {
            const pingType = interaction.options.getString('ping_type');
            const content = interaction.options.getString('content');
            
            const ping = pingType === 'everyone' ? '@everyone ' : '@here ';
            const processedMessage = await this.processEmojis(content, interaction.guild);
            const fullMessage = ping + processedMessage;
            
            await interaction.reply(fullMessage);
            
        } catch (error) {
            console.error('Error sending announcement:', error);
            await interaction.reply({ content: '❌ Error sending announcement. Check permissions.', ephemeral: true });
        }
    },

    async processEmojis(content, guild) {
        try {
            return content.replace(/:(\w+):/g, (match, emojiName) => {
                const customEmoji = guild.emojis.cache.find(emoji => emoji.name === emojiName);
                if (customEmoji) {
                    return customEmoji.toString();
                }
                return match;
            });
        } catch (error) {
            console.error('Error processing emojis:', error);
            return content;
        }
    }
};
