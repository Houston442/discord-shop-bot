// commands/help.js - Fixed version within Discord limits
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
                    value: '`/admin buy` `/admin history` `/admin status` `/admin leaderboard`\nManage purchases and sales', 
                    inline: true 
                },
                { 
                    name: '🎭 Role Management', 
                    value: '`/admin setuproles` `/roles deploy` `/admin syncroles`\nCreate and deploy role menus', 
                    inline: true 
                },
                { 
                    name: '👥 User Management', 
                    value: '`/admin checkuser` `/admin syncmembers` `/admin stats`\nManage users and scammers', 
                    inline: true 
                },
                { 
                    name: '📝 Admin Tools', 
                    value: '`/message` `/admin setwelcome` `/admin flagscammer`\nBot configuration and messaging', 
                    inline: true 
                },
                { 
                    name: '💾 System', 
                    value: '`/admin backup` `/admin dbstats` `/admin testdb`\nDatabase and system management', 
                    inline: true 
                },
                { 
                    name: 'Quick Start', 
                    value: '**For detailed help:** `/help category:<category_name>`\n**Role Setup:** `/admin setuproles create` → `/admin setuproles configure` → `/admin setuproles addrole` → `/roles deploy`', 
                    inline: false 
                }
            )
            .setColor('#0099FF')
            .setFooter({ text: 'Use /help category:<name> for detailed command info' });
            
        await interaction.reply({ embeds: [embed] });
    },

    async showCategoryHelp(interaction, category) {
        let embed;
        
        switch (category) {
            case 'transactions':
                embed = new EmbedBuilder()
                    .setTitle('💰 Transaction Commands')
                    .addFields(
                        { name: '/admin buy', value: 'Create new transaction for user\n`/admin buy @user item_name price`', inline: false },
                        { name: '/admin history', value: 'View transaction history\n`/admin history [@user]`', inline: false },
                        { name: '/admin status', value: 'Check transaction status\n`/admin status transaction_id`', inline: false },
                        { name: '/admin leaderboard', value: 'Show top sellers leaderboard', inline: false },
                        { name: 'How it works', value: 'Transactions start as pending → use ✅/❌ buttons to complete/cancel → stats update automatically', inline: false }
                    )
                    .setColor('#FFD700');
                break;
                
            case 'roles':
                embed = new EmbedBuilder()
                    .setTitle('🎭 Role Management Commands')
                    .addFields(
                        { name: 'Setup Creation', value: '`/admin setuproles create name` - Create new role menu\n`/admin setuproles configure setup_id` - Configure appearance\n`/admin setuproles addrole setup_id @role label` - Add role options', inline: false },
                        { name: 'Deployment', value: '`/roles preview setup_id` - Preview before deploying\n`/roles deploy setup_id [#channel]` - Deploy to channel\n`/roles undeploy setup_id` - Remove deployed menu', inline: false },
                        { name: 'Management', value: '`/admin setuproles list` - List all setups\n`/admin setuproles view setup_id` - View detailed config\n`/admin setuproles delete setup_id` - Delete setup', inline: false },
                        { name: 'Basic Role Commands', value: '`/admin syncroles` - Sync Discord roles to database\n`/admin listroles` - List assignable roles\n`/admin setautorole [@role]` - Set auto-role for new members', inline: false }
                    )
                    .setColor('#9932CC');
                break;
                
            case 'users':
                embed = new EmbedBuilder()
                    .setTitle('👥 User Management Commands')
                    .addFields(
                        { name: 'User Info', value: '`/admin checkuser @user` - View detailed user information\n`/admin syncmembers` - Add all server members to database\n`/admin stats` - Show server statistics', inline: false },
                        { name: 'Scammer Management', value: '`/admin flagscammer @user [reason]` - Flag user as scammer\n`/admin unflagscammer @user` - Remove scammer flag\n`/admin scammerlist` - List all flagged scammers', inline: false },
                        { name: 'Features', value: 'Flagged scammers cannot make transactions\nUser activity and transaction history tracked\nBuyer and seller statistics maintained', inline: false }
                    )
                    .setColor('#FF6347');
                break;
                
            case 'admin':
                embed = new EmbedBuilder()
                    .setTitle('📝 Admin Tools & Configuration')
                    .addFields(
                        { name: 'Messaging', value: '`/message send content` - Send message in channel\n`/message embed title description` - Send rich embed\n`/message dm @user content` - Send direct message\n`/message announce everyone/here content` - Send announcement', inline: false },
                        { name: 'Bot Configuration', value: '`/admin setwelcome message` - Set welcome DM for new members\n`/admin setpersistent #channel message` - Set persistent message\n`/admin removepersistent #channel` - Remove persistent message', inline: false },
                        { name: 'Features', value: 'Custom emoji support in messages\nWelcome DMs sent automatically\nPersistent messages stay at bottom of channel', inline: false }
                    )
                    .setColor('#32CD32');
                break;
                
            case 'system':
                embed = new EmbedBuilder()
                    .setTitle('💾 System & Database Commands')
                    .addFields(
                        { name: 'Database Management', value: '`/admin backup` - Manual database backup\n`/admin dbstats` - Detailed database statistics\n`/admin testdb` - Test database connection\n`/admin cleanup` - Clean old data (30+ days)', inline: false },
                        { name: 'Automated Features', value: 'Daily backups at midnight GMT\nAutomatic role syncing when roles change\nReal-time activity tracking\nTransaction statistics updates', inline: false },
                        { name: 'Backup Info', value: 'Backups sent to Discord channel\nIncludes all user data, transactions, and configurations\nFile attachments with detailed statistics', inline: false }
                    )
                    .setColor('#1E90FF');
                break;
                
            default:
                return await this.showGeneralHelp(interaction);
        }
        
        embed.setFooter({ text: 'All admin commands require Administrator permission' });
             
        await interaction.reply({ embeds: [embed] });
    }
};
