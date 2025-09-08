// commands/admin.js
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

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('Admin Commands')
            .setDescription('Available admin commands:')
            .addFields(
                { name: '`!admin setwelcome <message>`', value: 'Set the welcome DM message' },
                { name: '`!admin flagscammer @user [reason]`', value: 'Flag a user as scammer' },
                { name: '`!admin unflagscammer @user`', value: 'Remove scammer flag from user' },
                { name: '`!admin checkuser @user`', value: 'View user information and transaction history' },
                { name: '`!admin scammerlist`', value: 'List all flagged scammers' },
                { name: '`!admin setpersistent #channel <message>`', value: 'Set persistent message for channel' },
                { name: '`!admin addcreator <platform> <id> <name> #channel`', value: 'Add YouTube/Twitch creator for monitoring' },
                { name: '`!admin removecreator <platform> <id>`', value: 'Remove creator from monitoring' }
            )
            .setColor('#0099FF');
            
        message.reply({ embeds: [embed] });
    }
};
