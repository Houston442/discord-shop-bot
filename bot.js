// bot.js - Complete Discord Shop Bot
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
                this.commands.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
            }
        } catch (error) {
            console.error('Error loading commands:', error);
        }
    }

    setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', async () => {
            console.log(`${this.client.user.tag} is online!`);
            
            // Set bot status
            this.client.user.setStatus('online');
            this.client.user.setActivity('Managing the shop', { type: 3 }); // Type 3 = WATCHING
            
            try {
                await this.database.initialize();
                await this.loadPersistentMessages();
                console.log('Database initialized and persistent messages loaded');
            } catch (error) {
                console.error('Error during bot initialization:', error);
            }
        });

        // Guild member add (Auto Join DM)
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleMemberJoin(member);
        });

        // Message create (Activity tracking & Persistent messages)
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            console.log(`Received message: "${message.content}" from ${message.author.username} in guild: ${message.guild?.id}`);
            
            // Track user activity
            await this.trackUserActivity(message);
            
            // Handle persistent messages
            await this.handlePersistentMessage(message);
            
            // Handle commands
            if (message.content.startsWith('!')) {
                console.log(`Processing command: ${message.content}`);
                await this.handleCommand(message);
            }
        });

        // Interaction create (Role selection, buttons, etc.)
        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isStringSelectMenu()) {
                    await this.handleRoleSelection(interaction);
                } else if (interaction.isButton()) {
                    await this.handleButtonInteraction(interaction);
                } else if (interaction.isChatInputCommand()) {
                    await this.handleSlashCommand(interaction);
                }
            } catch (error) {
                console.error('Error handling interaction:', error);
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
            
            await this.database.logMessage(
                message.id,
                message.author.id,
                message.channel.id,
                message.content.substring(0, 500), // Limit content length
                message.content.startsWith('!') ? message.content.split(' ')[0] : null
            );
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
            // Handle button interactions here if needed
            await interaction.reply({ content: 'Button interaction received!', ephemeral: true });
        } catch (error) {
            console.error('Error handling button interaction:', error);
        }
    }

    async handleSlashCommand(interaction) {
        try {
            // Handle slash commands here if needed
            await interaction.reply({ content: 'Slash command received!', ephemeral: true });
        } catch (error) {
            console.error('Error handling slash command:', error);
        }
    }

    async handleCommand(message) {
        try {
            const args = message.content.slice(1).split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            const command = this.commands.get(commandName);
            if (!command) {
                console.log(`Command not found: ${commandName}`);
                return;
            }

            console.log(`Executing command: ${commandName}`);
            await command.execute(message, args, this.database);
            
        } catch (error) {
            console.error('Error executing command:', error);
            try {
                await message.reply('There was an error executing that command!');
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    }

    async loadPersistentMessages() {
        try {
            const configs = await this.database.getAllPersistentChannels();
            for (const config of configs) {
                const channel = this.client.channels.cache.get(config.channel_id);
                if (channel) {
                    // Find the last bot message in the channel
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
        
        // Daily backup at 3 AM
        cron.schedule('0 3 * * *', async () => {
            console.log('Starting daily backup...');
            try {
                await this.backupManager.performBackup();
                console.log('Daily backup completed successfully');
            } catch (error) {
                console.error('Daily backup failed:', error);
            }
        });

        // Check YouTube every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            try {
                await this.youtubeMonitor.checkForNewVideos();
            } catch (error) {
                console.error('YouTube monitoring error:', error);
            }
        });

        // Check Twitch every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                await this.twitchMonitor.checkForLiveStreams();
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
