// commands/help.js - Complete Updated Help with Role Management System
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display all available bot commands and their usage'),
    
    async execute(interaction, database) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Discord Shop Bot - Complete Command Guide')
                .setDescription('All available admin commands and their usage:')
                .addFields(
                    // Transaction Commands Section
                    { 
                        name: '💰 **TRANSACTION COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin buy @user <item> <price>\n' +
                        '/admin history [user]\n' +
                        '/admin status <transaction_id>\n' +
                        '/admin leaderboard\n' +
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
                        '**`/admin status`** - Check detailed status of a specific transaction\n' +
                        '**`/admin leaderboard`** - Show top sellers based on completed transactions\n',
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
                        '   • Shows both buyer and seller statistics\n' +
                        '**`/admin stats`** - Show server statistics and database overview\n',
                        inline: false 
                    },

                    // Role Management Section
                    { 
                        name: '🎭 **ROLE MANAGEMENT COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/admin syncroles\n' +
                        '/admin listroles\n' +
                        '/admin setautorole [role]\n' +
                        '/admin createsetup <name>\n' +
                        '/admin listsetups\n' +
                        '/admin deletesetup <setup_id>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Role Management Details', 
                        value: 
                        '**`/admin syncroles`** - Sync all Discord server roles to database\n' +
                        '   • Automatically happens when roles are created/updated/deleted\n' +
                        '**`/admin listroles`** - List all assignable server roles\n' +
                        '**`/admin setautorole`** - Set role auto-assigned to new members\n' +
                        '   • Default: "Tesco Clubcard" role\n' +
                        '**`/admin createsetup`** - Create custom role selection menu\n' +
                        '   • Interactive setup process with embed customization\n' +
                        '**`/admin listsetups`** - View all role setup configurations\n' +
                        '**`/admin deletesetup`** - Delete a role setup configuration\n',
                        inline: false 
                    },

                    // Role Deployment Section
                    { 
                        name: '🚀 **ROLE DEPLOYMENT COMMANDS** (Admin Only)', 
                        value: '```' +
                        '/roles deploy <setup_id> [channel]\n' +
                        '/roles preview <setup_id>\n' +
                        '/roles undeploy <setup_id>\n' +
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Role Deployment Details', 
                        value: 
                        '**`/roles deploy`** - Deploy a role setup to a channel\n' +
                        '   • Creates interactive role selection menu\n' +
                        '   • Users can select/deselect roles from dropdown\n' +
                        '**`/roles preview`** - Preview a role setup before deploying\n' +
                        '**`/roles undeploy`** - Remove a deployed role menu\n',
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
                        '```', 
                        inline: false 
                    },
                    { 
                        name: '📝 Bot Configuration Details', 
                        value: 
                        '**`/admin setwelcome`** - Set welcome DM message for new members\n' +
                        '**`/admin setpersistent`** - Set message that always stays last in channel\n' +
                        '**`/admin removepersistent`** - Remove persistent message from channel\n',
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

                    // Role Setup Workflow Section
                    { 
                        name: '🎨 **ROLE SETUP CREATION WORKFLOW**', 
                        value: 
                        '**Step 1:** Use `/admin createsetup <name>` to start interactive setup\n' +
                        '**Step 2:** Configure embed appearance (title, description, thumbnail, image, color, footer)\n' +
                        '**Step 3:** Add role options with format: `[Label] | [Description] | [Emoji] | [Role Name]`\n' +
                        '**Step 4:** Preview with `/roles preview <setup_id>`\n' +
                        '**Step 5:** Deploy with `/roles deploy <setup_id> [channel]`\n\n' +
                        '**Interactive Setup Features:**\n' +
                        '• Fully customizable embed appearance\n' +
                        '• Up to 25 role options per setup\n' +
                        '• Custom emojis and descriptions for each role\n' +
                        '• Real-time preview before deployment\n' +
                        '• Multiple setups can be created and deployed\n',
                        inline: false 
                    },

                    // Transaction Workflow Section
                    { 
                        name: '🔄 **TRANSACTION WORKFLOW**', 
                        value: 
                        '**Step 1:** Use `/admin buy @user item_name price` to create transaction\n' +
                        '**Step 2:** Transaction message appears with Complete ✅ and Cancel ❌ buttons\n' +
                        '**Step 3:** Click appropriate button to update transaction status\n' +
                        '**Step 4:** Stats are updated only when transaction is completed\n\n' +
                        '**Button Actions:**\n' +
                        '• ✅ **Complete** - Marks transaction as completed (updates buyer/seller stats)\n' +
                        '• ❌ **Cancel** - Marks transaction as cancelled (no stat changes)\n' +
                        '• Buttons disappear after use and embed updates with new status\n' +
                        '• Seller performance tracked automatically for leaderboards\n',
                        inline: false 
                    },

                    // Auto-Role System Section
                    { 
                        name: '🤖 **AUTOMATIC SYSTEMS**', 
                        value: 
                        '**Auto-Role Assignment:**\n' +
                        '• New members automatically get "Tesco Clubcard" role\n' +
                        '• Configurable with `/admin setautorole`\n\n' +
                        '**Role Syncing:**\n' +
                        '• Server roles automatically sync to database when created/updated/deleted\n' +
                        '• Manual sync available with `/admin syncroles`\n\n' +
                        '**Member Syncing:**\n' +
                        '• Use `/admin syncmembers` to sync all server members to database\n' +
                        '• Automatic tracking when members interact with bot\n\n' +
                        '**Daily Backups:**\n' +
                        '• Automatic database backup every day at midnight GMT\n' +
                        '• Manual backups with `/admin backup`\n',
                        inline: false 
                    },

                    // Custom Emoji Support Section
                    { 
                        name: '😀 **CUSTOM EMOJI SUPPORT**', 
                        value: 
                        '**Server Emojis:** Use `:emoji_name:` format in message commands\n' +
                        '   • Example: `:shop_icon:`, `:verified:`, `:diamond:`, `:warning_sign:`\n' +
                        '   • Works in: welcome messages, persistent messages, all message commands\n' +
                        '   • Works in: role setup descriptions and options\n\n' +
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
                        '/admin buy @JohnDoe Dragon Sword 25.99\n\n' +
                        '# Create a role setup\n' +
                        '/admin createsetup "Ping Roles"\n' +
                        '# Then follow interactive prompts\n\n' +
                        '# Set auto-role for new members\n' +
                        '/admin setautorole @Tesco Clubcard\n\n' +
                        '# Deploy a role menu\n' +
                        '/roles deploy 1 #role-selection\n\n' +
                        '# Send message with custom emoji\n' +
                        '/message send Welcome! :shop_icon: Check our deals\n\n' +
                        '# Flag a scammer\n' +
                        '/admin flagscammer @user Attempted to scam members\n' +
                        '```',
                        inline: false 
                    },

                    // Permission Notes Section
                    { 
                        name: '🔐 **PERMISSION REQUIREMENTS**', 
                        value: 
                        '**Everyone:** `/help` command only\n' +
                        '**Admin Only:** All other commands require Discord Administrator permission\n' +
                        '**Auto-Role:** "Tesco Clubcard" role assigned automatically to new members\n' +
                        '**Role Selection:** Members can use deployed role menus to self-assign roles\n',
                        inline: false 
                    },

                    // Important Changes Section
                    { 
                        name: '⚠️ **KEY FEATURES**', 
                        value: 
                        '• **Dynamic Role System** - Roles sync automatically with Discord server\n' +
                        '• **Custom Role Menus** - Fully customizable role selection interfaces\n' +
                        '• **Seller Tracking** - Performance metrics for transaction creators\n' +
                        '• **Scammer Protection** - Automatic blocking of flagged users\n' +
                        '• **Auto-Role Assignment** - New members get default role automatically\n' +
                        '• **Button-Based Transactions** - Simple complete/cancel workflow\n' +
                        '• **Interactive Setup** - Guided role menu creation process\n' +
                        '• **Multiple Deployments** - Create and deploy multiple role menus\n',
                        inline: false 
                    },

                    // Help Footer
                    { 
                        name: '❓ **NEED MORE HELP?**', 
                        value: 
                        '• Use Discord\'s auto-complete by typing `/` and selecting commands\n' +
                        '• Required parameters are marked as such in Discord\n' +
                        '• Optional parameters are shown in [brackets] above\n' +
                        '• All admin commands require Administrator permission\n' +
                        '• Role setup creation is interactive - follow the prompts!\n' +
                        '• Contact server administrators for additional support\n',
                        inline: false 
                    }
                )
                .setColor('#0099FF')
                .setFooter({ 
                    text: 'Discord Shop Bot | Advanced Role Management | Type / to see available commands' 
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
