// commands/help.js - Complete version with all commands
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
                    value: '`/admin checkuser` `/admin syncmembers` `/admin stats` `/admin flagscammer`\nManage users, track activity, handle scammers', 
                    inline: true 
                },
                { 
                    name: '📝 Admin Tools', 
                    value: '`/admin welcome` `/admin setpersistent` `/admin cleanup`\nBot configuration and admin utilities', 
                    inline: true 
                },
                { 
                    name: '💬 Messaging', 
                    value: '`/message send` `/message embed` `/message dm` `/message announce`\nSend messages, embeds, DMs, and announcements', 
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
                           '**Transaction Flow:** `/admin buy` → use ✅/❌ buttons → automatic stats update', 
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
                        { name: 'Status Types', value: '⏳ **Pending** - Awaiting completion\n✅ **Completed** - Finished successfully\n🚫 **Cancelled** - Cancelled by admin\n❌ **Failed** - Error occurred', inline: false }
                    )
                    .setColor('#FFD700');
                break;
                
            case 'roles':
                embed = new EmbedBuilder()
                    .setTitle('🎭 Role Management Commands')
                    .addFields(
                        { name: 'Role Setup Creation', value: '`/admin setuproles create name` - Create new role menu setup\n`/admin setuproles configure setup_id` - Configure embed appearance\n`/admin setuproles addrole setup_id @role label` - Add role options with custom labels', inline: false },
                        { name: 'Role Setup Management', value: '`/admin setuproles list` - List all role setups\n`/admin setuproles view setup_id` - View detailed configuration\n`/admin setuproles delete setup_id` - Delete role setup\n`/admin setuproles removerole setup_id option_number` - Remove role option', inline: false },
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
                        { name: 'Scammer Management', value: '`/admin flagscammer @user [reason]` - Flag user as scammer with reason\n`/admin unflagscammer @user` - Remove scammer flag from user\n`/admin scammerlist` - List all flagged scammers with notes', inline: false },
                        { name: 'User Data Tracked', value: '• Join date and last activity\n• Total purchases and amount spent\n• Total sales created (if staff member)\n• Transaction history and status\n• Command usage statistics\n• Scammer status and notes', inline: false },
                        { name: 'Scammer Protection', value: '• Flagged scammers cannot make new transactions\n• Scammer notes visible to admins\n• Automatic prevention of scammer transactions\n• Audit trail of who flagged users and when', inline: false }
                    )
                    .setColor('#FF6347');
                break;
                
            case 'admin':
                embed = new EmbedBuilder()
                    .setTitle('📝 Admin Tools & Configuration')
                    .addFields(
                        { name: 'Welcome Message System', value: '`/admin welcome configure` - Set up rich embed welcome messages\n`/admin welcome toggle` - Switch between embed and text mode\n`/admin welcome preview` - Preview current welcome message\n`/admin welcome test` - Send test welcome to yourself', inline: false },
                        { name: 'Legacy Welcome Commands', value: '`/admin setwelcome message` - Set plain text welcome (old system)\nNew embed system is recommended for better customization', inline: false },
                        { name: 'Persistent Messages', value: '`/admin setpersistent #channel message` - Message stays at bottom of channel\n`/admin removepersistent #channel` - Remove persistent message\nUseful for rules, info, or announcements that stay visible', inline: false },
                        { name: 'System Maintenance', value: '`/admin cleanup` - Clean old data (messages older than 30 days)\nHelps maintain database performance and removes outdated logs', inline: false },
                        { name: 'Welcome Embed Features', value: '• Custom title, description, colors\n• Thumbnail and main images\n• Footer text and custom styling\n• Line break support with \\n\n• Automatic user avatar as default thumbnail\n• Toggle between embed and plain text modes', inline: false }
                    )
                    .setColor('#32CD32');
                break;
                
            case 'messaging':
                embed = new EmbedBuilder()
                    .setTitle('💬 Messaging Commands')
                    .addFields(
                        { name: 'Basic Messaging', value: '`/message send content` - Send message in current channel\n`/message channel #channel content` - Send message to specific channel\n`/message edit message_id content` - Edit existing bot message', inline: false },
                        { name: 'Rich Embeds', value: '`/message embed title description` - Create rich embed message\nOptional: color, thumbnail, image, footer parameters\nSupports custom colors (#FF0000 format) and image URLs', inline: false },
                        { name: 'Direct Messages', value: '`/message dm @user content` - Send private message to user\nUseful for warnings, notifications, or private communications', inline: false },
                        { name: 'Announcements', value: '`/message announce everyone/here content` - Send announcement with ping\nChoose between @everyone or @here ping types', inline: false },
                        { name: 'Advanced Features', value: '• Custom emoji support using :emoji_name: format\n• Line breaks in embeds using \\n\n• URL validation for images and thumbnails\n• Color format validation\n• Message editing for corrections', inline: false },
                        { name: 'Embed Limits', value: 'Title: 256 characters\nDescription: 4096 characters\nFooter: 2048 characters\nAll fields automatically truncated if too long', inline: false }
                    )
                    .setColor('#FF69B4');
                break;
                
            case 'system':
                embed = new EmbedBuilder()
                    .setTitle('💾 System & Database Commands')
                    .addFields(
                        { name: 'Database Management', value: '`/admin backup` - Manual database backup with file export\n`/admin dbstats` - Detailed database statistics and counts\n`/admin testdb` - Test database connection and response time', inline: false },
                        { name: 'Automated Features', value: '**Daily Backups:** Every midnight GMT with Discord file upload\n**Role Syncing:** Automatic when roles are created/updated/deleted\n**Activity Tracking:** Real-time user activity and command usage\n**Statistics:** Automatic transaction and revenue calculations', inline: false },
                        { name: 'Database Statistics Tracked', value: '• Total users, transactions, messages\n• Scammer count and flagged users\n• Total revenue and sales revenue\n• Pending transactions count\n• Server roles and role setups\n• System performance metrics', inline: false },
                        { name: 'Backup Information', value: '• JSON format with all database tables\n• Includes metadata (timestamp, triggered by, type)\n• File size and statistics included\n• Automatic Discord channel upload\n• Error notifications if backup fails', inline: false },
                        { name: 'Performance Monitoring', value: '• Database connection pool optimization\n• Query timeout protection\n• Memory usage monitoring\n• Rate limiting for expensive operations\n• Automatic cleanup of old data', inline: false }
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
