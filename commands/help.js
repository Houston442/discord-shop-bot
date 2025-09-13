// commands/help.js - Complete Updated Version with All Current Commands
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display available bot commands and their usage')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Specific command category to view')
                .setRequired(false)
                .addChoices(
                    { name: 'Transactions', value: 'transactions' },
                    { name: 'Role Management', value: 'roles' },
                    { name: 'User Management', value: 'users' },
                    { name: 'Admin Tools', value: 'admin' },
                    { name: 'Messaging', value: 'messaging' },
                    { name: 'System', value: 'system' }
                )),
    
    async execute(interaction, database) {
        try {
            const category = interaction.options.getString('category');
            
            if (category) {
                await this.showCategoryHelp(interaction, category);
            } else {
                await this.showGeneralHelp(interaction);
            }
            
        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({ 
                content: 'Error displaying help information.',
                ephemeral: true 
            });
        }
    },

    async showGeneralHelp(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Discord Shop Bot - Help Overview')
            .setDescription('**Available Command Categories:**')
            .addFields(
                { 
                    name: '💰 Transactions', 
                    value: '`/admin buy` `/admin history` `/admin status` `/admin leaderboard`\nManage purchases, sales, and transaction tracking', 
                    inline: true 
                },
                { 
                    name: '🎭 Role Management', 
                    value: '`/admin setuproles` `/roles deploy` `/admin syncroles` `/admin setautorole`\nCreate role menus, sync roles, auto-assign roles', 
                    inline: true 
                },
                { 
                    name: '👥 User Management', 
                    value: '`/admin checkuser` `/admin syncmembers` `/admin stats` `/admin flagscammer`\nManage users, track activity, handle scammers with alerts', 
                    inline: true 
                },
                { 
                    name: '📝 Admin Tools', 
                    value: '`/admin welcome` `/admin persistent` `/admin cleanup`\nBot configuration, welcome system, persistent embeds', 
                    inline: true 
                },
                { 
                    name: '💬 Messaging', 
                    value: '`/message send` `/message embed` `/message dm` `/message announce`\nSend messages, embeds, DMs, and announcements (hidden commands)', 
                    inline: true 
                },
                { 
                    name: '💾 System', 
                    value: '`/admin backup` `/admin dbstats` `/admin testdb`\nDatabase management and system monitoring', 
                    inline: true 
                },
                { 
                    name: 'Quick Start Guide', 
                    value: '**For detailed help:** `/help category:<category_name>`\n' +
                           '**Role Menu Setup:** `/admin setuproles create` → `/admin setuproles configure` → `/admin setuproles addrole` → `/roles deploy`\n' +
                           '**Transaction Flow:** `/admin buy` → use ✅/❌ buttons → automatic stats update\n' +
                           '**Scammer System:** `/admin flagscammer` → automatic channel alert + blacklist', 
                    inline: false 
                }
            )
            .setColor('#0099FF')
            .setFooter({ text: 'Use /help category:<name> for detailed command info • All admin commands require Administrator permission' });
            
        await interaction.reply({ embeds: [embed] });
    },

    async showCategoryHelp(interaction, category) {
        let embed;
        
        switch (category) {
            case 'transactions':
                embed = new EmbedBuilder()
                    .setTitle('💰 Transaction Commands')
                    .addFields(
                        { name: '/admin buy', value: '**Create new transaction for user**\n`/admin buy @user item_name price`\nCreates pending transaction with complete/cancel buttons', inline: false },
                        { name: '/admin history', value: '**View transaction history**\n`/admin history [@user]`\nShow all transactions or user-specific history (last 20)', inline: false },
                        { name: '/admin status', value: '**Check transaction status**\n`/admin status transaction_id`\nDetailed view of specific transaction with all info', inline: false },
                        { name: '/admin leaderboard', value: '**Show top sellers leaderboard**\nDisplays top 10 sellers by total sales and revenue earned', inline: false },
                        { name: 'Transaction Flow', value: '1. Create with `/admin buy`\n2. Transaction starts as "pending"\n3. Use ✅ button to complete or ❌ to cancel\n4. User stats automatically update\n5. Seller stats tracked if created by staff', inline: false },
                        { name: 'Status Types', value: '⏳ **Pending** - Awaiting completion\n✅ **Completed** - Finished successfully\n🚫 **Cancelled** - Cancelled by admin\n❌ **Failed** - Error occurred', inline: false },
                        { name: 'Scammer Protection', value: 'Users flagged as scammers cannot create new transactions and will be blocked automatically', inline: false }
                    )
                    .setColor('#FFD700');
                break;
                
            case 'roles':
                embed = new EmbedBuilder()
                    .setTitle('🎭 Role Management Commands')
                    .addFields(
                        { name: 'Role Setup Creation', value: '`/admin setuproles create name` - Create new role menu setup\n`/admin setuproles configure setup_id` - Configure embed appearance with colors, images, thumbnails\n`/admin setuproles addrole setup_id @role label` - Add role options with custom labels and emojis', inline: false },
                        { name: 'Role Setup Management', value: '`/admin setuproles list` - List all role setups\n`/admin setuproles view setup_id` - View detailed configuration\n`/admin setuproles delete setup_id` - Delete role setup\n`/admin setuproles removerole setup_id option_number` - Remove specific role option', inline: false },
                        { name: 'Deployment Commands', value: '`/roles preview setup_id` - Preview role menu before deploying\n`/roles deploy setup_id [#channel]` - Deploy role menu to channel\n`/roles undeploy setup_id` - Remove deployed role menu', inline: false },
                        { name: 'Basic Role Commands', value: '`/admin syncroles` - Sync Discord roles to database\n`/admin listroles` - List all assignable server roles\n`/admin setautorole [@role]` - Set role auto-assigned to new members', inline: false },
                        { name: 'Features', value: '• Multi-select role menus (users can select multiple roles)\n• Custom embed styling with colors, images, thumbnails\n• Emoji support for role options\n• Automatic role addition/removal based on selections\n• Up to 25 roles per menu (Discord limit)', inline: false }
                    )
                    .setColor('#9932CC');
                break;
                
            case 'users':
                embed = new EmbedBuilder()
                    .setTitle('👥 User Management Commands')
                    .addFields(
                        { name: 'User Information', value: '`/admin checkuser @user` - Detailed user profile with transaction history\n`/admin syncmembers` - Add all Discord members to database\n`/admin stats` - Complete server statistics and analytics', inline: false },
                        { name: 'Scammer Management', value: '`/admin flagscammer @user [reason]` - Flag user as scammer with automatic channel alert\n`/admin unflagscammer @user` - Remove scammer flag from user\n`/admin scammerlist` - List all flagged scammers with notes', inline: false },
                        { name: 'Enhanced Scammer System', value: '• **Auto Alerts**: Flagged scammers trigger automatic alerts in designated channel\n• **@here Ping**: Immediately notifies server members\n• **Rich Embeds**: Shows user avatar, reason, timestamp, and who flagged them\n• **Transaction Blocking**: Scammers cannot create new transactions', inline: false },
                        { name: 'User Data Tracked', value: '• Join date and last activity\n• Total purchases and amount spent\n• Total sales created (if staff member)\n• Transaction history and status\n• Command usage statistics\n• Scammer status and detailed notes', inline: false },
                        { name: 'Scammer Alert Setup', value: 'Set `SCAMMER_ALERT_CHANNEL_ID` in your environment variables to enable automatic scammer alerts', inline: false }
                    )
                    .setColor('#FF6347');
                break;
                
            case 'admin':
                embed = new EmbedBuilder()
                    .setTitle('📝 Admin Tools & Configuration')
                    .addFields(
                        { name: 'Welcome Message System', value: '`/admin welcome configure` - Set up rich embed welcome messages with full customization\n`/admin welcome toggle` - Switch between embed and text mode\n`/admin welcome preview` - Preview current welcome message\n`/admin welcome test` - Send test welcome to yourself', inline: false },
                        { name: 'Persistent Message System', value: '`/admin persistent embed #channel` - Create persistent embed with title, description, colors, images\n`/admin persistent text #channel` - Create simple persistent text message\n`/admin persistent remove #channel` - Remove persistent message from channel', inline: false },
                        { name: 'Legacy Commands', value: '`/admin setwelcome message` - Set plain text welcome (old system)\nNew embed system is recommended for better customization', inline: false },
                        { name: 'System Maintenance', value: '`/admin cleanup` - Clean old data (messages older than 30 days)\nHelps maintain database performance and removes outdated logs', inline: false },
                        { name: 'Persistent Message Features', value: '• **Full Embed Support**: Title, description, colors, thumbnails, images, footers\n• **Auto-Refresh**: Messages stay at bottom of channel\n• **Line Break Support**: Use \\n in descriptions\n• **URL Validation**: Ensures image links are valid', inline: false },
                        { name: 'Welcome Embed Features', value: '• Custom title, description, colors\n• Thumbnail and main images\n• Footer text and custom styling\n• Line break support with \\n\n• Automatic user avatar as default thumbnail\n• Toggle between embed and plain text modes', inline: false }
                    )
                    .setColor('#32CD32');
                break;
                
            case 'messaging':
                embed = new EmbedBuilder()
                    .setTitle('💬 Messaging Commands (Hidden Execution)')
                    .addFields(
                        { name: 'Basic Messaging', value: '`/message send content` - Send message in current channel (command hidden from users)\n`/message channel #channel content` - Send message to specific channel\n`/message edit message_id content` - Edit existing bot message', inline: false },
                        { name: 'Rich Embeds', value: '`/message embed title description` - Create rich embed message\n**Optional parameters:** color, thumbnail, image, footer\nSupports custom colors (#FF0000 format) and image URLs', inline: false },
                        { name: 'Direct Messages', value: '`/message dm @user content` - Send private message to user\nUseful for warnings, notifications, or private communications', inline: false },
                        { name: 'Announcements', value: '`/message announce everyone/here content` - Send announcement with ping\nChoose between @everyone or @here ping types', inline: false },
                        { name: 'Hidden Command Execution', value: '**Key Feature**: When you use message commands, other users only see the bot\'s message\n• No visible command usage above messages\n• Commands appear invisible to other users\n• You receive private confirmation that command worked\n• Messages look like they came directly from the bot', inline: false },
                        { name: 'Advanced Features', value: '• **Custom Emoji Support**: Use :emoji_name: format for server emojis\n• **Line Breaks**: Use \\n in embeds for line breaks\n• **URL Validation**: Automatic validation for images and thumbnails\n• **Color Format Validation**: Ensures hex colors are valid\n• **Message Editing**: Edit any bot message using message ID', inline: false },
                        { name: 'Embed Limits', value: 'Title: 256 characters\nDescription: 4096 characters\nFooter: 2048 characters\nAll fields automatically truncated if too long', inline: false }
                    )
                    .setColor('#FF69B4');
                break;
                
            case 'system':
                embed = new EmbedBuilder()
                    .setTitle('💾 System & Database Commands')
                    .addFields(
                        { name: 'Database Management', value: '`/admin backup` - Manual database backup with Discord file upload\n`/admin dbstats` - Detailed database statistics and counts\n`/admin testdb` - Test database connection and response time', inline: false },
                        { name: 'Automated Features', value: '**Daily Backups:** Every midnight GMT with Discord file upload and statistics\n**Role Syncing:** Automatic when roles are created/updated/deleted\n**Activity Tracking:** Real-time user activity and command usage\n**Statistics:** Automatic transaction and revenue calculations', inline: false },
                        { name: 'Backup System', value: '• **Manual Backups**: Triggered by `/admin backup` command\n• **Automatic Daily Backups**: Every midnight GMT\n• **Discord Integration**: Files sent directly to backup channel\n• **Comprehensive Data**: All tables, users, transactions, configurations\n• **File Statistics**: Size, user counts, revenue totals included', inline: false },
                        { name: 'Database Statistics Tracked', value: '• Total users, transactions, messages\n• Scammer count and flagged users\n• Total revenue and sales revenue\n• Pending transactions count\n• Server roles and role setups\n• System performance metrics', inline: false },
                        { name: 'Environment Variables Required', value: '`BACKUP_CHANNEL_ID` - Channel for backup file uploads\n`SCAMMER_ALERT_CHANNEL_ID` - Channel for scammer alerts\n`DATABASE_URL` - PostgreSQL connection string\n`DISCORD_TOKEN` - Bot authentication token', inline: false },
                        { name: 'Performance Monitoring', value: '• Database connection pool optimization\n• Query timeout protection (60 seconds)\n• Memory usage monitoring\n• Rate limiting for expensive operations\n• Automatic cleanup of old data (30+ days)\n• Connection health checks', inline: false }
                    )
                    .setColor('#1E90FF');
                break;
                
            default:
                return await this.showGeneralHelp(interaction);
        }
        
        embed.setFooter({ text: 'All admin commands require Administrator permission • Use /help for category overview' });
             
        await interaction.reply({ embeds: [embed] });
    }
};
