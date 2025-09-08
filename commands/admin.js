// commands/admin.js - Complete Admin Commands File
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'admin',
    description: 'Admin commands for bot management',
    
    async execute(message, args, database) {
        // Check if user has admin permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need administrator permissions to use this command!');
        }

        const subCommand = args[0];
        
        switch (subCommand) {
            // User Management
            case 'syncmembers':
                await this.syncAllMembers(message, database);
                break;
                
            case 'checkuser':
                await this.checkUser(message, args, database);
                break;
                
            case 'stats':
                await this.showStats(message, database);
                break;

            // Scammer Management
            case 'flagscammer':
                await this.flagScammer(message, args, database);
                break;
                
            case 'unflagscammer':
                await this.unflagScammer(message, args, database);
                break;
                
            case 'scammerlist':
                await this.listScammers(message, database);
                break;

            // Transaction Management
            case 'updatetransaction':
                await this.updateTransaction(message, args, database);
                break;

            case 'alltransactions':
                await this.showAllTransactions(message, database);
                break;

            case 'pendingtransactions':
                await this.showPendingTransactions(message, database);
                break;

            // Bot Configuration
            case 'setwelcome':
                await this.setWelcomeMessage(message, args.slice(1).join(' '), database);
                break;
                
            case 'setpersistent':
                await this.setPersistentMessage(message, args, database);
                break;

            case 'removepersistent':
                await this.removePersistentChannel(message, args, database);
                break;

            // Content Monitoring
            case 'addcreator':
                await this.addCreator(message, args, database);
                break;
                
            case 'removecreator':
                await this.removeCreator(message, args, database);
                break;

            case 'listcreators':
                await this.listCreators(message, database);
                break;

            // Database & Backup
            case 'backup':
                await this.manualBackup(message, database);
                break;

            case 'dbstats':
                await this.showDatabaseStats(message, database);
                break;

            case 'testdb':
                await this.testDatabase(message, database);
                break;

            case 'cleanup':
                await this.cleanupOldData(message, database);
                break;
                
            default:
                await this.showHelp(message);
        }
    },

    // ==================== USER MANAGEMENT ====================

    async syncAllMembers(message, database) {
        try {
            const guild = message.guild;
            const statusMessage = await message.reply('🔄 Starting member sync... This may take a moment.');

            // Fetch all members (this gets members from cache and API)
            const members = await guild.members.fetch();
            
            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            const totalMembers = members.size;
            console.log(`Starting sync of ${totalMembers} members...`);

            // Process members in batches to avoid overwhelming the database
            const memberArray = Array.from(members.values());
            const batchSize = 50;

            for (let i = 0; i < memberArray.length; i += batchSize) {
                const batch = memberArray.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (member) => {
                    try {
                        // Skip bots
                        if (member.user.bot) {
                            skippedCount++;
                            return;
                        }

                        // Check if user already exists
                        const existingUser = await database.getUserInfo(member.user.id);
                        
                        if (existingUser) {
                            // Update existing user info (username might have changed)
                            await database.updateUserInfo(member.user.id, member.user.username, member.user.discriminator);
                            updatedCount++;
                            console.log(`Updated user: ${member.user.username}`);
                        } else {
                            // Add new user
                            await database.addUser(member.user.id, member.user.username, member.user.discriminator);
                            addedCount++;
                            console.log(`Added new user: ${member.user.username}`);
                        }

                    } catch (error) {
                        console.error(`Error processing member ${member.user.username}:`, error);
                        errorCount++;
                    }
                }));

                // Update progress
                const processed = Math.min(i + batchSize, memberArray.length);
                const progressPercent = Math.round((processed / totalMembers) * 100);
                
                if (i % 100 === 0 || processed === totalMembers) { // Update every 100 members or at the end
                    try {
                        await statusMessage.edit(`🔄 Syncing members... ${processed}/${totalMembers} (${progressPercent}%)`);
                    } catch (editError) {
                        console.log('Could not edit status message:', editError.message);
                    }
                }
            }

            // Final results
            const embed = new EmbedBuilder()
                .setTitle('✅ Member Sync Complete!')
                .setDescription('All Discord members have been synchronized with the database.')
                .addFields(
                    { name: '📊 Summary', value: '\u200B', inline: false },
                    { name: 'Total Members Processed', value: totalMembers.toString(), inline: true },
                    { name: 'New Users Added', value: addedCount.toString(), inline: true },
                    { name: 'Existing Users Updated', value: updatedCount.toString(), inline: true },
                    { name: 'Bots Skipped', value: skippedCount.toString(), inline: true },
                    { name: 'Errors', value: errorCount.toString(), inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                )
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: 'All members are now in the database!' });

            await statusMessage.edit({ content: '', embeds: [embed] });
            console.log(`Member sync completed: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);

        } catch (error) {
            console.error('Error in syncAllMembers:', error);
            await message.reply('❌ An error occurred during member sync. Check the logs for details.');
        }
    },

    async checkUser(message, args, database) {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        
        if (!userId) {
            return message.reply('Please mention a user to check!\nExample: `!admin checkuser @username`');
        }
        
        try {
            const userInfo = await database.getUserInfo(userId);
            const transactions = await database.getUserTransactions(userId);
            const activity = await database.getUserActivity(userId);
            
            if (!userInfo) {
                return message.reply('❌ User not found in database! Try syncing members first with `!admin syncmembers`');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('👤 User Information')
                .setDescription(`<@${userId}>`)
                .addFields(
                    { name: 'Username', value: userInfo.username, inline: true },
                    { name: 'Join Date', value: userInfo.join_date?.toLocaleDateString() || 'Unknown', inline: true },
                    { name: 'Last Activity', value: userInfo.last_activity?.toLocaleDateString() || 'Unknown', inline: true },
                    { name: 'Total Purchases', value: userInfo.total_purchases.toString(), inline: true },
                    { name: 'Total Spent', value: `$${parseFloat(userInfo.total_spent).toFixed(2)}`, inline: true },
                    { name: 'Is Scammer', value: userInfo.is_scammer ? '⚠️ YES' : '✅ No', inline: true },
                    { name: 'Recent Activity (7 days)', value: `${activity?.message_count || 0} messages\n${activity?.command_count || 0} commands`, inline: true },
                    { name: 'Recent Transactions', value: transactions.slice(0, 5).map(t => `${t.item_name} - $${parseFloat(t.total_amount).toFixed(2)} (${t.status})`).join('\n') || 'None', inline: false }
                )
                .setColor(userInfo.is_scammer ? '#FF0000' : '#00FF00')
                .setTimestamp();
                
            if (userInfo.scammer_notes) {
                embed.addFields({ name: 'Scammer Notes', value: userInfo.scammer_notes, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error checking user:', error);
            await message.reply('❌ Error retrieving user information.');
        }
    },

    async showStats(message, database) {
        try {
            const totalUsers = await database.getTotalUserCount();
            const activeUsers = await database.getUserCount(); // Non-scammers
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

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing stats:', error);
            await message.reply('❌ Error retrieving statistics.');
        }
    },

    // ==================== SCAMMER MANAGEMENT ====================

    async flagScammer(message, args, database) {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        const reason = args.slice(2).join(' ');
        
        if (!userId) {
            return message.reply('Please mention a user to flag!\nExample: `!admin flagscammer @user They tried to scam people`');
        }
        
        try {
            await database.flagUserAsScammer(userId, reason);
            const embed = new EmbedBuilder()
                .setTitle('🚨 User Flagged as Scammer')
                .addFields(
                    { name: 'User', value: `<@${userId}>`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided', inline: false },
                    { name: 'Flagged by', value: message.author.username, inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            console.log(`User ${userId} flagged as scammer by ${message.author.username}: ${reason}`);
        } catch (error) {
            console.error('Error flagging scammer:', error);
            await message.reply('❌ Error flagging user as scammer.');
        }
    },

    async unflagScammer(message, args, database) {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        
        if (!userId) {
            return message.reply('Please mention a user to unflag!\nExample: `!admin unflagscammer @user`');
        }
        
        try {
            await database.unflagUserAsScammer(userId);
            await message.reply(`✅ User <@${userId}> has been unflagged successfully!`);
            console.log(`User ${userId} unflagged by ${message.author.username}`);
        } catch (error) {
            console.error('Error unflagging scammer:', error);
            await message.reply('❌ Error unflagging user.');
        }
    },

    async listScammers(message, database) {
        try {
            const scammers = await database.getAllScammers();
            
            if (scammers.length === 0) {
                return message.reply('✅ No flagged scammers found!');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🚨 Flagged Scammers')
                .setDescription(scammers.map(s => 
                    `<@${s.discord_id}> **(${s.username})**\n📝 ${s.scammer_notes || 'No notes provided'}`
                ).join('\n\n'))
                .setColor('#FF0000')
                .setFooter({ text: `${scammers.length} flagged scammers` })
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing scammers:', error);
            await message.reply('❌ Error retrieving scammers list.');
        }
    },

    // ==================== TRANSACTION MANAGEMENT ====================

    async updateTransaction(message, args, database) {
        try {
            const transactionId = parseInt(args[1]);
            const newStatus = args[2]?.toLowerCase();
            
            if (!transactionId || !newStatus) {
                return message.reply('Usage: `!admin updatetransaction <transaction_id> <status>`\nStatus options: pending, completed, failed, disputed, cancelled\nExample: `!admin updatetransaction 1 completed`');
            }

            const validStatuses = ['pending', 'completed', 'failed', 'disputed', 'cancelled'];
            if (!validStatuses.includes(newStatus)) {
                return message.reply(`❌ Invalid status. Valid options: ${validStatuses.join(', ')}`);
            }

            // Check if transaction exists
            const transaction = await database.getTransactionById(transactionId);
            if (!transaction) {
                return message.reply('❌ Transaction not found!');
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

            await message.reply({ embeds: [embed] });
            console.log(`Transaction ${transactionId} updated to ${newStatus} by ${message.author.username}`);

        } catch (error) {
            console.error('Error updating transaction:', error);
            await message.reply('❌ Error updating transaction. Check the logs for details.');
        }
    },

    async showAllTransactions(message, database) {
        try {
            const transactions = await database.getAllTransactions(20);
            
            if (transactions.length === 0) {
                return message.reply('📋 No transactions found.');
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

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing all transactions:', error);
            await message.reply('❌ Error retrieving transactions.');
        }
    },

    async showPendingTransactions(message, database) {
        try {
            const allTransactions = await database.getAllTransactions(100);
            const pendingTransactions = allTransactions.filter(t => t.status === 'pending');
            
            if (pendingTransactions.length === 0) {
                return message.reply('✅ No pending transactions!');
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

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing pending transactions:', error);
            await message.reply('❌ Error retrieving pending transactions.');
        }
    },

    // ==================== BOT CONFIGURATION ====================

    async setWelcomeMessage(message, newMessage, database) {
        if (!newMessage) {
            return message.reply('Please provide a welcome message!\nExample: `!admin setwelcome Welcome to our server! Please read the rules.`');
        }
        
        try {
            await database.setWelcomeMessage(newMessage);
            const embed = new EmbedBuilder()
                .setTitle('✅ Welcome Message Updated')
                .setDescription('New welcome message:')
                .addFields({ name: 'Message', value: newMessage })
                .setColor('#00FF00')
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting welcome message:', error);
            await message.reply('❌ Error updating welcome message.');
        }
    },

    async setPersistentMessage(message, args, database) {
        const channelId = args[1]?.replace(/[<#>]/g, '');
        const persistentMessage = args.slice(2).join(' ');
        
        if (!channelId || !persistentMessage) {
            return message.reply('Usage: `!admin setpersistent #channel Your message here`\nExample: `!admin setpersistent #general Server rules: No spam, be respectful!`');
        }
        
        try {
            await database.setPersistentChannel(channelId, persistentMessage);
            await message.reply(`✅ Persistent message set for <#${channelId}>!`);
        } catch (error) {
            console.error('Error setting persistent message:', error);
            await message.reply('❌ Error setting persistent message.');
        }
    },

    async removePersistentChannel(message, args, database) {
        try {
            const channelId = args[1]?.replace(/[<#>]/g, '');
            
            if (!channelId) {
                return message.reply('Usage: `!admin removepersistent #channel`');
            }

            await database.removePersistentChannel(channelId);
            await message.reply(`✅ Persistent message removed from <#${channelId}>!`);

        } catch (error) {
            console.error('Error removing persistent channel:', error);
            await message.reply('❌ Error removing persistent message.');
        }
    },

    // ==================== CONTENT MONITORING ====================

    async addCreator(message, args, database) {
        // Usage: !admin addcreator youtube channelId channelName #discord-channel
        const platform = args[1]?.toLowerCase();
        const creatorId = args[2];
        const creatorName = args[3];
        const discordChannelId = args[4]?.replace(/[<#>]/g, '');
        
        if (!platform || !creatorId || !creatorName || !discordChannelId) {
            return message.reply('Usage: `!admin addcreator <platform> <creator_id> <creator_name> #channel`\nPlatforms: youtube, twitch\nExample: `!admin addcreator youtube UCChannelID CreatorName #updates`');
        }

        if (!['youtube', 'twitch'].includes(platform)) {
            return message.reply('❌ Invalid platform. Use: youtube or twitch');
        }
        
        try {
            await database.addCreator(platform, creatorId, creatorName, discordChannelId);
            await message.reply(`✅ Added ${platform} creator: **${creatorName}** → <#${discordChannelId}>`);
        } catch (error) {
            console.error('Error adding creator:', error);
            await message.reply('❌ Error adding creator.');
        }
    },

    async removeCreator(message, args, database) {
        const platform = args[1]?.toLowerCase();
        const creatorId = args[2];
        
        if (!platform || !creatorId) {
            return message.reply('Usage: `!admin removecreator <platform> <creator_id>`\nExample: `!admin removecreator youtube UCChannelID`');
        }
        
        try {
            await database.removeCreator(platform, creatorId);
            await message.reply(`✅ Removed ${platform} creator: **${creatorId}**`);
        } catch (error) {
            console.error('Error removing creator:', error);
            await message.reply('❌ Error removing creator.');
        }
    },

    async listCreators(message, database) {
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
                embed.setDescription('No creators are currently being monitored.\nUse `!admin addcreator` to add some!');
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error listing creators:', error);
            await message.reply('❌ Error retrieving creators list.');
        }
    },

    // ==================== DATABASE & BACKUP ====================

    async manualBackup(message, database) {
        try {
            const statusMessage = await message.reply('🔄 Starting manual backup...');
            
            // Get backup data
            const backupData = await database.getBackupData();
            backupData.timestamp = new Date().toISOString();
            backupData.triggered_by = message.author.username;
            backupData.type = 'manual';

            const backupJson = JSON.stringify(backupData, null, 2);
            
            // If backup channel is configured, send it there
            const backupChannelId = process.env.BACKUP_CHANNEL_ID;
            if (backupChannelId) {
                const backupChannel = message.guild.channels.cache.get(backupChannelId);
                if (backupChannel) {
                    // Create a text file with backup data
                    const filename = `manual_backup_${Date.now()}.json`;
                    const filepath = path.join('/tmp', filename);
                    
                    fs.writeFileSync(filepath, backupJson);
                    
                    await backupChannel.send({
                        content: `📁 Manual Backup triggered by ${message.author.username}`,
                        files: [{ attachment: filepath, name: filename }]
                    });

                    fs.unlinkSync(filepath); // Clean up temp file
                    await statusMessage.edit('✅ Manual backup completed and sent to backup channel!');
                } else {
                    await statusMessage.edit('✅ Manual backup completed! (Backup channel not found)');
                }
            } else {
                await statusMessage.edit('✅ Manual backup completed! (No backup channel configured)');
            }

        } catch (error) {
            console.error('Error creating manual backup:', error);
            await message.reply('❌ Error creating backup. Check the logs for details.');
        }
    },

    async showDatabaseStats(message, database) {
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
                    { name: '💵 Total Revenue', value: `$${(stats.total_revenue || 0).toFixed(2)}`, inline: true }
                )
                .setColor('#00FF99')
                .setTimestamp()
                .setFooter({ text: 'Database statistics updated in real-time' });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing database stats:', error);
            await message.reply('❌ Error retrieving database statistics.');
        }
    },

    async testDatabase(message, database) {
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

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error testing database:', error);
            await message.reply('❌ Database test failed. Check the logs for details.');
        }
    },

    async cleanupOldData(message, database) {
        try {
            const statusMessage = await message.reply('🧹 Starting data cleanup...');
            
            // Clean messages older than 30 days
            const messagesResult = await database.pool.query(
                "DELETE FROM messages WHERE timestamp < NOW() - INTERVAL '30 days'"
            );
            
            const deletedMessages = messagesResult.rowCount;

            await statusMessage.edit(`✅ Cleanup completed! Removed ${deletedMessages} old messages (30+ days old).`);
            console.log(`Data cleanup: removed ${deletedMessages} old messages`);

        } catch (error) {
            console.error('Error during cleanup:', error);
            await message.reply('❌ Error during cleanup. Check the logs for details.');
        }
    },

    // ==================== HELP COMMAND ====================

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('🔧 Complete Admin Commands Guide')
            .setDescription('All available admin commands with exact syntax:')
            .addFields(
                // User Management Section
                { 
                    name: '👥 **USER MANAGEMENT**', 
                    value: '```' +
                    '!admin syncmembers\n' +
                    '!admin checkuser @username\n' +
                    '!admin stats\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 User Management Explanations', 
                    value: 
                    '**`!admin syncmembers`** - Add all Discord server members to database\n' +
                    '**`!admin checkuser @username`** - View detailed user info, transactions, and activity\n' +
                    '**`!admin stats`** - Show server statistics and database overview\n',
                    inline: false 
                },

                // Scammer Management Section
                { 
                    name: '🚨 **SCAMMER MANAGEMENT**', 
                    value: '```' +
                    '!admin flagscammer @username reason here\n' +
                    '!admin unflagscammer @username\n' +
                    '!admin scammerlist\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 Scammer Management Explanations', 
                    value: 
                    '**`!admin flagscammer @user reason`** - Flag user as scammer with optional reason\n' +
                    '**`!admin unflagscammer @user`** - Remove scammer flag from user\n' +
                    '**`!admin scammerlist`** - Display all flagged scammers with notes\n',
                    inline: false 
                },

                // Transaction Management Section
                { 
                    name: '💰 **TRANSACTION MANAGEMENT**', 
                    value: '```' +
                    '!admin updatetransaction 1 completed\n' +
                    '!admin updatetransaction 2 failed\n' +
                    '!admin alltransactions\n' +
                    '!admin pendingtransactions\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 Transaction Management Explanations', 
                    value: 
                    '**`!admin updatetransaction <ID> <status>`** - Update transaction status\n' +
                    '   • Status options: pending, completed, failed, disputed, cancelled\n' +
                    '**`!admin alltransactions`** - View all recent transactions\n' +
                    '**`!admin pendingtransactions`** - View only pending transactions\n',
                    inline: false 
                },

                // Bot Configuration Section
                { 
                    name: '⚙️ **BOT CONFIGURATION**', 
                    value: '```' +
                    '!admin setwelcome Your welcome message here\n' +
                    '!admin setpersistent #channel Your message\n' +
                    '!admin removepersistent #channel\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 Bot Configuration Explanations', 
                    value: 
                    '**`!admin setwelcome <message>`** - Set welcome DM for new members\n' +
                    '**`!admin setpersistent #channel <msg>`** - Message always stays last in channel\n' +
                    '**`!admin removepersistent #channel`** - Remove persistent message\n',
                    inline: false 
                },

                // Message Commands Section (NEW)
                { 
                    name: '📝 **MESSAGE COMMANDS**', 
                    value: '```' +
                    '!message send Hello everyone :custom_emoji:\n' +
                    '!message channel #general Welcome :wave:\n' +
                    '!message sendembed Title | Description | #FF0000\n' +
                    '!message announce everyone Server update :bell:\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 Message Commands Explanations', 
                    value: 
                    '**`!message send <text>`** - Send message with custom emoji support\n' +
                    '**`!message channel #channel <text>`** - Send message to specific channel\n' +
                    '**`!message sendembed <title|desc|color>`** - Send embedded message\n' +
                    '**`!message announce <everyone|here> <text>`** - Send announcement with ping\n' +
                    '**`!message dm @user <text>`** - Send DM to user\n' +
                    '**`!message edit <message_id> <new_text>`** - Edit existing bot message\n',
                    inline: false 
                },

                // Content Monitoring Section
                { 
                    name: '🎥 **CONTENT MONITORING**', 
                    value: '```' +
                    '!admin addcreator youtube UCChannelID Name #updates\n' +
                    '!admin addcreator twitch streamername Name #live\n' +
                    '!admin removecreator youtube UCChannelID\n' +
                    '!admin listcreators\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 Content Monitoring Explanations', 
                    value: 
                    '**`!admin addcreator <platform> <id> <n> #channel`**\n' +
                    '   • Auto-post when creator uploads/goes live\n' +
                    '   • Platform: youtube or twitch\n' +
                    '**`!admin removecreator <platform> <id>`** - Stop monitoring creator\n' +
                    '**`!admin listcreators`** - Show all monitored creators\n',
                    inline: false 
                },

                // Database & Backup Section
                { 
                    name: '💾 **DATABASE & BACKUP**', 
                    value: '```' +
                    '!admin backup\n' +
                    '!admin dbstats\n' +
                    '!admin testdb\n' +
                    '!admin cleanup\n' +
                    '```', 
                    inline: false 
                },
                { 
                    name: '📝 Database & Backup Explanations', 
                    value: 
                    '**`!admin backup`** - Manually trigger database backup\n' +
                    '**`!admin dbstats`** - Show detailed database statistics\n' +
                    '**`!admin testdb`** - Test database connection\n' +
                    '**`!admin cleanup`** - Clean old messages/data (30+ days)\n',
                    inline: false 
                },

                // Quick Examples Section
                { 
                    name: '💡 **QUICK EXAMPLES**', 
                    value: 
                    '```\n' +
                    '# Flag a scammer\n' +
                    '!admin flagscammer @BadUser Tried to sell fake items\n\n' +
                    '# Complete a transaction\n' +
                    '!admin updatetransaction 15 completed\n\n' +
                    '# Send custom message with emoji\n' +
                    '!message send Welcome to the shop! :shop_icon: :diamond:\n\n' +
                    '# Send announcement\n' +
                    '!message announce everyone Maintenance tonight :tools:\n\n' +
                    '# Set persistent message with emojis\n' +
                    '!admin setpersistent #rules Follow the rules :warning: No scamming :x:\n' +
                    '```',
                    inline: false 
                },

                // Emoji Usage Section (NEW)
                { 
                    name: '😀 **CUSTOM EMOJI USAGE**', 
                    value: 
                    '**Custom Server Emojis:** Use `:emoji_name:` format\n' +
                    '   • `:shop_icon:`, `:verified:`, `:diamond:`, `:warning_sign:`\n\n' +
                    '**Unicode Emojis:** Work normally in all commands\n' +
                    '   • 🛒 💎 ⚠️ ✅ ❌ 🔔 🎉 ❤️ 🔥 ⭐\n\n' +
                    '**Works in:** Messages, embeds, persistent messages, welcome DMs\n',
                    inline: false 
                }
            )
            .setColor('#0099FF')
            .setFooter({ 
                text: 'Use "!message help" for detailed message command examples' 
        })
        .setTimestamp();
        
    await message.reply({ embeds: [embed] });
}
