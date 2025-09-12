// commands/help.js - Updated Help for New Command Structure
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display all available bot commands and their usage')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, database) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Discord Shop Bot - Admin Commands Guide')
                .setDescription('All available admin-only commands and their usage:')
                .addFields(
                    // Transaction Commands Section
                    { 
                        name: '💰 **TRANSACTION COMMANDS**', 
                        value: '```' +
                        '/buy @user <item> <price>\n' +
                        '/history [user]\n' +
                        '/status <transaction_id>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Transaction Command Details', 
                        value: 
                        '**`/buy`** - Create a new transaction for a user with Complete/Cancel buttons\n' +
                        '   • Creates transaction that can be completed or cancelled via buttons\n' +
                        '   • Automatically checks if user is flagged as scammer\n' +
                        '**`/history`** - View all recent transactions or for specific user\n' +
                        '**`/status`** - Check detailed status of a specific transaction\n',
                        inline: false 
                    },

                    // User Management Section
                    { 
                        name: '👥 **USER MANAGEMENT COMMANDS**', 
                        value: '```' +
                        '/syncmembers\n' +
                        '/checkuser @user\n' +
                        '/stats\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 User Management Details', 
                        value: 
                        '**`/syncmembers`** - Add all Discord server members to database\n' +
                        '**`/checkuser`** - View detailed user info, transactions, and activity\n' +
                        '**`/stats`** - Show server statistics and database overview\n',
                        inline: false 
                    },

                    // Scammer Management Section
                    { 
                        name: '🚨 **SCAMMER MANAGEMENT COMMANDS**', 
                        value: '```' +
                        '/flagscammer @user [reason]\n' +
                        '/unflagscammer @user\n' +
                        '/scammerlist\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Scammer Management Details', 
                        value: 
                        '**`/flagscammer`** - Flag user as scammer with optional reason\n' +
                        '   • Flagged users cannot make new transactions\n' +
                        '**`/unflagscammer`** - Remove scammer flag from user\n' +
                        '**`/scammerlist`** - Display all flagged scammers with notes\n',
                        inline: false 
                    },

                    // Message Commands Section
                    { 
                        name: '📝 **MESSAGE COMMANDS**', 
                        value: '```' +
                        '/send <content>\n' +
                        '/edit <message_id> <content>\n' +
                        '/embed <title> <description> [color]\n' +
                        '/sendchannel #channel <content>\n' +
                        '/senddm @user <content>\n' +
                        '/announce <everyone|here> <content>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Message Command Details', 
                        value: 
                        '**`/send`** - Send message in current channel with emoji support\n' +
                        '**`/edit`** - Edit existing bot message by ID\n' +
                        '**`/embed`** - Send rich embedded message with custom color\n' +
                        '**`/sendchannel`** - Send message to specific channel\n' +
                        '**`/senddm`** - Send direct message to user\n' +
                        '**`/announce`** - Send announcement with @everyone/@here\n',
                        inline: false 
                    },

                    // Bot Configuration Section
                    { 
                        name: '⚙️ **BOT CONFIGURATION COMMANDS**', 
                        value: '```' +
                        '/setwelcome <message>\n' +
                        '/setpersistent #channel <message>\n' +
                        '/removepersistent #channel\n' +
                        '/roles\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Bot Configuration Details', 
                        value: 
                        '**`/setwelcome`** - Set welcome DM message for new members\n' +
                        '**`/setpersistent`** - Set message that always stays last in channel\n' +
                        '**`/removepersistent`** - Remove persistent message from channel\n' +
                        '**`/roles`** - Create interactive role selection menu\n',
                        inline: false 
                    },

                    // Database & System Section
                    { 
                        name: '💾 **DATABASE & SYSTEM COMMANDS**', 
                        value: '```' +
                        '/backup\n' +
                        '/dbstats\n' +
                        '/testdb\n' +
                        '/cleanup\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Database & System Details', 
                        value: 
                        '**`/backup`** - Manually trigger database backup\n' +
                        '**`/dbstats`** - Show detailed database statistics\n' +
                        '**`/testdb`** - Test database connection and response time\n' +
                        '**`/cleanup`** - Clean old messages/data (30+ days)\n',
                        inline: false 
                    },

                    // Transaction Workflow Section
                    { 
                        name: '🔄 **TRANSACTION WORKFLOW**', 
                        value: 
                        '**Step 1:** Use `/buy @user item_name price` to create transaction\n' +
                        '**Step 2:** Transaction message appears with Complete ✅ and Cancel ❌ buttons\n' +
                        '**Step 3:** Click appropriate button to update transaction status\n' +
                        '**Step 4:** Use `/history` or `/status` to view transaction details\n\n' +
                        '**Button Actions:**\n' +
                        '• ✅ **Complete** - Marks transaction as completed\n' +
                        '• ❌ **Cancel** - Marks transaction as cancelled\n' +
                        '• Buttons disappear after use and embed updates with new status\n',
                        inline: false 
                    },

                    // Custom Emoji Support Section
                    { 
                        name: '😀 **CUSTOM EMOJI SUPPORT**', 
                        value: 
                        '**Server Emojis:** Use `:emoji_name:` format in message commands\n' +
                        '   • Example: `:shop_icon:`, `:verified:`, `:diamond:`, `:warning_sign:`\n' +
                        '   • Works in: welcome messages, persistent messages, all message commands\n\n' +
                        '**Unicode Emojis:** Work normally everywhere\n' +
                        '   • Example: 🛒 💎 ⚠️ ✅ ❌ 🔔 🎉 ❤️ 🔥 ⭐ 💰 🛡️\n',
                        inline: false 
                    },

                    // Quick Examples Section
                    { 
                        name: '💡 **QUICK EXAMPLES**', 
                        value: 
                        '```\n' +
                        '# Create a transaction\n' +
                        '/buy @JohnDoe Dragon Sword 25.99\n\n' +
                        '# Check transaction history for specific user\n' +
                        '/history @JohnDoe\n\n' +
                        '# Send message with custom emoji\n' +
                        '/send Welcome! :shop_icon: Check our deals :fire:\n\n' +
                        '# Create embed announcement\n' +
                        '/embed "Shop Update" "New items added!" #00FF00\n\n' +
                        '# Flag a scammer\n' +
                        '/flagscammer @user Attempted to scam other members\n\n' +
                        '# Set welcome message\n' +
                        '/setwelcome Welcome to our shop! :diamond: Read the rules\n' +
                        '```',
                        inline: false 
                    },

                    // Important Notes Section
                    { 
                        name: '⚠️ **IMPORTANT NOTES**', 
                        value: 
                        '• **All commands are admin-only** - Requires Discord Administrator permission\n' +
                        '• **Simplified transaction system** - Only Complete/Cancel status via buttons\n' +
                        '• **Scammer protection** - Flagged users cannot make transactions\n' +
                        '• **Button interactions** - Complete/Cancel buttons update transaction status immediately\n' +
                        '• **Automatic user registration** - Users added to database when mentioned in transactions\n' +
                        '• **Daily backups** - Automatic database backups at midnight GMT\n',
                        inline: false 
                    },

                    // Help Footer
                    { 
                        name: '❓ **NEED MORE HELP?**', 
                        value: 
                        '• Use Discord\'s auto-complete by typing `/` and selecting commands\n' +
                        '• Required parameters are shown in Discord\'s command interface\n' +
                        '• Optional parameters are shown in [brackets] above\n' +
                        '• All commands are admin-only for security and control\n',
                        inline: false 
                    }
                )
                .setColor('#0099FF')
                .setFooter({ 
                    text: 'Discord Shop Bot | All commands are admin-only | Type / to see available commands' 
                })
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({ 
                content: '❌ Error displaying help information.',
                ephemeral: true 
            });
        }
    }
};
