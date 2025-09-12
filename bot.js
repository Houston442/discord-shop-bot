// bot.js - Updated for Slash Commands
const { Client, GatewayIntentBits, Collection, EmbedBuilder, REST, Routes } = require('discord.js');
const { Pool } = require('pg');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Database = require('./database/connection');
const BackupManager = require('./utils/backupManager');
const YouTubeMonitor = require('./utils/youtubeMonitor');
const TwitchMonitor = require('./utils/twitchMonitor');

class ShopBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.DirectMessages
            ]
        });

        this.database = new Database();
        this.backupManager = new BackupManager(this.database);
        this.youtubeMonitor = new YouTubeMonitor(this.database);
        this.twitchMonitor = new TwitchMonitor(this.database);
        
        this.commands = new Collection();
        this.persistentMessages = new Map();
        
        this.loadCommands();
        this.setupEventHandlers();
        this.startScheduledTasks();
    }

    loadCommands() {
        try {
            const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const command = require(`./commands/${file}`);
                if (command.data && command.execute) {
                    this.commands.set(command.data.name, command);
                    console.log(`Loaded slash command: ${command.data.name}`);
                } else {
                    console.warn(`Command ${file} is missing required 'data' or 'execute' property`);
                }
            }
        } catch (error) {
            console.error('Error loading commands:', error);
        }
    }

    async registerSlashCommands() {
        try {
            const commands = [];
            for (const command of this.commands.values()) {
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }

            const rest = new REST().setToken(process.env.DISCORD_TOKEN);

            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            // Register commands to specific guild first (appears immediately)
            if (process.env.GUILD_ID) {
                try {
                    const guildData = await rest.put(
                        Routes.applicationGuildCommands(this.client.user.id, process.env.GUILD_ID),
                        { body: commands },
                    );
                    console.log(`Successfully registered ${guildData.length} guild-specific commands (immediate).`);
                } catch (guildError) {
                    console.error('Error registering guild commands:', guildError);
                }
            } else {
                console.log('GUILD_ID not set - skipping guild-specific registration');
            }

            // Also register commands globally (takes up to 1 hour to appear everywhere)
            try {
                const globalData = await rest.put(
                    Routes.applicationCommands(this.client.user.id),
                    { body: commands },
                );
                console.log(`Successfully registered ${globalData.length} global commands (up to 1 hour delay).`);
            } catch (globalError) {
                console.error('Error registering global commands:', globalError);
            }

        } catch (error) {
            console.error('Error in registerSlashCommands:', error);
        }
    }

    setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', async () => {
            console.log(`${this.client.user.tag} is online!`);
            
            // Set bot status
            this.client.user.setStatus('online');
            this.client.user.setActivity('Managing the shop', { type: 3 });
            
            try {
                await this.database.initialize();
                await this.loadPersistentMessages();
                await this.registerSlashCommands(); // Register slash commands
                console.log('Database initialized, persistent messages loaded, and slash commands registered');
            } catch (error) {
                console.error('Error during bot initialization:', error);
            }
        });

        // Guild member add (Auto Join DM)
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleMemberJoin(member);
        });

        // Message create (Activity tracking & Persistent messages - keep for activity tracking)
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            // Track user activity
            await this.trackUserActivity(message);
            
            // Handle persistent messages
            await this.handlePersistentMessage(message);
        });

        // Interaction create (Slash commands, role selection, buttons, etc.)
        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isChatInputCommand()) {
                    await this.handleSlashCommand(interaction);
                } else if (interaction.isStringSelectMenu()) {
                    await this.handleRoleSelection(interaction);
                } else if (interaction.isButton()) {
                    await this.handleButtonInteraction(interaction);
                }
            } catch (error) {
                console.error('Error handling interaction:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        });

        // Error handling
        this.client.on('error', error => {
            console.error('Discord client error:', error);
        });

        this.client.on('warn', warn => {
            console.warn('Discord client warning:', warn);
        });
    }

    async handleSlashCommand(interaction) {
        const command = this.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, this.database);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            const errorMessage = 'There was an error while executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }

    async handleMemberJoin(member) {
        try {
            console.log(`New member joined: ${member.user.username}`);
            
            // Add user to database
            await this.database.addUser(member.user.id, member.user.username, member.user.discriminator);
            
            // Get welcome message from database
            const welcomeMessage = await this.database.getWelcomeMessage();
            
            // Send DM
            const embed = new EmbedBuilder()
                .setTitle('Welcome to the Server!')
                .setDescription(welcomeMessage || 'Welcome! Thanks for joining our server.')
                .setColor('#00FF00')
                .setThumbnail(member.user.displayAvatarURL());

            await member.send({ embeds: [embed] });
            console.log(`Sent welcome DM to ${member.user.tag}`);
            
        } catch (error) {
            console.error('Error handling member join:', error);
        }
    }

    async trackUserActivity(message) {
        try {
            // Ensure user exists before logging activity
            await this.database.addUser(message.author.id, message.author.username, message.author.discriminator);
            
            // Only log if it's a command (for slash commands, this won't trigger much)
            if (message.content.startsWith('!') || message.content.startsWith('/')) {
                await this.database.logMessage(
                    message.id,
                    message.author.id,
                    message.channel.id,
                    message.content.substring(0, 500),
                    message.content.startsWith('!') ? message.content.split(' ')[0] : null
                );
            } else {
                // Just update last activity without logging message content
                await this.database.updateLastActivity(message.author.id);
            }
        } catch (error) {
            console.error('Error tracking user activity:', error);
        }
    }

    async handlePersistentMessage(message) {
        try {
            const channelConfig = await this.database.getPersistentChannelConfig(message.channel.id);
            if (!channelConfig) return;

            // Delete the bot's previous message
            if (this.persistentMessages.has(message.channel.id)) {
                const oldMessage = this.persistentMessages.get(message.channel.id);
                try {
                    await oldMessage.delete();
                } catch (error) {
                    console.log('Could not delete old persistent message:', error.message);
                }
            }

            // Send new persistent message
            const embed = new EmbedBuilder()
                .setDescription(channelConfig.message)
                .setColor('#0099FF');

            const newMessage = await message.channel.send({ embeds: [embed] });
            this.persistentMessages.set(message.channel.id, newMessage);
            
        } catch (error) {
            console.error('Error handling persistent message:', error);
        }
    }

    async handleRoleSelection(interaction) {
        try {
            const selectedRole = interaction.values[0];
            const member = interaction.member;
            const guild = interaction.guild;
            
            const role = guild.roles.cache.find(r => r.name === selectedRole);
            if (!role) {
                return await interaction.reply({ content: 'Role not found!', ephemeral: true });
            }

            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                await interaction.reply({ content: `Removed role: ${role.name}`, ephemeral: true });
            } else {
                await member.roles.add(role);
                await interaction.reply({ content: `Added role: ${role.name}`, ephemeral: true });
            }
        } catch (error) {
            console.error('Error handling role selection:', error);
            await interaction.reply({ content: 'Error processing role selection!', ephemeral: true });
        }
    }

    async handleButtonInteraction(interaction) {
        try {
            await interaction.reply({ content: 'Button interaction received!', ephemeral: true });
        } catch (error) {
            console.error('Error handling button interaction:', error);
        }
    }

    async loadPersistentMessages() {
        try {
            const configs = await this.database.getAllPersistentChannels();
            for (const config of configs) {
                const channel = this.client.channels.cache.get(config.channel_id);
                if (channel) {
                    const messages = await channel.messages.fetch({ limit: 10 });
                    const botMessage = messages.find(m => m.author.id === this.client.user.id);
                    if (botMessage) {
                        this.persistentMessages.set(config.channel_id, botMessage);
                    }
                }
            }
            console.log(`Loaded ${configs.length} persistent message configurations`);
        } catch (error) {
            console.error('Error loading persistent messages:', error);
        }
    }

    startScheduledTasks() {
        console.log('Starting scheduled tasks...');
        console.log('Current time:', new Date().toISOString());
        console.log('Current time BST/GMT:', new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
        
        // Daily backup at midnight BST/GMT
        cron.schedule('0 0 * * *', async () => {
            console.log('=== AUTOMATED DAILY BACKUP STARTING ===');
            console.log('UTC Time:', new Date().toISOString());
            console.log('Local Time (BST/GMT):', new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
            
            try {
                if (!this.backupManager) {
                    console.error('Backup manager not initialized!');
                    return;
                }
                
                // Get backup data
                const backupData = await this.database.getBackupData();
                backupData.timestamp = new Date().toISOString();
                backupData.triggered_by = 'Automated Daily Backup';
                backupData.type = 'automatic';
                
                // Create backup file
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `daily_backup_${timestamp}.json`;
                const backupJson = JSON.stringify(backupData, null, 2);
                
                console.log('=== DAILY BACKUP COMPLETED SUCCESSFULLY ===');
                
                // Send success notification with file attachment
                try {
                    const backupChannelId = process.env.BACKUP_CHANNEL_ID;
                    if (backupChannelId) {
                        const channel = this.client.channels.cache.get(backupChannelId);
                        if (channel) {
                            const stats = await this.database.getDatabaseStats();
                            
                            // Create temporary file
                            const fs = require('fs');
                            const path = require('path');
                            const tempDir = './temp_backups';
                            
                            // Ensure temp directory exists
                            if (!fs.existsSync(tempDir)) {
                                fs.mkdirSync(tempDir, { recursive: true });
                            }
                            
                            const filePath = path.join(tempDir, backupFileName);
                            fs.writeFileSync(filePath, backupJson);
                            
                            // Calculate file size
                            const fileStat = fs.statSync(filePath);
                            const fileSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);
                            
                            // Send message with file attachment
                            await channel.send({
                                content: `✅ **Daily backup completed successfully**\n` +
                                        `Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}\n` +
                                        `Users: ${stats.users_count || 0} | Transactions: ${stats.transactions_count || 0} | Revenue: $${(stats.total_revenue || 0).toFixed(2)}\n` +
                                        `File Size: ${fileSizeMB} MB`,
                                files: [{
                                    attachment: filePath,
                                    name: backupFileName
                                }]
                            });
                            
                            // Clean up temporary file after sending
                            fs.unlinkSync(filePath);
                            
                            console.log(`Backup file ${backupFileName} sent to Discord and cleaned up`);
                        } else {
                            console.log('Backup channel not found');
                        }
                    } else {
                        console.log('No backup channel configured (BACKUP_CHANNEL_ID not set)');
                    }
                } catch (notifyError) {
                    console.error('Failed to send backup notification with file:', notifyError);
                }
                
            } catch (error) {
                console.error('=== DAILY BACKUP FAILED ===', error);
                
                // Send failure notification
                try {
                    const backupChannelId = process.env.BACKUP_CHANNEL_ID;
                    if (backupChannelId) {
                        const channel = this.client.channels.cache.get(backupChannelId);
                        if (channel) {
                            await channel.send({
                                content: `❌ **Automated backup failed**\n` +
                                        `Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}\n` +
                                        `Error: ${error.message}`
                            });
                        }
                    }
                } catch (notifyError) {
                    console.error('Failed to send backup failure notification:', notifyError);
                }
            }
        }, {
            timezone: "UTC"
        });

        // Check YouTube every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            try {
                if (this.youtubeMonitor) {
                    await this.youtubeMonitor.checkForNewVideos();
                }
            } catch (error) {
                console.error('YouTube monitoring error:', error);
            }
        });

        // Check Twitch every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                if (this.twitchMonitor) {
                    await this.twitchMonitor.checkForLiveStreams();
                }
            } catch (error) {
                console.error('Twitch monitoring error:', error);
            }
        });

        console.log('Scheduled tasks initialized');
    }

    async start() {
        try {
            console.log('Starting Discord bot...');
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('Shutting down bot...');
        try {
            await this.client.destroy();
            await this.database.pool.end();
            console.log('Bot shut down successfully');
        } catch (error) {
            console.error('Error during shutdown:', error);
        }
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    if (bot) {
        await bot.shutdown();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    if (bot) {
        await bot.shutdown();
    }
    process.exit(0);
});

// Start the bot
console.log('Initializing Discord Shop Bot...');
const bot = new ShopBot();
bot.start().catch(error => {
    console.error('Fatal error starting bot:', error);
    process.exit(1);
});
