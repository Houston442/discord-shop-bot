// commands/help.js - Complete Help Command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display all available bot commands and their usage'),
    
    async execute(interaction, database) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Discord Shop Bot - Complete Command Guide')
                .setDescription('All available slash commands and their usage:')
                .addFields(
                    // Shop Commands Section
                    { 
                        name: '🛒 **SHOP COMMANDS**', 
                        value: '```' +
                        '/shop buy <item> <price> [quantity]\n' +
                        '/shop history\n' +
                        '/shop status <transaction_id>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Shop Command Details', 
                        value: 
                        '**`/shop buy`** - Create a new transaction for an item\n' +
                        '**`/shop history`** - View your personal transaction history\n' +
                        '**`/shop status`** - Check the status of a specific transaction\n',
                        inline: false 
                    },

                    // Admin Commands Section
                    { 
                        name: '👥 **ADMIN COMMANDS - USER MANAGEMENT**', 
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
                        name: '🚨 **ADMIN COMMANDS - SCAMMER MANAGEMENT**', 
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
                        '**`/admin unflagscammer`** - Remove scammer flag from user\n' +
                        '**`/admin scammerlist`** - Display all flagged scammers with notes\n',
                        inline: false 
                    },

                    // Transaction Management Section
                    { 
                        name: '💰 **ADMIN COMMANDS - TRANSACTION MANAGEMENT**', 
                        value: '```' +
                        '/admin updatetransaction <id> <status>\n' +
                        '/admin alltransactions\n' +
                        '/admin pendingtransactions\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Transaction Management Details', 
                        value: 
                        '**`/admin updatetransaction`** - Update transaction status\n' +
                        '   • Status options: pending, completed, failed, disputed, cancelled\n' +
                        '**`/admin alltransactions`** - View all recent transactions\n' +
                        '**`/admin pendingtransactions`** - View only pending transactions\n',
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
                        '**`/message embed`** - Send rich embedded message\n' +
                        '**`/message channel`** - Send message to specific channel\n' +
                        '**`/message dm`** - Send direct message to user\n' +
                        '**`/message announce`** - Send announcement with @everyone/@here\n',
                        inline: false 
                    },

                    // Bot Configuration Section
                    { 
                        name: '⚙️ **ADMIN COMMANDS - BOT CONFIGURATION**', 
                        value: '```' +
                        '/admin setwelcome <message>\n' +
                        '/admin setpersistent #channel <message>\n' +
                        '/admin removepersistent #channel\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Bot Configuration Details', 
                        value: 
                        '**`/admin setwelcome`** - Set welcome DM for new members\n' +
                        '**`/admin setpersistent`** - Message always stays last in channel\n' +
                        '**`/admin removepersistent`** - Remove persistent message\n',
                        inline: false 
                    },

                    // Content Monitoring Section
                    { 
                        name: '🎥 **ADMIN COMMANDS - CONTENT MONITORING**', 
                        value: '```' +
                        '/admin addcreator <platform> <id> <name> #channel\n' +
                        '/admin removecreator <platform> <id>\n' +
                        '/admin listcreators\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Content Monitoring Details', 
                        value: 
                        '**`/admin addcreator`** - Add YouTube/Twitch creator for monitoring\n' +
                        '   • Platform: youtube or twitch\n' +
                        '   • Auto-post when creator uploads/goes live\n' +
                        '**`/admin removecreator`** - Stop monitoring creator\n' +
                        '**`/admin listcreators`** - Show all monitored creators\n',
                        inline: false 
                    },

                    // Database & System Section
                    { 
                        name: '💾 **ADMIN COMMANDS - DATABASE & SYSTEM**', 
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
                        '**`/admin testdb`** - Test database connection\n' +
                        '**`/admin cleanup`** - Clean old messages/data (30+ days)\n',
                        inline: false 
                    },

                    // Setup Commands Section
                    { 
                        name: '🎭 **SETUP COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/setup roles\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Setup Command Details', 
                        value: 
                        '**`/setup roles`** - Create interactive role selection menu\n' +
                        '   • Users can select: Buyer, Seller, Notifications, VIP, Updates\n',
                        inline: false 
                    },

                    // Emoji Support Section
                    { 
                        name: '😀 **CUSTOM EMOJI SUPPORT**', 
                        value: 
                        '**Custom Server Emojis:** Use `:emoji_name:` format in message commands\n' +
                        '   • Example: `:shop_icon:`, `:verified:`, `:diamond:`, `:warning_sign:`\n' +
                        '   • Works in: welcome messages, persistent messages, all message commands\n\n' +
                        '**Unicode Emojis:** Work normally everywhere\n' +
                        '   • Example: 🛒 💎 ⚠️ ✅ ❌ 🔔 🎉 ❤️ 🔥 ⭐ 💰 🛡️\n',
                        inline: false 
                    },

                    // Permission Notes Section
                    { 
                        name: '🔐 **PERMISSION REQUIREMENTS**', 
                        value: 
                        '**Everyone:** `/shop` commands, `/help`\n' +
                        '**Admin Only:** `/admin` commands, `/message` commands, `/setup` commands\n' +
                        '**Note:** Admin commands require Discord Administrator permission\n',
                        inline: false 
                    },

                    // Quick Examples Section
                    { 
                        name: '💡 **QUICK EXAMPLES**', 
                        value: 
                        '```\n' +
                        '# Buy an item\n' +
                        '/shop buy Dragon Sword 25.99 1\n\n' +
                        '# Send message with custom emoji\n' +
                        '/message send Welcome! :shop_icon: Check our deals :fire:\n\n' +
                        '# Create embed announcement\n' +
                        '/message embed "Shop Update" "New items added!" #00FF00\n\n' +
                        '# Flag a scammer\n' +
                        '/admin flagscammer @user Tried to scam other members\n\n' +
                        '# Set welcome message\n' +
                        '/admin setwelcome Welcome to our shop! :diamond: Read #rules\n' +
                        '```',
                        inline: false 
                    },

                    // Help Footer
                    { 
                        name: '❓ **NEED MORE HELP?**', 
                        value: 
                        '• Use Discord\'s auto-complete by typing `/` and selecting commands\n' +
                        '• Required parameters are marked as such in Discord\n' +
                        '• Optional parameters are shown in [brackets] above\n' +
                        '• Contact server administrators for additional support\n',
                        inline: false 
                    }
                )
                .setColor('#0099FF')
                .setFooter({ 
                    text: 'Discord Shop Bot | Type / to see available commands with auto-complete' 
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
