// commands/admin.js - Complete updated file
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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
            case 'setwelcome':
                await this.setWelcomeMessage(message, args.slice(1).join(' '), database);
                break;
                
            case 'flagscammer':
                await this.flagScammer(message, args, database);
                break;
                
            case 'unflagscammer':
                await this.unflagScammer(message, args, database);
                break;
                
            case 'checkuser':
                await this.checkUser(message, args, database);
                break;
                
            case 'scammerlist':
                await this.listScammers(message, database);
                break;
                
            case 'setpersistent':
                await this.setPersistentMessage(message, args, database);
                break;
                
            case 'addcreator':
                await this.addCreator(message, args, database);
                break;
                
            case 'removecreator':
                await this.removeCreator(message, args, database);
                break;

            case 'syncmembers':
                await this.syncAllMembers(message, database);
                break;

            case 'stats':
                await this.showStats(message, database);
                break;
                
            default:
                await this.showHelp(message);
        }
    },

    async setWelcomeMessage(message, newMessage, database) {
        if (!newMessage) {
            return message.reply('Please provide a welcome message!');
        }
        
        await database.setWelcomeMessage(newMessage);
        message.reply('✅ Welcome message updated successfully!');
    },

    async flagScammer(message, args, database) {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        const reason = args.slice(2).join(' ');
        
        if (!userId) {
            return message.reply('Please mention a user to flag!');
        }
        
        await database.flagUserAsScammer(userId, reason);
        message.reply(`✅ User flagged as scammer. Reason: ${reason || 'No reason provided'}`);
    },

    async unflagScammer(message, args, database) {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        
        if (!userId) {
            return message.reply('Please mention a user to unflag!');
        }
        
        await database.unflagUserAsScammer(userId);
        message.reply('✅ User unflagged successfully!');
    },

    async checkUser(message, args, database) {
        const userId = args[1]?.replace(/[<@!>]/g, '');
        
        if (!userId) {
            return message.reply('Please mention a user to check!');
        }
        
        const userInfo = await database.getUserInfo(userId);
        const transactions = await database.getUserTransactions(userId);
        
        if (!userInfo) {
            return message.reply('User not found in database!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('User Information')
            .setDescription(`<@${userId}>`)
            .addFields(
                { name: 'Username', value: userInfo.username, inline: true },
                { name: 'Join Date', value: userInfo.join_date?.toLocaleDateString() || 'Unknown', inline: true },
                { name: 'Total Purchases', value: userInfo.total_purchases.toString(), inline: true },
                { name: 'Total Spent', value: `$${userInfo.total_spent}`, inline: true },
                { name: 'Is Scammer', value: userInfo.is_scammer ? '⚠️ YES' : '✅ No', inline: true },
                { name: 'Last Activity', value: userInfo.last_activity?.toLocaleDateString() || 'Unknown', inline: true },
                { name: 'Recent Transactions', value: transactions.slice(0, 5).map(t => `${t.item_name} - $${t.total_amount} (${t.status})`).join('\n') || 'None', inline: false }
            )
            .setColor(userInfo.is_scammer ? '#FF0000' : '#00FF00');
            
        if (userInfo.scammer_notes) {
            embed.addFields({ name: 'Scammer Notes', value: userInfo.scammer_notes, inline: false });
        }
        
        message.reply({ embeds: [embed] });
    },

    async listScammers(message, database) {
        const scammers = await database.getAllScammers();
        
        if (scammers.length === 0) {
            return message.reply('No flagged scammers found!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🚨 Flagged Scammers')
            .setDescription(scammers.map(s => `<@${s.discord_id}> (${s.username}) - ${s.scammer_notes || 'No notes'}`).join('\n'))
            .setColor('#FF0000');
            
        message.reply({ embeds: [embed] });
    },

    async setPersistentMessage(message, args, database) {
        const channelId = args[1]?.replace(/[<#>]/g, '');
        const persistentMessage = args.slice(2).join(' ');
        
        if (!channelId || !persistentMessage) {
            return message.reply('Usage: `!admin setpersistent #channel Your message here`');
        }
        
        await database.setPersistentChannel(channelId, persistentMessage);
        message.reply('✅ Persistent message set for channel!');
    },

    async addCreator(message, args, database) {
        // Usage: !admin addcreator youtube channelId channelName #discord-channel
        const platform = args[1];
        const creatorId = args[2];
        const creatorName = args[3];
        const discordChannelId = args[4]?.replace(/[<#>]/g, '');
        
        if (!platform || !creatorId || !creatorName || !discordChannelId) {
            return message.reply('Usage: `!admin addcreator youtube/twitch creatorId creatorName #channel`');
        }
        
        await database.addCreator(platform, creatorId, creatorName, discordChannelId);
        message.reply(`✅ Added ${platform} creator: ${creatorName}`);
    },

    async removeCreator(message, args, database) {
        const platform = args[1];
        const creatorId = args[2];
        
        if (!platform || !creatorId) {
            return message.reply('Usage: `!admin removecreator youtube/twitch creatorId`');
        }
        
        await database.removeCreator(platform, creatorId);
        message.reply(`✅ Removed ${platform} creator: ${creatorId}`);
    },

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

    async showStats(message, database) {
        try {
            const totalUsers = await database.getTotalUserCount();
            const activeUsers = await database.getUserCount(); // Non-scammers
            const scammers = await database.getAllScammers();
            const recentUsers = await database.getRecentUsers(5);

            const embed = new EmbedBuilder()
                .setTitle('📊 Server Statistics')
                .addFields(
                    { name: 'Total Users in Database', value: totalUsers.toString(), inline: true },
                    { name: 'Active Users', value: activeUsers.toString(), inline: true },
                    { name: 'Flagged Scammers', value: scammers.length.toString(), inline: true },
                    { name: 'Recent Joins', value: recentUsers.map(u => `${u.username} (${new Date(u.join_date).toLocaleDateString()})`).join('\n') || 'None', inline: false }
                )
                .setColor('#0099FF')
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing stats:', error);
            message.reply('❌ Error retrieving statistics.');
        }
    },

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('🔧 Admin Commands')
            .setDescription('Available admin commands:')
            .addFields(
                { name: '**User Management**', value: '\u200B', inline: false },
                { name: '`!admin syncmembers`', value: 'Add all Discord members to database' },
                { name: '`!admin checkuser @user`', value: 'View user information and transaction history' },
                { name: '`!admin stats`', value: 'Show server and database statistics' },
                { name: '**Scammer Management**', value: '\u200B', inline: false },
                { name: '`!admin flagscammer @user [reason]`', value: 'Flag a user as scammer' },
                { name: '`!admin unflagscammer @user`', value: 'Remove scammer flag from user' },
                { name: '`!admin scammerlist`', value: 'List all flagged scammers' },
                { name: '**Bot Configuration**', value: '\u200B', inline: false },
                { name: '`!admin setwelcome <message>`', value: 'Set the welcome DM message' },
                { name: '`!admin setpersistent #channel <message>`', value: 'Set persistent message for channel' },
                { name: '**Content Monitoring**', value: '\u200B', inline: false },
                { name: '`!admin addcreator <platform> <id> <name> #channel`', value: 'Add YouTube/Twitch creator for monitoring' },
                { name: '`!admin removecreator <platform> <id>`', value: 'Remove creator from monitoring' }
            )
            .setColor('#0099FF');
            
        message.reply({ embeds: [embed] });
    }
};
