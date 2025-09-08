// bot.js
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
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            this.commands.set(command.name, command);
        }
    }

    setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', async () => {
            console.log(`${this.client.user.tag} is online!`);
            await this.database.initialize();
            await this.loadPersistentMessages();
            console.log('Database initialized and persistent messages loaded');
        });

        // Guild member add (Auto Join DM)
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleMemberJoin(member);
        });

        // Message create (Activity tracking & Persistent messages)
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            // Track user activity
            await this.trackUserActivity(message);
            
            // Handle persistent messages
            await this.handlePersistentMessage(message);
            
            // Handle commands
            if (message.content.startsWith('!')) {
                await this.handleCommand(message);
            }
        });

        // Interaction create (Role selection, buttons, etc.)
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isStringSelectMenu()) {
                await this.handleRoleSelection(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            } else if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            }
        });
    }

    async handleMemberJoin(member) {
        try {
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

    async handleCommand(message) {
        const args = message.content.slice(1).split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = this.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, this.database);
        } catch (error) {
            console.error('Error executing command:', error);
            message.reply('There was an error executing that command!');
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
        } catch (error) {
            console.error('Error loading persistent messages:', error);
        }
    }

    startScheduledTasks() {
        // Daily backup at 3 AM
        cron.schedule('0 3 * * *', async () => {
            console.log('Starting daily backup...');
            await this.backupManager.performBackup();
        });

        // Check YouTube every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            await this.youtubeMonitor.checkForNewVideos();
        });

        // Check Twitch every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.twitchMonitor.checkForLiveStreams();
        });
    }

    async start() {
        await this.client.login(process.env.DISCORD_TOKEN);
    }
}

// Start the bot
const bot = new ShopBot();
bot.start().catch(console.error);