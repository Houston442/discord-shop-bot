// commands/admin.js - Clean Complete File
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for bot management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Create a new transaction for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User making the purchase')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Name of the item being purchased')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Total price of the transaction')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View transaction history')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View transactions for specific user (optional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check specific transaction status')
                .addIntegerOption(option =>
                    option.setName('transaction_id')
                        .setDescription('Transaction ID to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show top sellers leaderboard'))
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
            case 'buy':
                await this.createTransaction(interaction, database);
                break;
            case 'history':
                await this.showHistory(interaction, database);
                break;
            case 'status':
                await this.checkTransactionStatus(interaction, database);
                break;
            case 'leaderboard':
                await this.showLeaderboard(interaction, database);
                break;
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
            case 'setwelcome':
                await this.setWelcomeMessage(interaction, database);
                break;
            case 'setpersistent':
                await this.setPersistentMessage(interaction, database);
                break;
            case 'removepersistent':
                await this.removePersistentChannel(interaction, database);
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

    async createTransaction(interaction, database) {
        try {
            const user = interaction.options.getUser('user');
            const itemName = interaction.options.getString('item');
            const totalPrice = interaction.options.getNumber('price');
            
            await database.addUser(user.id, user.username, user.discriminator);
            await database.addUser(interaction.user.id, interaction.user.username, interaction.user.discriminator);
            
            console.log(`User ${user.username} added/updated in database`);
            
            const userInfo = await database.getUserInfo(user.id);
            if (userInfo?.is_scammer) {
                return await interaction.reply({ 
                    content: `❌ User <@${user.id}> is flagged as a scammer and cannot make transactions.`,
                    ephemeral: true 
                });
            }
            
            console.log(`Creating transaction for user ${user.id}: ${itemName} @ $${totalPrice}`);
            
            const transactionId = await database.addTransaction(
                user.id,
                itemName,
                1,
                totalPrice,
                totalPrice,
                interaction.user.id
            );
            
            const completeButton = new ButtonBuilder()
                .setCustomId(`transaction_complete_${transactionId}`)
                .setLabel('Complete')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const cancelButton = new ButtonBuilder()
                .setCustomId(`transaction_cancel_${transactionId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const row = new ActionRowBuilder()
                .addComponents(completeButton, cancelButton);
            
            const embed = new EmbedBuilder()
                .setTitle('🛒 New Transaction Created')
                .setDescription(`Transaction ID: ${transactionId}`)
                .addFields(
                    { name: 'Buyer', value: `<@${user.id}>`, inline: true },
                    { name: 'Item', value: itemName, inline: true },
                    { name: 'Price', value: `$${totalPrice.toFixed(2)}`, inline: true },
                    { name: 'Status', value: '⏳ Pending', inline: true },
                    { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setColor('#FFA500')
                .setFooter({ text: 'Use the buttons below to complete or cancel this transaction' })
                .setTimestamp();
                
            await interaction.reply({ 
                embeds: [embed], 
                components: [row] 
            });
            
            console.log(`Transaction ${transactionId} created successfully by ${interaction.user.username}`);
            
        } catch (error) {
            console.error('Error in createTransaction:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while creating the transaction. Please try again.',
                ephemeral: true 
            });
        }
    },

    async showHistory(interaction, database) {
        try {
            const targetUser = interaction.options.getUser('user');
            let transactions;
            let title;
            
            if (targetUser) {
                transactions = await database.getUserTransactions(targetUser.id);
                title = `📋 Transaction History for ${targetUser.username}`;
            } else {
                transactions = await database.getAllTransactions(20);
                title = '📋 All Recent Transactions';
            }
            
            if (transactions.length === 0) {
                const message = targetUser ? 
                    `📋 No transactions found for ${targetUser.username}.` : 
                    '📋 No transactions found.';
                return await interaction.reply(message);
            }
            
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(transactions.slice(0, 15).map(t => {
                    const status = this.getStatusEmoji(t.status);
                    const username = t.username || 'Unknown';
                    const createdBy = t.creator_username || 'Unknown';
                    return `**ID:** ${t.transaction_id} | **User:** ${username}\n` +
                           `**Item:** ${t.item_name} | **Amount:** $${parseFloat(t.total_amount).toFixed(2)}\n` +
                           `**Status:** ${status} ${t.status} | **Created by:** ${createdBy}\n` +
                           `**Date:** ${new Date(t.timestamp).toLocaleDateString()}`;
                }).join('\n\n'))
                .setColor('#0099FF')
                .setFooter({ text: `Showing ${Math.min(transactions.length, 15)} transactions` })
                .setTimestamp();
                
            if (transactions.length > 15) {
                embed.addFields({ 
                    name: 'Note', 
                    value: `${transactions.length - 15} more transactions not shown. Use /admin status with specific transaction ID for details.` 
                });
            }
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in showHistory:', error);
            await interaction.reply('❌ An error occurred while fetching transaction history.');
        }
    },

    async checkTransactionStatus(interaction, database) {
        try {
            const transactionId = interaction.options.getInteger('transaction_id');
            const transaction = await database.getTransactionById(transactionId);
            
            if (!transaction) {
                return await interaction.reply('❌ Transaction not found.');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Transaction Status')
                .addFields(
                    { name: 'Transaction ID', value: transaction.transaction_id.toString(), inline: true },
                    { name: 'Buyer', value: `<@${transaction.user_id}>`, inline: true },
                    { name: 'Username', value: transaction.username || 'Unknown', inline: true },
                    { name: 'Item', value: transaction.item_name, inline: true },
                    { name: 'Status', value: `${this.getStatusEmoji(transaction.status)} ${transaction.status}`, inline: true },
                    { name: 'Total Amount', value: `$${parseFloat(transaction.total_amount).toFixed(2)}`, inline: true },
                    { name: 'Created By', value: transaction.creator_username || 'Unknown', inline: true },
                    { name: 'Date Created', value: new Date(transaction.timestamp).toLocaleDateString(), inline: true },
                    { name: 'Time Created', value: new Date(transaction.timestamp).toLocaleTimeString(), inline: true }
                )
                .setColor(this.getStatusColor(transaction.status))
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in checkTransactionStatus:', error);
            await interaction.reply('❌ An error occurred while checking transaction status.');
        }
    },

    async showLeaderboard(interaction, database) {
        try {
            const topSellers = await database.getTopSellers(10);
            
            if (topSellers.length === 0) {
                return await interaction.reply('📋 No sales data available yet.');
            }
            
            const leaderboardText = topSellers.map((seller, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${seller.username}** - ${seller.total_sales} sales ($${parseFloat(seller.total_earned).toFixed(2)})`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle('🏆 Top Sellers Leaderboard')
                .setDescription(leaderboardText)
                .setColor('#FFD700')
                .setFooter({ text: `Showing top ${topSellers.length} sellers` })
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error showing leaderboard:', error);
            await interaction.reply('❌ Error retrieving leaderboard data.');
        }
    },

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
            const sellerStats = await database.getSellerStats(user.id);
            
            if (!userInfo) {
                return await interaction.reply('❌ User not found in database!');
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
                    { name: 'Sales Created', value: sellerStats.total_sales?.toString() || '0', inline: true },
                    { name: 'Revenue Generated', value: `$${parseFloat(sellerStats.total_earned || 0).toFixed(2)}`, inline: true }
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
            const stats = await database.getDatabaseStats();

            const embed = new EmbedBuilder()
                .setTitle('📊 Server Statistics')
                .addFields(
                    { name: 'Total Users', value: totalUsers.toString(), inline: true },
                    { name: 'Active Users', value: activeUsers.toString(), inline: true },
                    { name: 'Flagged Scammers', value: scammers.length.toString(), inline: true },
                    { name: 'Total Transactions', value: stats.transactions_count?.toString() || '0', inline: true },
                    { name: 'Pending Transactions', value: stats.pending_transactions?.toString() || '0', inline: true },
                    { name: 'Total Revenue', value: `$${(stats.total_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Sales Revenue', value: `$${(stats.total_sales_revenue || 0).toFixed(2)}`, inline: true }
                )
                .setColor('#0099FF')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing stats:', error);
            await interaction.reply('❌ Error retrieving statistics.');
        }
    },

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

    async manualBackup(interaction, database) {
        try {
            await interaction.deferReply();
            
            const backupData = await database.getBackupData();
            backupData.timestamp = new Date().toISOString();
            backupData.triggered_by = interaction.user.username;
            backupData.type = 'manual';

            await interaction.editReply('✅ Manual backup completed!');

        } catch (error) {
            console.error('Error creating manual backup:', error);
            await interaction.editReply('❌ Error creating backup.');
        }
    },

    async showDatabaseStats(interaction, database) {
        try {
            const stats = await database.getDatabaseStats();
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Database Statistics')
                .addFields(
                    { name: 'Users', value: `${stats.users_count || 0}`, inline: true },
                    { name: 'Transactions', value: `${stats.transactions_count || 0}`, inline: true },
                    { name: 'Messages', value: `${stats.messages_count || 0}`, inline: true },
                    { name: 'Purchase Revenue', value: `$${(stats.total_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Sales Revenue', value: `$${(stats.total_sales_revenue || 0).toFixed(2)}`, inline: true }
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
                .setTitle('🔧 Database Test')
                .addFields(
                    { name: 'Status', value: isConnected ? '✅ Connected' : '❌ Failed', inline: true },
                    { name: 'Response Time', value: `${responseTime}ms`, inline: true }
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

            await interaction.editReply(`✅ Cleanup completed! Removed ${deletedMessages} old messages.`);

        } catch (error) {
            console.error('Error during cleanup:', error);
            await interaction.editReply('❌ Error during cleanup.');
        }
    },

    getStatusEmoji(status) {
        switch (status.toLowerCase()) {
            case 'pending': return '⏳';
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'disputed': return '⚠️';
            case 'cancelled': return '🚫';
            default: return '❓';
        }
    },

    getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'pending': return '#FFA500';
            case 'completed': return '#00FF00';
            case 'failed': return '#FF0000';
            case 'disputed': return '#FFFF00';
            case 'cancelled': return '#808080';
            default: return '#0099FF';
        }
    }
};
