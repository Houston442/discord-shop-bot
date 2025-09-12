// commands/help.js - Updated Help for New Transaction System
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display all available bot commands and their usage'),
    
    async execute(interaction, database) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Discord Shop Bot - Command Guide')
                .setDescription('All available commands and their usage:')
                .addFields(
                    // Transaction Commands Section
                    { 
                        name: '💰 **TRANSACTION COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin buy @user <item> <price>\n' +
                        '/admin history [user]\n' +
                        '/admin status <transaction_id>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Transaction Command Details', 
                        value: 
                        '**`/admin buy`** - Create a new transaction for a user with Complete/Cancel buttons\n' +
                        '   • Creates transaction that can be completed or cancelled via buttons\n' +
                        '   • Automatically checks if user is flagged as scammer\n' +
                        '   • Buttons update transaction status immediately\n' +
                        '**`/admin history`** - View all recent transactions or for specific user\n' +
                        '**`/admin status`** - Check detailed status of a specific transaction\n',
                        inline: false 
                    },

                    // User Management Section
                    { 
                        name: '👥 **USER MANAGEMENT COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin syncmembers\n' +
                        '/admin checkuser @user\n' +
                        '/admin stats\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 User Management Details', 
                        value: 
                        '**`/admin syncmembers`** - Add all Discord server members to database\n' +
                        '**`/admin checkuser`** - View detailed user info, transactions, and activity\n' +
                        '**`/admin stats`** - Show server statistics and database overview\n',
                        inline: false 
                    },

                    // Scammer Management Section
                    { 
                        name: '🚨 **SCAMMER MANAGEMENT COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin flagscammer @user [reason]\n' +
                        '/admin unflagscammer @user\n' +
                        '/admin scammerlist\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Scammer Management Details', 
                        value: 
                        '**`/admin flagscammer`** - Flag user as scammer with optional reason\n' +
                        '   • Flagged users cannot make new transactions\n' +
                        '**`/admin unflagscammer`** - Remove scammer flag from user\n' +
                        '**`/admin scammerlist`** - Display all flagged scammers with notes\n',
                        inline: false 
                    },

                    // Message Commands Section
                    { 
                        name: '📝 **MESSAGE COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/message send <content>\n' +
                        '/message edit <message_id> <content>\n' +
                        '/message embed <title> <description> [color]\n' +
                        '/message channel #channel <content>\n' +
                        '/message dm @user <content>\n' +
                        '/message announce <everyone|here> <content>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Message Command Details', 
                        value: 
                        '**`/message send`** - Send message in current channel with emoji support\n' +
                        '**`/message edit`** - Edit existing bot message by ID\n' +
                        '**`/message embed`** - Send rich embedded message with custom color\n' +
                        '**`/message channel`** - Send message to specific channel\n' +
                        '**`/message dm`** - Send direct message to user\n' +
                        '**`/message announce`** - Send announcement with @everyone/@here\n',
                        inline: false 
                    },

                    // Bot Configuration Section
                    { 
                        name: '⚙️ **BOT CONFIGURATION COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin setwelcome <message>\n' +
                        '/admin setpersistent #channel <message>\n' +
                        '/admin removepersistent #channel\n' +
                        '/setup roles\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Bot Configuration Details', 
                        value: 
                        '**`/admin setwelcome`** - Set welcome DM message for new members\n' +
                        '**`/admin setpersistent`** - Set message that always stays last in channel\n' +
                        '**`/admin removepersistent`** - Remove persistent message from channel\n' +
                        '**`/setup roles`** - Create interactive role selection menu\n',
                        inline: false 
                    },

                    // Database & System Section
                    { 
                        name: '💾 **DATABASE & SYSTEM COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin backup\n' +
                        '/admin dbstats\n' +
                        '/admin testdb\n' +
                        '/admin cleanup\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Database & System Details', 
                        value: 
                        '**`/admin backup`** - Manually trigger database backup\n' +
                        '**`/admin dbstats`** - Show detailed database statistics\n' +
                        '**`/admin testdb`** - Test database connection and response time\n' +
                        '**`/admin cleanup`** - Clean old messages/data (30+ days)\n',
                        inline: false 
                    },

                    // Transaction Workflow Section
                    { 
                        name: '🔄 **NEW TRANSACTION WORKFLOW**', 
                        value: 
                        '**Step 1:** Use `/admin buy @user item_name price` to create transaction\n' +
                        '**Step 2:** Transaction message appears with Complete ✅ and Cancel ❌ buttons\n' +
                        '**Step 3:** Click appropriate button to update transaction status\n' +
                        '**Step 4:** Use `/admin history` or `/admin status` to view transaction details\n\n' +
                        '**Button Actions:**\n' +
                        '• ✅ **Complete** - Marks transaction as completed (green)\n' +
                        '• ❌ **Cancel** - Marks transaction as cancelled (gray)\n' +
                        '• Buttons disappear after use and embed updates with new status\n' +
                        '• No more complex transaction status management needed!\n',
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
                        '# Create a transaction (new simplified way)\n' +
                        '/admin buy @JohnDoe Dragon Sword 25.99\n\n' +
                        '# Check transaction history for specific user\n' +
                        '/admin history @JohnDoe\n\n' +
                        '# Send message with custom emoji\n' +
                        '/message send Welcome! :shop_icon: Check our deals :fire:\n\n' +
                        '# Create embed announcement\n' +
                        '/message embed "Shop Update" "New items added!" #00FF00\n\n' +
                        '# Flag a scammer\n' +
                        '/admin flagscammer @user Attempted to scam other members\n\n' +
                        '# Set welcome message\n' +
                        '/admin setwelcome Welcome to our shop! :diamond: Read the rules\n' +
                        '```',
                        inline: false 
                    },

                    // Permission Notes Section
                    { 
                        name: '🔐 **PERMISSION REQUIREMENTS**', 
                        value: 
                        '**Everyone:** `/help` command only\n' +
                        '**Admin Only:** `/admin` commands, `/message` commands, `/setup` commands\n' +
                        '**Note:** Admin commands require Discord Administrator permission\n' +
                        '**New:** Simplified transaction system - no complex status management!\n',
                        inline: false 
                    },

                    // Important Changes Section
                    { 
                        name: '⚠️ **IMPORTANT CHANGES**', 
                        value: 
                        '• **Simplified Transactions** - Use `/admin buy` instead of users creating their own\n' +
                        '• **Button Controls** - Complete/Cancel transactions with buttons, not commands\n' +
                        '• **Admin-Controlled** - Only admins can create and manage transactions\n' +
                        '• **Scammer Protection** - Automatic blocking of flagged users from transactions\n' +
                        '• **Immediate Updates** - Button clicks instantly update transaction status\n' +
                        '• **Cleaner Workflow** - No more complex transaction status types\n',
                        inline: false 
                    },

                    // Help Footer
                    { 
                        name: '❓ **NEED MORE HELP?**', 
                        value: 
                        '• Use Discord\'s auto-complete by typing `/` and selecting commands\n' +
                        '• Required parameters are marked as such in Discord\n' +
                        '• Optional parameters are shown in [brackets] above\n' +
                        '• Most commands are admin-only for security and control\n' +
                        '• The new transaction system is much simpler to use!\n',
                        inline: false 
                    }
                )
                .setColor('#0099FF')
                .setFooter({ 
                    text: 'Discord Shop Bot | Simplified Transaction System | Type / to see available commands' 
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
