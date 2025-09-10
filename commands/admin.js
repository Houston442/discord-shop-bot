// commands/admin.js - Complete Slash Command Version with URL Support
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for bot management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('syncmembers')
                .setDescription('Add all Discord server members to database'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('checkuser')
                .setDescription('View detailed user info, transactions, and activity')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Show server statistics and database overview'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('flagscammer')
                .setDescription('Flag user as scammer with optional reason')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to flag as scammer')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for flagging as scammer')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unflagscammer')
                .setDescription('Remove scammer flag from user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to unflag')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('scammerlist')
                .setDescription('Display all flagged scammers with notes'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('updatetransaction')
                .setDescription('Update transaction status')
                .addIntegerOption(option =>
                    option.setName('transaction_id')
                        .setDescription('Transaction ID to update')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('New status for the transaction')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Pending', value: 'pending' },
                            { name: 'Completed', value: 'completed' },
                            { name: 'Failed', value: 'failed' },
                            { name: 'Disputed', value: 'disputed' },
                            { name: 'Cancelled', value: 'cancelled' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('alltransactions')
                .setDescription('View all recent transactions'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pendingtransactions')
                .setDescription('View only pending transactions'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setwelcome')
                .setDescription('Set welcome DM for new members')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message to send to new members')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setpersistent')
                .setDescription('Set message that always stays last in channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for persistent message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message to keep persistent')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removepersistent')
                .setDescription('Remove persistent message from channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to remove persistent message from')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('addcreator')
                .setDescription('Add creator for monitoring using URL or ID')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('Platform type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'YouTube', value: 'youtube' },
                            { name: 'Twitch', value: 'twitch' }
                        ))
                .addStringOption(option =>
                    option.setName('url_or_id')
                        .setDescription('YouTube/Twitch URL or channel ID/username')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('creator_name')
                        .setDescription('Display name for the creator (optional - will auto-fetch if not provided)')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Discord channel to post notifications')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removecreator')
                .setDescription('Stop monitoring a creator')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('Platform type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'YouTube', value: 'youtube' },
                            { name: 'Twitch', value: 'twitch' }
                        ))
                .addStringOption(option =>
                    option.setName('creator_id')
                        .setDescription('Creator ID or username')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listcreators')
                .setDescription('Show all monitored creators'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup')
                .setDescription('Manually trigger database backup'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dbstats')
                .setDescription('Show detailed database statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('testdb')
                .setDescription('Test database connection'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Clean old messages/data (30+ days)')),
    
    async execute(interaction, database) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'syncmembers':
                await this.syncAllMembers(interaction, database);
                break;
            case 'checkuser':
                await this.checkUser(interaction, database);
                break;
            case 'stats':
                await this.showStats(interaction, database);
                break;
            case 'flagscammer':
                await this.flagScammer(interaction, database);
                break;
            case 'unflagscammer':
                await this.unflagScammer(interaction, database);
                break;
            case 'scammerlist':
                await this.listScammers(interaction, database);
                break;
            case 'updatetransaction':
                await this.updateTransaction(interaction, database);
                break;
            case 'alltransactions':
                await this.showAllTransactions(interaction, database);
                break;
            case 'pendingtransactions':
                await this.showPendingTransactions(interaction, database);
                break;
            case 'setwelcome':
                await this.setWelcomeMessage(interaction, database);
                break;
            case 'setpersistent':
                await this.setPersistentMessage(interaction, database);
                break;
            case 'removepersistent':
                await this.removePersistentChannel(interaction, database);
                break;
            case 'addcreator':
                await this.addCreator(interaction, database);
                break;
            case 'removecreator':
                await this.removeCreator(interaction, database);
                break;
            case 'listcreators':
                await this.listCreators(interaction, database);
                break;
            case 'backup':
                await this.manualBackup(interaction, database);
                break;
            case 'dbstats':
                await this.showDatabaseStats(interaction, database);
                break;
            case 'testdb':
                await this.testDatabase(interaction, database);
                break;
            case 'cleanup':
                await this.cleanupOldData(interaction, database);
                break;
        }
    },

    // ==================== USER MANAGEMENT ====================

    async syncAllMembers(interaction, database) {
        try {
            await interaction.deferReply();
            
            const guild = interaction.guild;
            const members = await guild.members.fetch();
            
            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            const totalMembers = members.size;
            const memberArray = Array.from(members.values());
            const batchSize = 50;

            for (let i = 0; i < memberArray.length; i += batchSize) {
                const batch = memberArray.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (member) => {
                    try {
                        if (member.user.bot) {
                            skippedCount++;
                            return;
                        }

                        const existingUser = await database.getUserInfo(member.user.id);
                        
                        if (existingUser) {
                            await database.updateUserInfo(member.user.id, member.user.username, member.user.discriminator);
                            updatedCount++;
                        } else {
                            await database.addUser(member.user.id, member.user.username, member.user.discriminator);
                            addedCount++;
                        }
                    } catch (error) {
                        console.error(`Error processing member ${member.user.username}:`, error);
                        errorCount++;
                    }
                }));

                const processed = Math.min(i + batchSize, memberArray.length);
                const progressPercent = Math.round((processed / totalMembers) * 100);
                
                if (i % 100 === 0 || processed === totalMembers) {
                    try {
                        await interaction.editReply(`🔄 Syncing members... ${processed}/${totalMembers} (${progressPercent}%)`);
                    } catch (editError) {
                        console.log('Could not edit status:', editError.message);
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Member Sync Complete!')
                .setDescription('All Discord members have been synchronized with the database.')
                .addFields(
                    { name: 'Total Members Processed', value: totalMembers.toString(), inline: true },
                    { name: 'New Users Added', value: addedCount.toString(), inline: true },
                    { name: 'Existing Users Updated', value: updatedCount.toString(), inline: true },
                    { name: 'Bots Skipped', value: skippedCount.toString(), inline: true },
                    { name: 'Errors', value: errorCount.toString(), inline: true }
                )
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.editReply({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('Error in syncAllMembers:', error);
            const errorMessage = 'An error occurred during member sync.';
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    async checkUser(interaction, database) {
        const user = interaction.options.getUser('user');
        
        try {
            const userInfo = await database.getUserInfo(user.id);
            const transactions = await database.getUserTransactions(user.id);
            const activity = await database.getUserActivity(user.id);
            
            if (!userInfo) {
                return await interaction.reply('❌ User not found in database! Try syncing members first with `/admin syncmembers`');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('👤 User Information')
                .setDescription(`<@${user.id}>`)
                .addFields(
                    { name: 'Username', value: userInfo.username, inline: true },
                    { name: 'Join Date', value: userInfo.join_date?.toLocaleDateString() || 'Unknown', inline: true },
                    { name: 'Last Activity', value: userInfo.last_activity?.toLocaleDateString() || 'Unknown', inline: true },
                    { name: 'Total Purchases', value: userInfo.total_purchases.toString(), inline: true },
                    { name: 'Total Spent', value: `$${parseFloat(userInfo.total_spent).toFixed(2)}`, inline: true },
                    { name: 'Is Scammer', value: userInfo.is_scammer ? '⚠️ YES' : '✅ No', inline: true },
                    { name: 'Recent Activity (7 days)', value: `${activity?.command_count || 0} commands`, inline: true },
                    { name: 'Recent Transactions', value: transactions.slice(0, 5).map(t => `${t.item_name} - $${parseFloat(t.total_amount).toFixed(2)} (${t.status})`).join('\n') || 'None', inline: false }
                )
                .setColor(userInfo.is_scammer ? '#FF0000' : '#00FF00')
                .setTimestamp();
                
            if (userInfo.scammer_notes) {
                embed.addFields({ name: 'Scammer Notes', value: userInfo.scammer_notes, inline: false });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error checking user:', error);
            await interaction.reply('❌ Error retrieving user information.');
        }
    },

    async showStats(interaction, database) {
        try {
            const totalUsers = await database.getTotalUserCount();
            const activeUsers = await database.getUserCount();
            const scammers = await database.getAllScammers();
            const recentUsers = await database.getRecentUsers(5);
            const stats = await database.getDatabaseStats();

            const embed = new EmbedBuilder()
                .setTitle('📊 Server Statistics')
                .addFields(
                    { name: 'Total Users in Database', value: totalUsers.toString(), inline: true },
                    { name: 'Active Users', value: activeUsers.toString(), inline: true },
                    { name: 'Flagged Scammers', value: scammers.length.toString(), inline: true },
                    { name: 'Total Transactions', value: stats.transactions_count?.toString() || '0', inline: true },
                    { name: 'Pending Transactions', value: stats.pending_transactions?.toString() || '0', inline: true },
                    { name: 'Total Revenue', value: `$${(stats.total_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Recent Joins', value: recentUsers.map(u => `${u.username} (${new Date(u.join_date).toLocaleDateString()})`).join('\n') || 'None', inline: false }
                )
                .setColor('#0099FF')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing stats:', error);
            await interaction.reply('❌ Error retrieving statistics.');
        }
    },

    // ==================== SCAMMER MANAGEMENT ====================

    async flagScammer(interaction, database) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            await database.flagUserAsScammer(user.id, reason);
            const embed = new EmbedBuilder()
                .setTitle('🚨 User Flagged as Scammer')
                .addFields(
                    { name: 'User', value: `<@${user.id}>`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Flagged by', value: interaction.user.username, inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error flagging scammer:', error);
            await interaction.reply('❌ Error flagging user as scammer.');
        }
    },

    async unflagScammer(interaction, database) {
        const user = interaction.options.getUser('user');
        
        try {
            await database.unflagUserAsScammer(user.id);
            await interaction.reply(`✅ User <@${user.id}> has been unflagged successfully!`);
        } catch (error) {
            console.error('Error unflagging scammer:', error);
            await interaction.reply('❌ Error unflagging user.');
        }
    },

    async listScammers(interaction, database) {
        try {
            const scammers = await database.getAllScammers();
            
            if (scammers.length === 0) {
                return await interaction.reply('✅ No flagged scammers found!');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🚨 Flagged Scammers')
                .setDescription(scammers.map(s => 
                    `<@${s.discord_id}> **(${s.username})**\n📝 ${s.scammer_notes || 'No notes provided'}`
                ).join('\n\n'))
                .setColor('#FF0000')
                .setFooter({ text: `${scammers.length} flagged scammers` })
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing scammers:', error);
            await interaction.reply('❌ Error retrieving scammers list.');
        }
    },

    // ==================== TRANSACTION MANAGEMENT ====================

    async updateTransaction(interaction, database) {
        try {
            const transactionId = interaction.options.getInteger('transaction_id');
            const newStatus = interaction.options.getString('status');

            const transaction = await database.getTransactionById(transactionId);
            if (!transaction) {
                return await interaction.reply('❌ Transaction not found!');
            }

            await database.updateTransactionStatus(transactionId, newStatus);

            const embed = new EmbedBuilder()
                .setTitle('✅ Transaction Updated')
                .addFields(
                    { name: 'Transaction ID', value: transactionId.toString(), inline: true },
                    { name: 'Item', value: transaction.item_name, inline: true },
                    { name: 'User', value: transaction.username, inline: true },
                    { name: 'Old Status', value: transaction.status, inline: true },
                    { name: 'New Status', value: newStatus, inline: true },
                    { name: 'Amount', value: `$${parseFloat(transaction.total_amount).toFixed(2)}`, inline: true }
                )
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error updating transaction:', error);
            await interaction.reply('❌ Error updating transaction.');
        }
    },

    async showAllTransactions(interaction, database) {
        try {
            const transactions = await database.getAllTransactions(20);
            
            if (transactions.length === 0) {
                return await interaction.reply('📋 No transactions found.');
            }

            const embed = new EmbedBuilder()
                .setTitle('💰 All Recent Transactions')
                .setDescription(transactions.map(t => 
                    `**ID:** ${t.transaction_id} | **User:** ${t.username} | **Item:** ${t.item_name}\n` +
                    `**Amount:** $${parseFloat(t.total_amount).toFixed(2)} | **Status:** ${t.status} | **Date:** ${new Date(t.timestamp).toLocaleDateString()}`
                ).join('\n\n'))
                .setColor('#0099FF')
                .setFooter({ text: `Showing last ${transactions.length} transactions` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing all transactions:', error);
            await interaction.reply('❌ Error retrieving transactions.');
        }
    },

    async showPendingTransactions(interaction, database) {
        try {
            const allTransactions = await database.getAllTransactions(100);
            const pendingTransactions = allTransactions.filter(t => t.status === 'pending');
            
            if (pendingTransactions.length === 0) {
                return await interaction.reply('✅ No pending transactions!');
            }

            const embed = new EmbedBuilder()
                .setTitle('⏳ Pending Transactions')
                .setDescription(pendingTransactions.map(t => 
                    `**ID:** ${t.transaction_id} | **User:** ${t.username}\n` +
                    `**Item:** ${t.item_name} | **Amount:** $${parseFloat(t.total_amount).toFixed(2)}\n` +
                    `**Date:** ${new Date(t.timestamp).toLocaleDateString()}`
                ).join('\n\n'))
                .setColor('#FFA500')
                .setFooter({ text: `${pendingTransactions.length} pending transactions` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing pending transactions:', error);
            await interaction.reply('❌ Error retrieving pending transactions.');
        }
    },

    // ==================== BOT CONFIGURATION ====================

    async setWelcomeMessage(interaction, database) {
        const message = interaction.options.getString('message');
        
        try {
            await database.setWelcomeMessage(message);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Welcome Message Updated')
                .setDescription('New welcome message:')
                .addFields({ name: 'Message', value: message })
                .setColor('#00FF00')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting welcome message:', error);
            await interaction.reply('❌ Error updating welcome message.');
        }
    },

    async setPersistentMessage(interaction, database) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        
        try {
            await database.setPersistentChannel(channel.id, message);
            await interaction.reply(`✅ Persistent message set for <#${channel.id}>!`);
        } catch (error) {
            console.error('Error setting persistent message:', error);
            await interaction.reply('❌ Error setting persistent message.');
        }
    },

    async removePersistentChannel(interaction, database) {
        const channel = interaction.options.getChannel('channel');
        
        try {
            await database.removePersistentChannel(channel.id);
            await interaction.reply(`✅ Persistent message removed from <#${channel.id}>!`);
        } catch (error) {
            console.error('Error removing persistent channel:', error);
            await interaction.reply('❌ Error removing persistent message.');
        }
    },

    // ==================== CONTENT MONITORING WITH URL SUPPORT ====================

    async addCreator(interaction, database) {
        const platform = interaction.options.getString('platform');
        const urlOrId = interaction.options.getString('url_or_id');
        const customName = interaction.options.getString('creator_name');
        const channel = interaction.options.getChannel('channel');
        
        try {
            await interaction.deferReply();
            
            let creatorId;
            let creatorName;
            
            if (platform === 'youtube') {
                const youtubeData = await this.extractYouTubeInfo(urlOrId);
                if (!youtubeData) {
                    return await interaction.editReply('❌ Invalid YouTube URL or channel ID. Please check and try again.');
                }
                creatorId = youtubeData.channelId;
                creatorName = customName || youtubeData.channelName || 'Unknown Creator';
                
            } else if (platform === 'twitch') {
                const twitchData = await this.extractTwitchInfo(urlOrId);
                if (!twitchData) {
                    return await interaction.editReply('❌ Invalid Twitch URL or username. Please check and try again.');
                }
                creatorId = twitchData.username;
                creatorName = customName || twitchData.displayName || twitchData.username;
            }
            
            // Check if creator already exists
            const existingCreators = await database.getCreators(platform);
            const existingCreator = existingCreators.find(c => c.creator_id === creatorId);
            
            if (existingCreator) {
                return await interaction.editReply(`❌ ${platform === 'youtube' ? 'YouTube channel' : 'Twitch streamer'} **${existingCreator.creator_name}** is already being monitored in <#${existingCreator.channel_id}>.`);
            }
            
            await database.addCreator(platform, creatorId, creatorName, channel.id);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Creator Added Successfully')
                .addFields(
                    { name: 'Platform', value: platform === 'youtube' ? 'YouTube' : 'Twitch', inline: true },
                    { name: 'Creator', value: creatorName, inline: true },
                    { name: 'Notification Channel', value: `<#${channel.id}>`, inline: true },
                    { name: 'Creator ID', value: creatorId, inline: true }
                )
                .setColor('#00FF00')
                .setTimestamp();
                
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error adding creator:', error);
            await interaction.editReply('❌ Error adding creator. Please try again.');
        }
    },

    async removeCreator(interaction, database) {
        const platform = interaction.options.getString('platform');
        const creatorId = interaction.options.getString('creator_id');
        
        try {
            await database.removeCreator(platform, creatorId);
            await interaction.reply(`✅ Removed ${platform} creator: **${creatorId}**`);
        } catch (error) {
            console.error('Error removing creator:', error);
            await interaction.reply('❌ Error removing creator.');
        }
    },

    async listCreators(interaction, database) {
        try {
            const youtubeCreators = await database.getCreators('youtube');
            const twitchCreators = await database.getCreators('twitch');

            const embed = new EmbedBuilder()
                .setTitle('🎥 Monitored Creators')
                .setColor('#0099FF');

            if (youtubeCreators.length > 0) {
                embed.addFields({
                    name: '📺 YouTube Creators',
                    value: youtubeCreators.map(c => 
                        `**${c.creator_name}** (${c.creator_id}) → <#${c.channel_id}>`
                    ).join('\n'),
                    inline: false
                });
            }

            if (twitchCreators.length > 0) {
                embed.addFields({
                    name: '🟣 Twitch Streamers',
                    value: twitchCreators.map(c => 
                        `**${c.creator_name}** (${c.creator_id}) → <#${c.channel_id}> ${c.is_live ? '🔴 LIVE' : '⚫ Offline'}`
                    ).join('\n'),
                    inline: false
                });
            }

            if (youtubeCreators.length === 0 && twitchCreators.length === 0) {
                embed.setDescription('No creators are currently being monitored.');
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error listing creators:', error);
            await interaction.reply('❌ Error retrieving creators list.');
        }
    },

    // ==================== URL EXTRACTION HELPERS ====================

    async extractTwitchInfo(input) {
        try {
            let username = null;
            let displayName = null;
            
            // If it's a Twitch URL
            if (input.includes('twitch.tv')) {
                const match = input.match(/twitch\.tv\/([^\/\?]+)/);
                if (match) {
                    username = match[1].toLowerCase();
                }
            } else {
                // Assume it's just a username
                username = input.toLowerCase().replace('@', '');
            }
            
            // Validate username format (Twitch usernames are 4-25 characters, alphanumeric + underscore)
            if (username && /^[a-zA-Z0-9_]{4,25}$/.test(username)) {
                // Try to get display name from Twitch API if available
                if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
                    displayName = await this.getTwitchDisplayName(username);
                }
                
                return { username, displayName };
            }
            
            return null;
            
        } catch (error) {
            console.error('Error extracting Twitch info:', error);
            return null;
        }
    },

    // YouTube API helper methods
    async getYouTubeChannelName(channelId) {
        try {
            if (!process.env.YOUTUBE_API_KEY) return null;
            
            const axios = require('axios');
            const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    key: process.env.YOUTUBE_API_KEY,
                    id: channelId,
                    part: 'snippet'
                }
            });
            
            if (response.data.items && response.data.items.length > 0) {
                return response.data.items[0].snippet.title;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting YouTube channel name:', error);
            return null;
        }
    },

    async resolveYouTubeUsername(username) {
        try {
            if (!process.env.YOUTUBE_API_KEY) return null;
            
            const axios = require('axios');
            const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    key: process.env.YOUTUBE_API_KEY,
                    forUsername: username,
                    part: 'id'
                }
            });
            
            if (response.data.items && response.data.items.length > 0) {
                return response.data.items[0].id;
            }
            
            return null;
        } catch (error) {
            console.error('Error resolving YouTube username:', error);
            return null;
        }
    },

    async getChannelFromVideo(videoId) {
        try {
            if (!process.env.YOUTUBE_API_KEY) return null;
            
            const axios = require('axios');
            const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: process.env.YOUTUBE_API_KEY,
                    id: videoId,
                    part: 'snippet'
                }
            });
            
            if (response.data.items && response.data.items.length > 0) {
                return response.data.items[0].snippet.channelId;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting channel from video:', error);
            return null;
        }
    },

    // Twitch API helper method
    async getTwitchDisplayName(username) {
        try {
            // This would require your existing Twitch monitor's getAccessToken method
            // For now, just return the username capitalized
            return username.charAt(0).toUpperCase() + username.slice(1);
        } catch (error) {
            console.error('Error getting Twitch display name:', error);
            return username;
        }
    },

    // ==================== DATABASE & BACKUP ====================

    async manualBackup(interaction, database) {
        try {
            await interaction.deferReply();
            
            const backupData = await database.getBackupData();
            backupData.timestamp = new Date().toISOString();
            backupData.triggered_by = interaction.user.username;
            backupData.type = 'manual';

            const backupJson = JSON.stringify(backupData, null, 2);
            
            const backupChannelId = process.env.BACKUP_CHANNEL_ID;
            if (backupChannelId) {
                const backupChannel = interaction.guild.channels.cache.get(backupChannelId);
                if (backupChannel) {
                    const filename = `manual_backup_${Date.now()}.json`;
                    const filepath = path.join('/tmp', filename);
                    
                    fs.writeFileSync(filepath, backupJson);
                    
                    await backupChannel.send({
                        content: `📁 Manual Backup triggered by ${interaction.user.username}`,
                        files: [{ attachment: filepath, name: filename }]
                    });

                    fs.unlinkSync(filepath);
                    await interaction.editReply('✅ Manual backup completed and sent to backup channel!');
                } else {
                    await interaction.editReply('✅ Manual backup completed! (Backup channel not found)');
                }
            } else {
                await interaction.editReply('✅ Manual backup completed! (No backup channel configured)');
            }

        } catch (error) {
            console.error('Error creating manual backup:', error);
            await interaction.editReply('❌ Error creating backup.');
        }
    },

    async showDatabaseStats(interaction, database) {
        try {
            const stats = await database.getDatabaseStats();
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Detailed Database Statistics')
                .addFields(
                    { name: '👥 Users', value: `${stats.users_count || 0} total\n${stats.scammer_count || 0} flagged scammers`, inline: true },
                    { name: '💰 Transactions', value: `${stats.transactions_count || 0} total\n${stats.pending_transactions || 0} pending`, inline: true },
                    { name: '📝 Messages', value: `${stats.messages_count || 0} logged`, inline: true },
                    { name: '🎥 Creators', value: `${stats.creators_count || 0} monitored`, inline: true },
                    { name: '📌 Persistent Channels', value: `${stats.persistent_channels_count || 0} active`, inline: true },
                    { name: '💵 Total Revenue', value: `${(stats.total_revenue || 0).toFixed(2)}`, inline: true }
                )
                .setColor('#00FF99')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing database stats:', error);
            await interaction.reply('❌ Error retrieving database statistics.');
        }
    },

    async testDatabase(interaction, database) {
        try {
            const startTime = Date.now();
            const isConnected = await database.testConnection();
            const responseTime = Date.now() - startTime;

            const embed = new EmbedBuilder()
                .setTitle('🔧 Database Connection Test')
                .addFields(
                    { name: 'Status', value: isConnected ? '✅ Connected' : '❌ Failed', inline: true },
                    { name: 'Response Time', value: `${responseTime}ms`, inline: true },
                    { name: 'Database URL', value: process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing', inline: true }
                )
                .setColor(isConnected ? '#00FF00' : '#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error testing database:', error);
            await interaction.reply('❌ Database test failed.');
        }
    },

    async cleanupOldData(interaction, database) {
        try {
            await interaction.deferReply();
            
            const messagesResult = await database.pool.query(
                "DELETE FROM messages WHERE timestamp < NOW() - INTERVAL '30 days'"
            );
            
            const deletedMessages = messagesResult.rowCount;

            await interaction.editReply(`✅ Cleanup completed! Removed ${deletedMessages} old messages (30+ days old).`);
            console.log(`Data cleanup: removed ${deletedMessages} old messages`);

        } catch (error) {
            console.error('Error during cleanup:', error);
            await interaction.editReply('❌ Error during cleanup.');
        }
    }
};YouTubeInfo(input) {
        try {
            let channelId = null;
            let channelName = null;
            
            // If it's already a channel ID (starts with UC)
            if (input.startsWith('UC') && input.length === 24) {
                channelId = input;
            }
            // If it's a YouTube URL
            else if (input.includes('youtube.com') || input.includes('youtu.be')) {
                // Extract channel ID from various YouTube URL formats
                const channelMatch = input.match(/(?:youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/user\/|youtube\.com\/@)([^\/\?]+)/);
                const videoMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\/\?\&]+)/);
                
                if (channelMatch) {
                    const extracted = channelMatch[1];
                    // If it's already a channel ID
                    if (extracted.startsWith('UC')) {
                        channelId = extracted;
                    } else {
                        // It's a custom username - we'll need to resolve it via API
                        channelId = await this.resolveYouTubeUsername(extracted);
                    }
                } else if (videoMatch) {
                    // Extract channel from video URL via API
                    channelId = await this.getChannelFromVideo(videoMatch[1]);
                }
            }
            
            // Try to get channel name if we have the ID
            if (channelId && process.env.YOUTUBE_API_KEY) {
                channelName = await this.getYouTubeChannelName(channelId);
            }
            
            return channelId ? { channelId, channelName } : null;
            
        } catch (error) {
            console.error('Error extracting YouTube info:', error);
            return null;
        }
    },

    async extract
