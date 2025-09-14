// bot.js - Complete Clean Version with Welcome Variables System
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const { Pool } = require('pg');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Database = require('./database/connection');
const BackupManager = require('./utils/backupManager');

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
            
            this.client.user.setStatus('online');
            this.client.user.setActivity('Managing the shop', { type: 3 });
            
            try {
                await this.database.initialize();
                await this.loadPersistentMessages();
                await this.syncAllRolesOnStartup();
                await this.registerSlashCommands();
                console.log('Database initialized, roles synced, persistent messages loaded, and slash commands registered');
            } catch (error) {
                console.error('Error during bot initialization:', error);
            }
        });

        // Guild member add (Auto Join DM + Auto Role)
        this.client.on('guildMemberAdd', async (member) => {
            await this.handleMemberJoin(member);
        });

        // Role events for automatic syncing
        this.client.on('roleCreate', async (role) => {
            await this.handleRoleCreate(role);
        });

        this.client.on('roleUpdate', async (oldRole, newRole) => {
            await this.handleRoleUpdate(oldRole, newRole);
        });

        this.client.on('roleDelete', async (role) => {
            await this.handleRoleDelete(role);
        });

        // Message create (Activity tracking & Persistent messages)
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            await this.trackUserActivity(message);
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
        // SECURITY CHECK: Only allow commands in the specified guild
        const allowedGuildId = process.env.GUILD_ID || process.env.ALLOWED_GUILD_ID;
        
        if (!allowedGuildId) {
            console.error('SECURITY WARNING: No GUILD_ID set in environment variables!');
            return await interaction.reply({ 
                content: 'Bot configuration error. Contact administrator.', 
                ephemeral: true 
            });
        }
        
        // Block commands in DMs
        if (!interaction.guild) {
            return await interaction.reply({ 
                content: '❌ Commands can only be used in the server, not in DMs.', 
                ephemeral: true 
            });
        }
        
        // Block commands in wrong servers
        if (interaction.guild.id !== allowedGuildId) {
            console.log(`Blocked command attempt from unauthorized guild: ${interaction.guild.id} (${interaction.guild.name})`);
            return await interaction.reply({ 
                content: '❌ This bot is not authorized for use in this server.', 
                ephemeral: true 
            });
        }
        
        const command = this.commands.get(interaction.commandName);
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    
        try {
            await command.execute(interaction, this.database, this);
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
            
            // Auto-assign role
            await this.assignAutoRole(member);
            
            // Check if using embed or text welcome
            const useEmbed = (await this.database.getConfig('welcome_use_embed')) === 'true';
            
            if (useEmbed) {
                // Send embed welcome message
                await this.sendEmbedWelcome(member);
            } else {
                // Send text welcome message (legacy)
                await this.sendTextWelcome(member);
            }
            
            console.log(`Sent welcome message to ${member.user.tag}`);
            
        } catch (error) {
            console.error('Error handling member join:', error);
        }
    }

    // Process welcome message variables
    processWelcomeVariables(text, member) {
        if (!text) return text;
        
        return text
            .replace(/{username}/g, member.user.username)
            .replace(/{avatar}/g, member.user.displayAvatarURL());
    }

    async sendEmbedWelcome(member) {
        const title = await this.database.getConfig('welcome_embed_title') || 'Welcome to the Server!';
        const description = await this.database.getConfig('welcome_embed_description') || 'Welcome!';
        const color = await this.database.getConfig('welcome_embed_color') || '#00FF00';
        const thumbnail = await this.database.getConfig('welcome_embed_thumbnail');
        const image = await this.database.getConfig('welcome_embed_image');
        const footer = await this.database.getConfig('welcome_embed_footer');
        
        // Process variables in title and description
        const processedTitle = this.processWelcomeVariables(title, member);
        const processedDescription = this.processWelcomeVariables(description, member);
        const processedFooter = footer ? this.processWelcomeVariables(footer, member) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(processedTitle)
            .setDescription(processedDescription)
            .setColor(color);
        
        // Handle thumbnail - use {avatar} variable or default to user avatar
        if (thumbnail) {
            const processedThumbnail = this.processWelcomeVariables(thumbnail, member);
            embed.setThumbnail(processedThumbnail);
        } else {
            embed.setThumbnail(member.user.displayAvatarURL());
        }
        
        // Handle image - process variables if set
        if (image) {
            const processedImage = this.processWelcomeVariables(image, member);
            embed.setImage(processedImage);
        }
        
        if (processedFooter) {
            embed.setFooter({ text: processedFooter });
        }
        
        await member.send({ embeds: [embed] });
    }

    async sendTextWelcome(member) {
        const welcomeMessage = await this.database.getWelcomeMessage();
        const processedMessage = this.processWelcomeVariables(welcomeMessage || 'Welcome! Thanks for joining our server.', member);
        
        const embed = new EmbedBuilder()
            .setTitle('Welcome to the Server!')
            .setDescription(processedMessage)
            .setColor('#00FF00')
            .setThumbnail(member.user.displayAvatarURL());

        await member.send({ embeds: [embed] });
    }

    async assignAutoRole(member) {
        try {
            const autoRoleName = await this.database.getAutoRole();
            if (!autoRoleName) {
                console.log('No auto-role configured');
                return;
            }

            const role = member.guild.roles.cache.find(r => r.name === autoRoleName);
            if (!role) {
                console.log(`Auto-role "${autoRoleName}" not found in server`);
                return;
            }

            await member.roles.add(role);
            console.log(`Assigned auto-role "${autoRoleName}" to ${member.user.username}`);
            
        } catch (error) {
            console.error('Error assigning auto role:', error);
        }
    }

    async syncAllRolesOnStartup() {
        try {
            const guilds = this.client.guilds.cache;
            for (const [guildId, guild] of guilds) {
                await this.syncGuildRoles(guild);
            }
        } catch (error) {
            console.error('Error syncing roles on startup:', error);
        }
    }

    async syncGuildRoles(guild) {
        try {
            const roles = guild.roles.cache;
            for (const [roleId, role] of roles) {
                await this.database.addServerRole(
                    role.id,
                    role.name,
                    role.color,
                    role.position,
                    role.permissions.bitfield.toString(),
                    role.hoist,
                    role.mentionable,
                    role.managed
                );
            }
            console.log(`Synced ${roles.size} roles for guild ${guild.name}`);
        } catch (error) {
            console.error('Error syncing guild roles:', error);
        }
    }

    async handleRoleCreate(role) {
        try {
            await this.database.addServerRole(
                role.id,
                role.name,
                role.color,
                role.position,
                role.permissions.bitfield.toString(),
                role.hoist,
                role.mentionable,
                role.managed
            );
            console.log(`Role created and synced: ${role.name}`);
        } catch (error) {
            console.error('Error handling role create:', error);
        }
    }

    async handleRoleUpdate(oldRole, newRole) {
        try {
            await this.database.addServerRole(
                newRole.id,
                newRole.name,
                newRole.color,
                newRole.position,
                newRole.permissions.bitfield.toString(),
                newRole.hoist,
                newRole.mentionable,
                newRole.managed
            );
            console.log(`Role updated and synced: ${newRole.name}`);
        } catch (error) {
            console.error('Error handling role update:', error);
        }
    }

    async handleRoleDelete(role) {
        try {
            await this.database.removeServerRole(role.id);
            console.log(`Role deleted and removed from database: ${role.name}`);
        } catch (error) {
            console.error('Error handling role delete:', error);
        }
    }

    async trackUserActivity(message) {
        try {
            await this.database.addUser(message.author.id, message.author.username, message.author.discriminator);
            
            if (message.content.startsWith('!') || message.content.startsWith('/')) {
                await this.database.logMessage(
                    message.id,
                    message.author.id,
                    message.channel.id,
                    message.content.substring(0, 500),
                    message.content.startsWith('!') ? message.content.split(' ')[0] : null
                );
            } else {
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

            if (this.persistentMessages.has(message.channel.id)) {
                const oldMessage = this.persistentMessages.get(message.channel.id);
                try {
                    await oldMessage.delete();
                } catch (error) {
                    console.log('Could not delete old persistent message:', error.message);
                }
            }

            let newMessage;
            
            if (channelConfig.message_type === 'embed') {
                // Create embed from stored configuration
                const embed = new EmbedBuilder()
                    .setTitle(channelConfig.embed_title || 'Persistent Message')
                    .setDescription(channelConfig.embed_description || 'Default description')
                    .setColor(channelConfig.embed_color || '#0099FF');
                    
                if (channelConfig.embed_thumbnail_url) {
                    embed.setThumbnail(channelConfig.embed_thumbnail_url);
                }
                
                if (channelConfig.embed_image_url) {
                    embed.setImage(channelConfig.embed_image_url);
                }
                
                if (channelConfig.embed_footer_text) {
                    embed.setFooter({ text: channelConfig.embed_footer_text });
                }
                
                newMessage = await message.channel.send({ embeds: [embed] });
            } else {
                // Send text message (legacy)
                const embed = new EmbedBuilder()
                    .setDescription(channelConfig.message_content || channelConfig.message)
                    .setColor('#0099FF');
                    
                newMessage = await message.channel.send({ embeds: [embed] });
            }
            
            this.persistentMessages.set(message.channel.id, newMessage);
            
        } catch (error) {
            console.error('Error handling persistent message:', error);
        }
    }

    async handleRoleSelection(interaction) {
        try {
            if (interaction.customId.startsWith('role_setup_')) {
                const setupId = interaction.customId.split('_')[2];
                const selectedValues = interaction.values; // Array of selected option IDs
                
                const options = await this.database.getRoleSetupOptions(setupId);
                
                if (options.length === 0) {
                    return await interaction.reply({ content: 'No role options found for this setup!', ephemeral: true });
                }
                
                const member = interaction.member;
                const guild = interaction.guild;
                
                // Get all roles from this setup that the member currently has
                const setupRoleIds = options.map(opt => opt.discord_role_id);
                const currentSetupRoles = member.roles.cache.filter(role => setupRoleIds.includes(role.id));
                
                // Get the roles that should be assigned (based on selection)
                const selectedOptions = options.filter(opt => selectedValues.includes(opt.option_id.toString()));
                const selectedRoleIds = selectedOptions.map(opt => opt.discord_role_id);
                
                let addedRoles = [];
                let removedRoles = [];
                
                // Add roles that are selected but not currently assigned
                for (const option of selectedOptions) {
                    const role = guild.roles.cache.get(option.discord_role_id);
                    if (role && !member.roles.cache.has(role.id)) {
                        try {
                            await member.roles.add(role);
                            addedRoles.push(role.name);
                        } catch (error) {
                            console.error(`Failed to add role ${role.name}:`, error);
                        }
                    }
                }
                
                // Remove roles that are currently assigned but not selected
                for (const [roleId, role] of currentSetupRoles) {
                    if (!selectedRoleIds.includes(roleId)) {
                        try {
                            await member.roles.remove(role);
                            removedRoles.push(role.name);
                        } catch (error) {
                            console.error(`Failed to remove role ${role.name}:`, error);
                        }
                    }
                }
                
                // Create response message
                let responseMessage = '';
                
                if (addedRoles.length > 0) {
                    responseMessage += `✅ **Added:** ${addedRoles.join(', ')}\n`;
                }
                
                if (removedRoles.length > 0) {
                    responseMessage += `❌ **Removed:** ${removedRoles.join(', ')}\n`;
                }
                
                if (addedRoles.length === 0 && removedRoles.length === 0) {
                    responseMessage = '✨ **No changes** - Your roles are already up to date!';
                }
                
                // Add current roles info
                const currentRoles = member.roles.cache
                    .filter(role => setupRoleIds.includes(role.id))
                    .map(role => role.name);
                    
                if (currentRoles.length > 0) {
                    responseMessage += `\n🎭 **Current roles from this menu:** ${currentRoles.join(', ')}`;
                }
                
                await interaction.reply({ content: responseMessage, ephemeral: true });
                
            } else {
                // Handle legacy role selection (if any old role menus exist)
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
            }
        } catch (error) {
            console.error('Error handling role selection:', error);
            await interaction.reply({ content: 'Error processing role selection!', ephemeral: true });
        }
    }

    async handleButtonInteraction(interaction) {
        try {
            if (interaction.customId.startsWith('transaction_')) {
                await this.handleTransactionButton(interaction);
            } else {
                await interaction.reply({ content: 'Button interaction received!', ephemeral: true });
            }
        } catch (error) {
            console.error('Error handling button interaction:', error);
            await interaction.reply({ content: 'Error processing button interaction!', ephemeral: true });
        }
    }

    async handleTransactionButton(interaction) {
        try {
            const [, action, transactionId] = interaction.customId.split('_');
            const transaction = await this.database.getTransactionById(parseInt(transactionId));

            if (!transaction) {
                return await interaction.reply({ content: 'Transaction not found!', ephemeral: true });
            }

            let newStatus = '';
            let statusColor = '';
            let statusEmoji = '';

            if (action === 'complete') {
                newStatus = 'completed';
                statusColor = '#00FF00';
                statusEmoji = '✅';
            } else if (action === 'cancel') {
                newStatus = 'cancelled';
                statusColor = '#808080';
                statusEmoji = '🚫';
            }

            await this.database.updateTransactionStatus(parseInt(transactionId), newStatus);

            const updatedEmbed = new EmbedBuilder()
                .setTitle('🛒 Transaction Updated')
                .setDescription(`Transaction ID: ${transactionId}`)
                .setColor(statusColor)
                .setFooter({ text: `Transaction ${newStatus} by ${interaction.user.username}` });

            await interaction.update({ embeds: [updatedEmbed], components: [] });

            console.log(`Transaction ${transactionId} ${newStatus} by ${interaction.user.username}`);

        } catch (error) {
            console.error('Error handling transaction button:', error);
            await interaction.reply({ content: 'Error updating transaction status!', ephemeral: true });
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
                
                const backupData = await this.database.getBackupData();
                backupData.timestamp = new Date().toISOString();
                backupData.triggered_by = 'Automated Daily Backup';
                backupData.type = 'automatic';
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `daily_backup_${timestamp}.json`;
                const backupJson = JSON.stringify(backupData, null, 2);
                
                console.log('=== DAILY BACKUP COMPLETED SUCCESSFULLY ===');
                
                try {
                    const backupChannelId = process.env.BACKUP_CHANNEL_ID;
                    if (backupChannelId) {
                        const channel = this.client.channels.cache.get(backupChannelId);
                        if (channel) {
                            const stats = await this.database.getDatabaseStats();
                            
                            const tempDir = './temp_backups';
                            
                            if (!fs.existsSync(tempDir)) {
                                fs.mkdirSync(tempDir, { recursive: true });
                            }
                            
                            const filePath = path.join(tempDir, backupFileName);
                            fs.writeFileSync(filePath, backupJson);
                            
                            const fileStat = fs.statSync(filePath);
                            const fileSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);
                            
                            await channel.send({
                                content: `✅ **Daily backup completed successfully**\n` +
                                        `Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}\n` +
                                        `Users: ${stats.users_count || 0} | Transactions: ${stats.transactions_count || 0} | Revenue: ${(stats.total_revenue || 0).toFixed(2)}\n` +
                                        `File Size: ${fileSizeMB} MB`,
                                files: [{
                                    attachment: filePath,
                                    name: backupFileName
                                }]
                            });
                            
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

        console.log('Scheduled tasks initialized:');
        console.log('- Daily backup: Every day at midnight BST/GMT (00:00 UTC)');
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

// Create and start the bot
const bot = new ShopBot();

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    if (bot) {
        await bot.shutdown();
    }
    process.exit(0);
});

// Start the bot
bot.start();
