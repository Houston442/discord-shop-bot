// commands/admin.js - Complete Clean Version with All Features
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for bot management')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // Transaction Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Create a new transaction for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User making the purchase')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Name of the item being purchased')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Total price of the transaction')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View transaction history')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View transactions for specific user (optional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check specific transaction status')
                .addIntegerOption(option =>
                    option.setName('transaction_id')
                        .setDescription('Transaction ID to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show top sellers leaderboard'))
        // User Management Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('syncmembers')
                .setDescription('Add all Discord server members to database'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('checkuser')
                .setDescription('View detailed user info, transactions, and activity')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Show server statistics and database overview'))
        // Basic Role Management Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('syncroles')
                .setDescription('Sync all Discord server roles to database'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listroles')
                .setDescription('List all server roles'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setautorole')
                .setDescription('Set role that gets auto-assigned to new members')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to auto-assign (or none to disable)')
                        .setRequired(false)))
        // Role Setup Management Commands
        .addSubcommandGroup(group =>
            group
                .setName('setuproles')
                .setDescription('Manage role selection menu configurations')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('create')
                        .setDescription('Create a new role setup configuration')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Name for this role setup')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('configure')
                        .setDescription('Configure embed appearance for a role setup')
                        .addIntegerOption(option =>
                            option.setName('setup_id')
                                .setDescription('Setup ID to configure')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('title')
                                .setDescription('Embed title')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('description')
                                .setDescription('Embed description (use \\n for line breaks)')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('color')
                                .setDescription('Embed color (hex format like #FF0000)')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('thumbnail')
                                .setDescription('Thumbnail image URL')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('image')
                                .setDescription('Main image URL')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('footer')
                                .setDescription('Footer text')
                                .setRequired(false)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('addrole')
                        .setDescription('Add a role option to a setup')
                        .addIntegerOption(option =>
                            option.setName('setup_id')
                                .setDescription('Setup ID to add role to')
                                .setRequired(true))
                        .addRoleOption(option =>
                            option.setName('role')
                                .setDescription('Discord role to add')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('label')
                                .setDescription('Display label for this role option')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('description')
                                .setDescription('Description for this role option')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('emoji')
                                .setDescription('Emoji for this role option (e.g., 🎮 or :custom_emoji:)')
                                .setRequired(false)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('removerole')
                        .setDescription('Remove a role option from a setup')
                        .addIntegerOption(option =>
                            option.setName('setup_id')
                                .setDescription('Setup ID to remove role from')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('option_number')
                                .setDescription('Option number to remove (use view command to see numbers)')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('List all role setup configurations'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('delete')
                        .setDescription('Delete a role setup configuration')
                        .addIntegerOption(option =>
                            option.setName('setup_id')
                                .setDescription('Setup ID to delete')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('view')
                        .setDescription('View detailed configuration of a role setup')
                        .addIntegerOption(option =>
                            option.setName('setup_id')
                                .setDescription('Setup ID to view')
                                .setRequired(true))))
        // Welcome Message Management Commands
        .addSubcommandGroup(group =>
            group
                .setName('welcome')
                .setDescription('Configure welcome message system')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('configure')
                        .setDescription('Configure welcome embed appearance')
                        .addStringOption(option =>
                            option.setName('title')
                                .setDescription('Welcome embed title')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('description')
                                .setDescription('Welcome message description (use \\n for line breaks)')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('color')
                                .setDescription('Embed color (hex format like #FF0000)')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('thumbnail')
                                .setDescription('Thumbnail image URL')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('image')
                                .setDescription('Main image URL')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('footer')
                                .setDescription('Footer text')
                                .setRequired(false)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('toggle')
                        .setDescription('Toggle between embed and text welcome messages')
                        .addBooleanOption(option =>
                            option.setName('use_embed')
                                .setDescription('True for embed, false for plain text')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('preview')
                        .setDescription('Preview the current welcome message'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('test')
                        .setDescription('Send yourself a test welcome message')))
        // Scammer Management Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('flagscammer')
                .setDescription('Flag user as scammer with optional reason')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to flag as scammer')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for flagging as scammer')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unflagscammer')
                .setDescription('Remove scammer flag from user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to unflag')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('scammerlist')
                .setDescription('Display all flagged scammers with notes'))
        // Legacy Bot Configuration Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('setwelcome')
                .setDescription('Set plain text welcome message (legacy)')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message to send to new members')
                        .setRequired(true)))
        .addSubcommandGroup(group =>
            group
                .setName('persistent')
                .setDescription('Manage persistent messages in channels')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('text')
                        .setDescription('Set a persistent text message in channel')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel for persistent message')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('message')
                                .setDescription('Message to keep persistent')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('embed')
                        .setDescription('Set a persistent embed message in channel')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel for persistent embed')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('title')
                                .setDescription('Embed title')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('description')
                                .setDescription('Embed description (use \\n for line breaks)')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('color')
                                .setDescription('Embed color (hex format like #FF0000)')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('thumbnail')
                                .setDescription('Thumbnail image URL')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('image')
                                .setDescription('Main image URL')
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('footer')
                                .setDescription('Footer text')
                                .setRequired(false)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove persistent message from channel')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel to remove persistent message from')
                                .setRequired(true))))
        // System Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup')
                .setDescription('Manually trigger database backup'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dbstats')
                .setDescription('Show detailed database statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('testdb')
                .setDescription('Test database connection'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Clean old messages/data (30+ days)')),
    
    async execute(interaction, database, bot) {
        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();
        
        // Handle setuproles subcommand group
        if (subcommandGroup === 'setuproles') {
            switch (subcommand) {
                case 'create':
                    await this.setuprolesCreate(interaction, database);
                    break;
                case 'configure':
                    await this.setuprolesConfigure(interaction, database);
                    break;
                case 'addrole':
                    await this.setuprolesAddRole(interaction, database);
                    break;
                case 'removerole':
                    await this.setuprolesRemoveRole(interaction, database);
                    break;
                case 'list':
                    await this.setuprolesList(interaction, database);
                    break;
                case 'delete':
                    await this.setuprolesDelete(interaction, database);
                    break;
                case 'view':
                    await this.setuprolesView(interaction, database);
                    break;
            }
            return;
        }
        
        // Handle welcome subcommand group
        if (subcommandGroup === 'welcome') {
            switch (subcommand) {
                case 'configure':
                    await this.welcomeConfigure(interaction, database);
                    break;
                case 'toggle':
                    await this.welcomeToggle(interaction, database);
                    break;
                case 'preview':
                    await this.welcomePreview(interaction, database);
                    break;
                case 'test':
                    await this.welcomeTest(interaction, database);
                    break;
            }
            return;
        }

        // Handle persistent subcommand group
        if (subcommandGroup === 'persistent') {
            switch (subcommand) {
                case 'text':
                    await this.setPersistentText(interaction, database);
                    break;
                case 'embed':
                    await this.setPersistentEmbed(interaction, database);
                    break;
                case 'remove':
                    await this.removePersistentChannel(interaction, database);
                    break;
            }
            return;
        }
        
        // Handle regular subcommands
        switch (subcommand) {
            // Transaction Commands
            case 'buy':
                await this.createTransaction(interaction, database);
                break;
            case 'history':
                await this.showHistory(interaction, database);
                break;
            case 'status':
                await this.checkTransactionStatus(interaction, database);
                break;
            case 'leaderboard':
                await this.showLeaderboard(interaction, database);
                break;
            // User Management Commands
            case 'syncmembers':
                await this.syncAllMembers(interaction, database);
                break;
            case 'checkuser':
                await this.checkUser(interaction, database);
                break;
            case 'stats':
                await this.showStats(interaction, database);
                break;
            // Role Management Commands
            case 'syncroles':
                await this.syncAllRoles(interaction, database);
                break;
            case 'listroles':
                await this.listRoles(interaction, database);
                break;
            case 'setautorole':
                await this.setAutoRole(interaction, database);
                break;
            // Scammer Management Commands
            case 'flagscammer':
                await this.flagScammer(interaction, database);
                break;
            case 'unflagscammer':
                await this.unflagScammer(interaction, database);
                break;
            case 'scammerlist':
                await this.listScammers(interaction, database);
                break;
            // Bot Configuration Commands
            case 'setwelcome':
                await this.setWelcomeMessage(interaction, database);
                break;
            case 'setpersistent':
                await this.setPersistentMessage(interaction, database);
                break;
            case 'removepersistent':
                await this.removePersistentChannel(interaction, database);
                break;
            // System Commands
            case 'backup':
                await this.manualBackup(interaction, database);
                break;
            case 'dbstats':
                await this.showDatabaseStats(interaction, database);
                break;
            case 'testdb':
                await this.testDatabase(interaction, database);
                break;
            case 'cleanup':
                await this.cleanupOldData(interaction, database);
                break;
        }
    },

    // ==================== ROLE SETUP MANAGEMENT METHODS ====================

    async setuprolesCreate(interaction, database) {
        try {
            const setupName = interaction.options.getString('name');
            
            const existingSetups = await database.getAllRoleSetups();
            if (existingSetups.some(setup => setup.setup_name.toLowerCase() === setupName.toLowerCase())) {
                return await interaction.reply('❌ A role setup with that name already exists. Please choose a different name.');
            }
            
            const setupId = await database.createRoleSetup(
                setupName,
                interaction.user.id,
                'Role Selection',
                'Select your roles from the dropdown below!',
                null, null, '#0099FF', null
            );
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Role Setup Created!')
                .setDescription(`**Setup Name:** ${setupName}\n**Setup ID:** ${setupId}`)
                .addFields(
                    { name: 'Next Steps', value: 
                      `🔧 Configure appearance: \`/admin setuproles configure ${setupId}\`\n` +
                      `🎭 Add role options: \`/admin setuproles addrole ${setupId}\`\n` +
                      `👀 Preview setup: \`/roles preview ${setupId}\`\n` +
                      `🚀 Deploy when ready: \`/roles deploy ${setupId}\``, inline: false },
                    { name: 'Default Settings', value: 
                      `**Title:** Role Selection\n` +
                      `**Description:** Select your roles from the dropdown below!\n` +
                      `**Color:** #0099FF\n` +
                      `**Role Options:** 0 (none added yet)`, inline: false }
                )
                .setColor('#00FF00');
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error creating role setup:', error);
            await interaction.reply('❌ Error creating role setup.');
        }
    },

    async setuprolesConfigure(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            const title = interaction.options.getString('title');
            let description = interaction.options.getString('description');
            const color = interaction.options.getString('color');
            const thumbnail = interaction.options.getString('thumbnail');
            const image = interaction.options.getString('image');
            const footer = interaction.options.getString('footer');
            
            if (description) {
                description = description.replace(/\\n/g, '\n');
            }
            
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            if (setup.created_by !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply('❌ You can only configure role setups that you created.');
            }
            
            const updateQuery = `
                UPDATE role_setups SET 
                    embed_title = COALESCE($2, embed_title),
                    embed_description = COALESCE($3, embed_description),
                    embed_color = COALESCE($4, embed_color),
                    embed_thumbnail_url = COALESCE($5, embed_thumbnail_url),
                    embed_image_url = COALESCE($6, embed_image_url),
                    embed_footer_text = COALESCE($7, embed_footer_text),
                    updated_at = CURRENT_TIMESTAMP
                WHERE setup_id = $1
            `;
            
            await database.pool.query(updateQuery, [setupId, title, description, color, thumbnail, image, footer]);
            
            const updatedSetup = await database.getRoleSetup(setupId);
            
            const changesText = [];
            if (title) changesText.push(`**Title:** ${title}`);
            if (description) changesText.push(`**Description:** Updated (${description.split('\n').length} lines)`);
            if (color) changesText.push(`**Color:** ${color}`);
            if (thumbnail) changesText.push(`**Thumbnail:** ${thumbnail}`);
            if (image) changesText.push(`**Image:** ${image}`);
            if (footer) changesText.push(`**Footer:** ${footer}`);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Role Setup Configuration Updated')
                .setDescription(`**Setup:** ${updatedSetup.setup_name} (ID: ${setupId})`)
                .addFields(
                    { name: 'Changes Made', value: changesText.length > 0 ? changesText.join('\n') : 'No changes specified', inline: false },
                    { name: 'Current Configuration', value: 
                      `**Title:** ${updatedSetup.embed_title || 'Role Selection'}\n` +
                      `**Description:** ${updatedSetup.embed_description ? (updatedSetup.embed_description.length > 100 ? updatedSetup.embed_description.substring(0, 100) + '...' : updatedSetup.embed_description) : 'Select your roles...'}\n` +
                      `**Color:** ${updatedSetup.embed_color || '#0099FF'}\n` +
                      `**Thumbnail:** ${updatedSetup.embed_thumbnail_url ? 'Set' : 'None'}\n` +
                      `**Image:** ${updatedSetup.embed_image_url ? 'Set' : 'None'}\n` +
                      `**Footer:** ${updatedSetup.embed_footer_text || 'None'}`, inline: false }
                )
                .setColor(updatedSetup.embed_color || '#0099FF');
            
            if (description) {
                embed.addFields({
                    name: 'Description Preview',
                    value: updatedSetup.embed_description.length > 500 ? 
                           updatedSetup.embed_description.substring(0, 500) + '...' : 
                           updatedSetup.embed_description,
                    inline: false
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error configuring role setup:', error);
            await interaction.reply('❌ Error configuring role setup. Check that color is in hex format (#FF0000) and URLs are valid.');
        }
    },

    async setuprolesAddRole(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            const role = interaction.options.getRole('role');
            const label = interaction.options.getString('label');
            const description = interaction.options.getString('description') || `Toggle the ${role.name} role`;
            const emoji = interaction.options.getString('emoji') || null;
            
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            if (setup.created_by !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply('❌ You can only modify role setups that you created.');
            }
            
            const existingOptions = await database.getRoleSetupOptions(setupId);
            if (existingOptions.some(option => option.discord_role_id === role.id)) {
                return await interaction.reply('❌ This role is already added to this setup.');
            }
            
            if (existingOptions.length >= 25) {
                return await interaction.reply('❌ Cannot add more than 25 role options per setup (Discord limit).');
            }
            
            await database.addServerRole(
                role.id, role.name, role.color, role.position,
                role.permissions.bitfield.toString(), role.hoist, role.mentionable, role.managed
            );
            
            await database.addRoleSetupOption(setupId, label, description, emoji, role.id, existingOptions.length + 1);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Role Option Added')
                .setDescription(`**Setup:** ${setup.setup_name} (ID: ${setupId})`)
                .addFields(
                    { name: 'Added Role Option', value: 
                      `${emoji || '🎭'} **${label}**\n` +
                      `**Role:** ${role}\n` +
                      `**Description:** ${description}\n` +
                      `**Position:** ${existingOptions.length + 1}`, inline: false },
                    { name: 'Setup Status', value: 
                      `**Total Options:** ${existingOptions.length + 1}/25\n` +
                      `**Ready to Deploy:** ${existingOptions.length + 1 > 0 ? 'Yes' : 'No'}`, inline: false }
                )
                .setColor(role.color || '#0099FF');
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error adding role option:', error);
            await interaction.reply('❌ Error adding role option.');
        }
    },

    async setuprolesRemoveRole(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            const optionNumber = interaction.options.getInteger('option_number');
            
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            if (setup.created_by !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply('❌ You can only modify role setups that you created.');
            }
            
            const existingOptions = await database.getRoleSetupOptions(setupId);
            
            if (optionNumber < 1 || optionNumber > existingOptions.length) {
                return await interaction.reply(`❌ Invalid option number. Use \`/admin setuproles view ${setupId}\` to see valid option numbers (1-${existingOptions.length}).`);
            }
            
            const optionToRemove = existingOptions[optionNumber - 1];
            
            await database.pool.query('DELETE FROM role_setup_options WHERE option_id = $1', [optionToRemove.option_id]);
            
            for (let i = optionNumber; i < existingOptions.length; i++) {
                await database.pool.query('UPDATE role_setup_options SET option_order = $1 WHERE option_id = $2', [i, existingOptions[i].option_id]);
            }
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Role Option Removed')
                .setDescription(`**Setup:** ${setup.setup_name} (ID: ${setupId})`)
                .addFields(
                    { name: 'Removed Role Option', value: 
                      `${optionToRemove.option_emoji || '🎭'} **${optionToRemove.option_label}**\n` +
                      `**Role:** ${optionToRemove.role_name || 'Unknown'}\n` +
                      `**Was Position:** ${optionNumber}`, inline: false },
                    { name: 'Setup Status', value: 
                      `**Total Options:** ${existingOptions.length - 1}/25\n` +
                      `**Ready to Deploy:** ${existingOptions.length - 1 > 0 ? 'Yes' : 'No'}`, inline: false }
                )
                .setColor('#FF9900');
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error removing role option:', error);
            await interaction.reply('❌ Error removing role option.');
        }
    },

    async setuprolesList(interaction, database) {
        try {
            const setups = await database.getAllRoleSetups();
            
            if (setups.length === 0) {
                return await interaction.reply('📋 No role setups found. Create one with `/admin setuproles create <name>`.');
            }
            
            const setupList = setups.map(setup => {
                const deployStatus = setup.channel_id ? '🟢 Deployed' : '🟡 Not Deployed';
                const createdDate = new Date(setup.created_at).toLocaleDateString();
                return `**${setup.setup_name}** (ID: ${setup.setup_id})\n` +
                       `Created by: ${setup.creator_name || 'Unknown'}\n` +
                       `Status: ${deployStatus}\n` +
                       `Created: ${createdDate}`;
            }).join('\n\n');
            
            const embed = new EmbedBuilder()
                .setTitle('🎭 Role Setup Configurations')
                .setDescription(setupList)
                .addFields(
                    { name: 'Available Commands', value: 
                      `\`/admin setuproles view <id>\` - View detailed configuration\n` +
                      `\`/admin setuproles configure <id>\` - Configure appearance\n` +
                      `\`/admin setuproles addrole <id>\` - Add role options\n` +
                      `\`/roles preview <id>\` - Preview before deploying\n` +
                      `\`/roles deploy <id>\` - Deploy to channel`, inline: false }
                )
                .setColor('#0099FF')
                .setFooter({ text: `${setups.length} total setups` });
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error listing role setups:', error);
            await interaction.reply('❌ Error retrieving role setups.');
        }
    },

    async setuprolesDelete(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            if (setup.created_by !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply('❌ You can only delete role setups that you created.');
            }
            
            if (setup.channel_id && setup.message_id) {
                try {
                    const channel = interaction.guild.channels.cache.get(setup.channel_id);
                    if (channel) {
                        const message = await channel.messages.fetch(setup.message_id);
                        if (message) await message.delete();
                    }
                } catch (error) {
                    console.log('Could not delete deployed message:', error.message);
                }
            }
            
            await database.deleteRoleSetup(setupId);
            
            await interaction.reply({
                content: `✅ **Role setup "${setup.setup_name}" deleted successfully!**\n` +
                        `${setup.channel_id ? 'Deployed message has also been removed.' : ''}`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error deleting role setup:', error);
            await interaction.reply('❌ Error deleting role setup.');
        }
    },

    async setuprolesView(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            const options = await database.getRoleSetupOptions(setupId);
            
            const embed = new EmbedBuilder()
                .setTitle(`🎭 Role Setup: ${setup.setup_name}`)
                .setDescription(`**Setup ID:** ${setupId}\n**Created by:** ${setup.creator_name || 'Unknown'}\n**Status:** ${setup.channel_id ? '🟢 Deployed' : '🟡 Not Deployed'}`)
                .addFields(
                    { name: 'Embed Configuration', value: 
                      `**Title:** ${setup.embed_title || 'Role Selection'}\n` +
                      `**Description:** ${(setup.embed_description || 'Select your roles...').substring(0, 200)}${setup.embed_description?.length > 200 ? '...' : ''}\n` +
                      `**Color:** ${setup.embed_color || '#0099FF'}\n` +
                      `**Thumbnail:** ${setup.embed_thumbnail_url ? 'Set' : 'None'}\n` +
                      `**Image:** ${setup.embed_image_url ? 'Set' : 'None'}\n` +
                      `**Footer:** ${setup.embed_footer_text || 'None'}`, inline: false }
                )
                .setColor(setup.embed_color || '#0099FF');
            
            if (options.length > 0) {
                const roleList = options.map((option, index) => 
                    `**${index + 1}.** ${option.option_emoji || '🎭'} **${option.option_label}**\n` +
                    `   Role: ${option.role_name || 'Unknown'}\n` +
                    `   Description: ${option.option_description || 'No description'}`
                ).join('\n\n');
                
                embed.addFields({ name: `Role Options (${options.length}/25)`, value: roleList });
            } else {
                embed.addFields({ name: 'Role Options (0/25)', value: 'No role options added yet. Use `/admin setuproles addrole` to add some.' });
            }
            
            if (setup.channel_id) {
                embed.addFields({ 
                    name: 'Deployment Info', 
                    value: `**Channel:** <#${setup.channel_id}>\n**Message ID:** ${setup.message_id || 'Unknown'}` 
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error viewing role setup:', error);
            await interaction.reply('❌ Error retrieving role setup details.');
        }
    },

    // ==================== WELCOME MESSAGE MANAGEMENT METHODS ====================

    async welcomeConfigure(interaction, database) {
        try {
            const title = interaction.options.getString('title');
            let description = interaction.options.getString('description');
            const color = interaction.options.getString('color');
            const thumbnail = interaction.options.getString('thumbnail');
            const image = interaction.options.getString('image');
            const footer = interaction.options.getString('footer');
            
            if (description) {
                description = description.replace(/\\n/g, '\n');
            }
            
            const changesText = [];
            
            if (title) {
                await database.setConfig('welcome_embed_title', title);
                changesText.push(`**Title:** ${title}`);
            }
            if (description) {
                await database.setConfig('welcome_embed_description', description);
                changesText.push(`**Description:** Updated (${description.split('\n').length} lines)`);
            }
            if (color) {
                await database.setConfig('welcome_embed_color', color);
                changesText.push(`**Color:** ${color}`);
            }
            if (thumbnail) {
                await database.setConfig('welcome_embed_thumbnail', thumbnail);
                changesText.push(`**Thumbnail:** Set`);
            }
            if (image) {
                await database.setConfig('welcome_embed_image', image);
                changesText.push(`**Image:** Set`);
            }
            if (footer) {
                await database.setConfig('welcome_embed_footer', footer);
                changesText.push(`**Footer:** ${footer}`);
            }
            
            const currentTitle = await database.getConfig('welcome_embed_title') || 'Welcome to the Server!';
            const currentDesc = await database.getConfig('welcome_embed_description') || 'Welcome!';
            const currentColor = await database.getConfig('welcome_embed_color') || '#00FF00';
            const currentThumbnail = await database.getConfig('welcome_embed_thumbnail');
            const currentImage = await database.getConfig('welcome_embed_image');
            const currentFooter = await database.getConfig('welcome_embed_footer');
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Welcome Message Configuration Updated')
                .addFields(
                    { name: 'Changes Made', value: changesText.length > 0 ? changesText.join('\n') : 'No changes specified', inline: false },
                    { name: 'Current Configuration', value: 
                      `**Title:** ${currentTitle}\n` +
                      `**Description:** ${currentDesc.length > 100 ? currentDesc.substring(0, 100) + '...' : currentDesc}\n` +
                      `**Color:** ${currentColor}\n` +
                      `**Thumbnail:** ${currentThumbnail ? 'Set' : 'None'}\n` +
                      `**Image:** ${currentImage ? 'Set' : 'None'}\n` +
                      `**Footer:** ${currentFooter || 'None'}`, inline: false }
                )
                .setColor(currentColor);
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error configuring welcome message:', error);
            await interaction.reply('❌ Error configuring welcome message. Check that color is in hex format (#FF0000) and URLs are valid.');
        }
    },

    async welcomeToggle(interaction, database) {
        try {
            const useEmbed = interaction.options.getBoolean('use_embed');
            
            await database.setConfig('welcome_use_embed', useEmbed.toString());
            
            const statusText = useEmbed ? 'Rich Embed Messages' : 'Plain Text Messages';
            const embed = new EmbedBuilder()
                .setTitle('✅ Welcome Message Format Updated')
                .setDescription(`Welcome messages will now be sent as: **${statusText}**`)
                .addFields({
                    name: 'Commands Available',
                    value: useEmbed ? 
                        '`/admin welcome configure` - Customize embed appearance\n`/admin welcome preview` - Preview current embed\n`/admin welcome test` - Test the welcome message' :
                        '`/admin setwelcome` - Set plain text message\n`/admin welcome toggle` - Switch back to embeds',
                    inline: false
                })
                .setColor(useEmbed ? '#00FF00' : '#FFA500');
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error toggling welcome format:', error);
            await interaction.reply('❌ Error updating welcome message format.');
        }
    },

    async welcomePreview(interaction, database) {
        try {
            const useEmbed = (await database.getConfig('welcome_use_embed')) === 'true';
            
            if (!useEmbed) {
                const textMessage = await database.getWelcomeMessage();
                const exampleMessage = textMessage
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                
                return await interaction.reply({
                    content: `**Current Welcome Message (Plain Text):**\n\n${exampleMessage}`,
                    ephemeral: true
                });
            }
            
            const title = await database.getConfig('welcome_embed_title') || 'Welcome to the Server!';
            const description = await database.getConfig('welcome_embed_description') || 'Welcome!';
            const color = await database.getConfig('welcome_embed_color') || '#00FF00';
            const thumbnail = await database.getConfig('welcome_embed_thumbnail');
            const image = await database.getConfig('welcome_embed_image');
            const footer = await database.getConfig('welcome_embed_footer');
            
            // Process variables for preview using the command user
            const processedTitle = title
                .replace(/{username}/g, interaction.user.username)
                .replace(/{avatar}/g, interaction.user.displayAvatarURL());
            const processedDescription = description
                .replace(/{username}/g, interaction.user.username)
                .replace(/{avatar}/g, interaction.user.displayAvatarURL());
            const processedFooter = footer ? footer
                .replace(/{username}/g, interaction.user.username)
                .replace(/{avatar}/g, interaction.user.displayAvatarURL()) : null;
            
            const embed = new EmbedBuilder()
                .setTitle(processedTitle)
                .setDescription(processedDescription)
                .setColor(color);
            
            if (thumbnail) {
                const processedThumbnail = thumbnail
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                embed.setThumbnail(processedThumbnail);
            } else {
                embed.setThumbnail(interaction.user.displayAvatarURL());
            }
            
            if (image) {
                const processedImage = image
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                embed.setImage(processedImage);
            }
            
            if (processedFooter) {
                embed.setFooter({ text: processedFooter });
            }
            
            await interaction.reply({
                content: '**Preview of Current Welcome Message (using your info as example):**',
                embeds: [embed],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error previewing welcome message:', error);
            await interaction.reply('❌ Error generating welcome message preview.');
        }
    },

    async welcomeTest(interaction, database) {
        try {
            const useEmbed = (await database.getConfig('welcome_use_embed')) === 'true';
            
            if (!useEmbed) {
                const textMessage = await database.getWelcomeMessage();
                const processedMessage = textMessage
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                await interaction.user.send(`**Test Welcome Message:**\n\n${processedMessage}`);
            } else {
                const title = await database.getConfig('welcome_embed_title') || 'Welcome to the Server!';
                const description = await database.getConfig('welcome_embed_description') || 'Welcome!';
                const color = await database.getConfig('welcome_embed_color') || '#00FF00';
                const thumbnail = await database.getConfig('welcome_embed_thumbnail');
                const image = await database.getConfig('welcome_embed_image');
                const footer = await database.getConfig('welcome_embed_footer');
                
                // Process variables for test using the command user
                const processedTitle = title
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                const processedDescription = description
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                const processedFooter = footer ? footer
                    .replace(/{username}/g, interaction.user.username)
                    .replace(/{avatar}/g, interaction.user.displayAvatarURL()) : null;
                
                const embed = new EmbedBuilder()
                    .setTitle(processedTitle)
                    .setDescription(processedDescription)
                    .setColor(color);
                
                if (thumbnail) {
                    const processedThumbnail = thumbnail
                        .replace(/{username}/g, interaction.user.username)
                        .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                    embed.setThumbnail(processedThumbnail);
                } else {
                    embed.setThumbnail(interaction.user.displayAvatarURL());
                }
                
                if (image) {
                    const processedImage = image
                        .replace(/{username}/g, interaction.user.username)
                        .replace(/{avatar}/g, interaction.user.displayAvatarURL());
                    embed.setImage(processedImage);
                }
                
                if (processedFooter) {
                    embed.setFooter({ text: processedFooter });
                }
                
                await interaction.user.send({ embeds: [embed] });
            }
            
            await interaction.reply({ content: '✅ Test welcome message sent to your DMs!', ephemeral: true });
            
        } catch (error) {
            console.error('Error sending test welcome:', error);
            await interaction.reply('❌ Error sending test message. Make sure your DMs are open.');
        }
    },

    // ==================== TRANSACTION METHODS ====================

    async createTransaction(interaction, database) {
        try {
            const user = interaction.options.getUser('user');
            const itemName = interaction.options.getString('item');
            const totalPrice = interaction.options.getNumber('price');
            
            await database.addUser(user.id, user.username, user.discriminator);
            await database.addUser(interaction.user.id, interaction.user.username, interaction.user.discriminator);
            
            const userInfo = await database.getUserInfo(user.id);
            if (userInfo?.is_scammer) {
                return await interaction.reply({ 
                    content: `❌ User <@${user.id}> is flagged as a scammer and cannot make transactions.`,
                    ephemeral: true 
                });
            }
            
            const transactionId = await database.addTransaction(
                user.id, itemName, 1, totalPrice, totalPrice, interaction.user.id
            );
            
            const completeButton = new ButtonBuilder()
                .setCustomId(`transaction_complete_${transactionId}`)
                .setLabel('Complete')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const cancelButton = new ButtonBuilder()
                .setCustomId(`transaction_cancel_${transactionId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const row = new ActionRowBuilder().addComponents(completeButton, cancelButton);
            
            const embed = new EmbedBuilder()
                .setTitle('🛒 New Transaction Created')
                .setDescription(`Transaction ID: ${transactionId}`)
                .addFields(
                    { name: 'Buyer', value: `<@${user.id}>`, inline: true },
                    { name: 'Item', value: itemName, inline: true },
                    { name: 'Price', value: `${totalPrice.toFixed(2)}`, inline: true },
                    { name: 'Status', value: '⏳ Pending', inline: true },
                    { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setColor('#FFA500')
                .setFooter({ text: 'Use the buttons below to complete or cancel this transaction' });
                
            await interaction.reply({ embeds: [embed], components: [row] });
            
        } catch (error) {
            console.error('Error in createTransaction:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while creating the transaction. Please try again.',
                ephemeral: true 
            });
        }
    },

    async showHistory(interaction, database) {
        try {
            const targetUser = interaction.options.getUser('user');
            let transactions, title;
            
            if (targetUser) {
                transactions = await database.getUserTransactions(targetUser.id);
                title = `📋 Transaction History for ${targetUser.username}`;
            } else {
                transactions = await database.getAllTransactions(20);
                title = '📋 All Recent Transactions';
            }
            
            if (transactions.length === 0) {
                const message = targetUser ? 
                    `📋 No transactions found for ${targetUser.username}.` : 
                    '📋 No transactions found.';
                return await interaction.reply(message);
            }
            
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(transactions.slice(0, 15).map(t => {
                    const status = this.getStatusEmoji(t.status);
                    const username = t.username || 'Unknown';
                    const createdBy = t.creator_username || 'Unknown';
                    return `**ID:** ${t.transaction_id} | **User:** ${username}\n` +
                           `**Item:** ${t.item_name} | **Amount:** ${parseFloat(t.total_amount).toFixed(2)}\n` +
                           `**Status:** ${status} ${t.status} | **Created by:** ${createdBy}\n` +
                           `**Date:** ${new Date(t.timestamp).toLocaleDateString()}`;
                }).join('\n\n'))
                .setColor('#0099FF')
                .setFooter({ text: `Showing ${Math.min(transactions.length, 15)} transactions` });
                
            if (transactions.length > 15) {
                embed.addFields({ 
                    name: 'Note', 
                    value: `${transactions.length - 15} more transactions not shown. Use /admin status with specific transaction ID for details.` 
                });
            }
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in showHistory:', error);
            await interaction.reply('❌ An error occurred while fetching transaction history.');
        }
    },

    async checkTransactionStatus(interaction, database) {
        try {
            const transactionId = interaction.options.getInteger('transaction_id');
            const transaction = await database.getTransactionById(transactionId);
            
            if (!transaction) {
                return await interaction.reply('❌ Transaction not found.');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Transaction Status')
                .addFields(
                    { name: 'Transaction ID', value: transaction.transaction_id.toString(), inline: true },
                    { name: 'Buyer', value: `<@${transaction.user_id}>`, inline: true },
                    { name: 'Username', value: transaction.username || 'Unknown', inline: true },
                    { name: 'Item', value: transaction.item_name, inline: true },
                    { name: 'Status', value: `${this.getStatusEmoji(transaction.status)} ${transaction.status}`, inline: true },
                    { name: 'Total Amount', value: `${parseFloat(transaction.total_amount).toFixed(2)}`, inline: true },
                    { name: 'Created By', value: transaction.creator_username || 'Unknown', inline: true },
                    { name: 'Date Created', value: new Date(transaction.timestamp).toLocaleDateString(), inline: true },
                    { name: 'Time Created', value: new Date(transaction.timestamp).toLocaleTimeString(), inline: true }
                )
                .setColor(this.getStatusColor(transaction.status));
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in checkTransactionStatus:', error);
            await interaction.reply('❌ An error occurred while checking transaction status.');
        }
    },

    async showLeaderboard(interaction, database) {
        try {
            const topSellers = await database.getTopSellers(10);
            
            if (topSellers.length === 0) {
                return await interaction.reply('📋 No sales data available yet.');
            }
            
            const leaderboardText = topSellers.map((seller, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${seller.username}** - ${seller.total_sales} sales (${parseFloat(seller.total_earned).toFixed(2)})`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle('🏆 Top Sellers Leaderboard')
                .setDescription(leaderboardText)
                .setColor('#FFD700')
                .setFooter({ text: `Showing top ${topSellers.length} sellers` });
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error showing leaderboard:', error);
            await interaction.reply('❌ Error retrieving leaderboard data.');
        }
    },

    // ==================== USER MANAGEMENT METHODS ====================

    async syncAllMembers(interaction, database) {
        try {
            await interaction.deferReply();
            
            const guild = interaction.guild;
            const members = await guild.members.fetch();
            
            let addedCount = 0, updatedCount = 0, skippedCount = 0, errorCount = 0;
            const totalMembers = members.size;
            const memberArray = Array.from(members.values());
            const batchSize = 50;

            for (let i = 0; i < memberArray.length; i += batchSize) {
                const batch = memberArray.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (member) => {
                    try {
                        if (member.user.bot) {
                            skippedCount++;
                            return;
                        }

                        const existingUser = await database.getUserInfo(member.user.id);
                        
                        if (existingUser) {
                            await database.updateUserInfo(member.user.id, member.user.username, member.user.discriminator);
                            updatedCount++;
                        } else {
                            await database.addUser(member.user.id, member.user.username, member.user.discriminator);
                            addedCount++;
                        }
                    } catch (error) {
                        console.error(`Error processing member ${member.user.username}:`, error);
                        errorCount++;
                    }
                }));

                const processed = Math.min(i + batchSize, memberArray.length);
                const progressPercent = Math.round((processed / totalMembers) * 100);
                
                if (i % 100 === 0 || processed === totalMembers) {
                    try {
                        await interaction.editReply(`🔄 Syncing members... ${processed}/${totalMembers} (${progressPercent}%)`);
                    } catch (editError) {
                        console.log('Could not edit status:', editError.message);
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Member Sync Complete!')
                .setDescription('All Discord members have been synchronized with the database.')
                .addFields(
                    { name: 'Total Members Processed', value: totalMembers.toString(), inline: true },
                    { name: 'New Users Added', value: addedCount.toString(), inline: true },
                    { name: 'Existing Users Updated', value: updatedCount.toString(), inline: true },
                    { name: 'Bots Skipped', value: skippedCount.toString(), inline: true },
                    { name: 'Errors', value: errorCount.toString(), inline: true }
                )
                .setColor('#00FF00');

            await interaction.editReply({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('Error in syncAllMembers:', error);
            const errorMessage = 'An error occurred during member sync.';
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    async checkUser(interaction, database) {
        const user = interaction.options.getUser('user');
        
        try {
            const userInfo = await database.getUserInfo(user.id);
            const transactions = await database.getUserTransactions(user.id);
            const activity = await database.getUserActivity(user.id);
            const sellerStats = await database.getSellerStats(user.id);
            
            if (!userInfo) {
                return await interaction.reply('❌ User not found in database!');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('👤 User Information')
                .setDescription(`<@${user.id}>`)
                .addFields(
                    { name: 'Username', value: userInfo.username, inline: true },
                    { name: 'Join Date', value: userInfo.join_date?.toLocaleDateString() || 'Unknown', inline: true },
                    { name: 'Last Activity', value: userInfo.last_activity?.toLocaleDateString() || 'Unknown', inline: true },
                    { name: 'Total Purchases', value: userInfo.total_purchases.toString(), inline: true },
                    { name: 'Total Spent', value: `${parseFloat(userInfo.total_spent).toFixed(2)}`, inline: true },
                    { name: 'Is Scammer', value: userInfo.is_scammer ? '⚠️ YES' : '✅ No', inline: true },
                    { name: 'Sales Created', value: sellerStats.total_sales?.toString() || '0', inline: true },
                    { name: 'Revenue Generated', value: `${parseFloat(sellerStats.total_earned || 0).toFixed(2)}`, inline: true }
                )
                .setColor(userInfo.is_scammer ? '#FF0000' : '#00FF00');
                
            if (userInfo.scammer_notes) {
                embed.addFields({ name: 'Scammer Notes', value: userInfo.scammer_notes, inline: false });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error checking user:', error);
            await interaction.reply('❌ Error retrieving user information.');
        }
    },

    async showStats(interaction, database) {
        try {
            const totalUsers = await database.getTotalUserCount();
            const activeUsers = await database.getUserCount();
            const scammers = await database.getAllScammers();
            const stats = await database.getDatabaseStats();

            const embed = new EmbedBuilder()
                .setTitle('📊 Server Statistics')
                .addFields(
                    { name: 'Total Users', value: totalUsers.toString(), inline: true },
                    { name: 'Active Users', value: activeUsers.toString(), inline: true },
                    { name: 'Flagged Scammers', value: scammers.length.toString(), inline: true },
                    { name: 'Total Transactions', value: stats.transactions_count?.toString() || '0', inline: true },
                    { name: 'Pending Transactions', value: stats.pending_transactions?.toString() || '0', inline: true },
                    { name: 'Total Revenue', value: `${(stats.total_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Sales Revenue', value: `${(stats.total_sales_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Server Roles', value: stats.server_roles_count?.toString() || '0', inline: true },
                    { name: 'Role Setups', value: stats.role_setups_count?.toString() || '0', inline: true }
                )
                .setColor('#0099FF');

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing stats:', error);
            await interaction.reply('❌ Error retrieving statistics.');
        }
    },

    // ==================== ROLE MANAGEMENT METHODS ====================

    async syncAllRoles(interaction, database) {
        try {
            await interaction.deferReply();
            
            const guild = interaction.guild;
            const roles = guild.roles.cache;
            
            let addedCount = 0, updatedCount = 0, errorCount = 0;
            const totalRoles = roles.size;
            
            for (const [roleId, role] of roles) {
                try {
                    const existingRoles = await database.getAllServerRoles();
                    const existingRole = existingRoles.find(r => r.role_id === role.id);
                    
                    await database.addServerRole(
                        role.id, role.name, role.color, role.position,
                        role.permissions.bitfield.toString(), role.hoist, role.mentionable, role.managed
                    );
                    
                    if (existingRole) {
                        updatedCount++;
                    } else {
                        addedCount++;
                    }
                    
                } catch (error) {
                    console.error(`Error processing role ${role.name}:`, error);
                    errorCount++;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Role Sync Complete!')
                .setDescription('All Discord server roles have been synchronized with the database.')
                .addFields(
                    { name: 'Total Roles Processed', value: totalRoles.toString(), inline: true },
                    { name: 'New Roles Added', value: addedCount.toString(), inline: true },
                    { name: 'Existing Roles Updated', value: updatedCount.toString(), inline: true },
                    { name: 'Errors', value: errorCount.toString(), inline: true }
                )
                .setColor('#00FF00');

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in syncAllRoles:', error);
            const errorMessage = 'An error occurred during role sync.';
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    async listRoles(interaction, database) {
        try {
            const roles = await database.getAssignableRoles();
            
            if (roles.length === 0) {
                return await interaction.reply('📋 No assignable roles found.');
            }
            
            const roleList = roles.slice(0, 20).map(role => {
                const managedStatus = role.is_managed ? '🤖 Managed' : '👤 Assignable';
                const hoistedStatus = role.is_hoisted ? '📌 Hoisted' : '';
                return `**${role.role_name}** ${hoistedStatus}\n` +
                       `ID: ${role.role_id} | Position: ${role.role_position} | ${managedStatus}`;
            }).join('\n\n');
            
            const embed = new EmbedBuilder()
                .setTitle('🎭 Server Roles')
                .setDescription(roleList)
                .setColor('#0099FF')
                .setFooter({ text: `Showing ${Math.min(roles.length, 20)} of ${roles.length} total roles` });
            
            if (roles.length > 20) {
                embed.addFields({ 
                    name: 'Note', 
                    value: `${roles.length - 20} more roles not shown. Excluded: @everyone and bot-managed roles.` 
                });
            }
                
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error listing roles:', error);
            await interaction.reply('❌ Error retrieving roles list.');
        }
    },

    async setAutoRole(interaction, database) {
        try {
            const role = interaction.options.getRole('role');
            
            if (!role) {
                await database.setAutoRole(null);
                return await interaction.reply('✅ Auto-role assignment disabled. New members will not receive any role automatically.');
            }
            
            await database.setAutoRole(role.name);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Auto-Role Updated')
                .setDescription(`New members will automatically receive the **${role.name}** role when they join the server.`)
                .addFields(
                    { name: 'Role', value: role.name, inline: true },
                    { name: 'Role ID', value: role.id, inline: true },
                    { name: 'Members with Role', value: role.members.size.toString(), inline: true }
                )
                .setColor(role.color || '#0099FF');
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error setting auto role:', error);
            await interaction.reply('❌ Error setting auto role.');
        }
    },

    // ==================== SCAMMER MANAGEMENT METHODS ====================

    async flagScammer(interaction, database) {
        try {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            // Flag the user and get their info
            const flaggedUser = await database.flagUserAsScammer(user.id, reason);
            
            // Create confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🚨 User Flagged as Scammer')
                .addFields(
                    { name: 'User', value: `<@${user.id}>`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Flagged by', value: interaction.user.username, inline: true }
                )
                .setColor('#FF0000');
            
            // Send confirmation to admin
            await interaction.reply({ embeds: [confirmEmbed] });
            
            // Send alert to scammer alert channel
            await this.sendScammerAlert(interaction, user, reason, flaggedUser?.username || user.username);
            
        } catch (error) {
            console.error('Error flagging scammer:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Error flagging user as scammer.', 
                    ephemeral: true 
                });
            }
        }
    },

    async sendScammerAlert(interaction, user, reason, username) {
        try {
            const scammerChannelId = process.env.SCAMMER_ALERT_CHANNEL_ID;
            if (!scammerChannelId) {
                console.log('No scammer alert channel configured (SCAMMER_ALERT_CHANNEL_ID not set)');
                return;
            }
            
            const alertChannel = interaction.client.channels.cache.get(scammerChannelId);
            if (!alertChannel) {
                console.log('Scammer alert channel not found');
                return;
            }
            
            // Create the simplified blacklist alert embed with profile pictures
            const alertEmbed = new EmbedBuilder()
                .setTitle(`${username} has been blacklisted`)
                .addFields(
                    { name: 'User', value: `<@${user.id}> (${user.id})`, inline: false },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setColor('#FF0000')
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ 
                    text: `Flagged by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
            
            // Send the alert (no @here ping)
            await alertChannel.send({ embeds: [alertEmbed] });
            
            console.log(`Scammer alert sent for ${username} (${user.id})`);
            
        } catch (error) {
            console.error('Error sending scammer alert:', error);
        }
    },

    async unflagScammer(interaction, database) {
        try {
            const user = interaction.options.getUser('user');
            
            await database.unflagUserAsScammer(user.id);
            
            // Send confirmation
            await interaction.reply(`✅ User <@${user.id}> has been unflagged successfully!`);
            
            // Optional: Send removal notification to scammer channel
            await this.sendScammerRemovalAlert(interaction, user);
            
        } catch (error) {
            console.error('Error unflagging scammer:', error);
            await interaction.reply({ 
                content: '❌ Error unflagging user.', 
                ephemeral: true 
            });
        }
    },

    async listScammers(interaction, database) {
        try {
            const scammers = await database.getAllScammers();
            
            if (scammers.length === 0) {
                return await interaction.reply('✅ No flagged scammers found!');
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🚨 Flagged Scammers')
                .setDescription(scammers.map(s => 
                    `<@${s.discord_id}> **(${s.username})**\n📝 ${s.scammer_notes || 'No notes provided'}`
                ).join('\n\n'))
                .setColor('#FF0000')
                .setFooter({ text: `${scammers.length} flagged scammers` });
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing scammers:', error);
            await interaction.reply('❌ Error retrieving scammers list.');
        }
    },

    // ==================== BOT CONFIGURATION METHODS ====================

    async setWelcomeMessage(interaction, database) {
        const message = interaction.options.getString('message');
        
        try {
            await database.setWelcomeMessage(message);
            await database.setConfig('welcome_use_embed', 'false');
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Welcome Message Updated (Plain Text Mode)')
                .setDescription('New welcome message:')
                .addFields({ name: 'Message', value: message })
                .setColor('#00FF00');
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting welcome message:', error);
            await interaction.reply('❌ Error updating welcome message.');
        }
    },

    async setPersistentMessage(interaction, database) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        
        try {
            await database.setPersistentChannel(channel.id, message);
            await interaction.reply(`✅ Persistent message set for <#${channel.id}>!`);
        } catch (error) {
            console.error('Error setting persistent message:', error);
            await interaction.reply('❌ Error setting persistent message.');
        }
    },

    async removePersistentChannel(interaction, database) {
        const channel = interaction.options.getChannel('channel');
        
        try {
            await database.removePersistentChannel(channel.id);
            await interaction.reply(`✅ Persistent message removed from <#${channel.id}>!`);
        } catch (error) {
            console.error('Error removing persistent channel:', error);
            await interaction.reply('❌ Error removing persistent message.');
        }
    },

    async setPersistentEmbed(interaction, database) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        let description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#0099FF';
        const thumbnail = interaction.options.getString('thumbnail');
        const image = interaction.options.getString('image');
        const footer = interaction.options.getString('footer');
        
        try {
            // Convert \n to actual line breaks
            if (description) {
                description = description.replace(/\\n/g, '\n');
            }
            
            await database.setPersistentChannelEmbed(channel.id, title, description, color, thumbnail, image, footer);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Persistent Embed Message Set')
                .setDescription(`Persistent embed configured for ${channel}`)
                .addFields(
                    { name: 'Title', value: title, inline: true },
                    { name: 'Color', value: color, inline: true },
                    { name: 'Description Preview', value: description.length > 100 ? description.substring(0, 100) + '...' : description, inline: false }
                )
                .setColor('#00FF00');
                
            if (thumbnail) embed.addFields({ name: 'Thumbnail', value: 'Set', inline: true });
            if (image) embed.addFields({ name: 'Image', value: 'Set', inline: true });
            if (footer) embed.addFields({ name: 'Footer', value: footer, inline: true });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error setting persistent embed:', error);
            await interaction.reply('❌ Error setting persistent embed. Check that color is in hex format and URLs are valid.');
        }
    },

    // ==================== SYSTEM METHODS ====================

    async manualBackup(interaction, database) {
        try {
            await interaction.deferReply();
            
            const backupData = await database.getBackupData();
            backupData.timestamp = new Date().toISOString();
            backupData.triggered_by = interaction.user.username;
            backupData.type = 'manual';
    
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `manual_backup_${timestamp}.json`;
            const backupJson = JSON.stringify(backupData, null, 2);
    
            // Get stats for the backup
            const stats = await database.getDatabaseStats();
            
            try {
                const backupChannelId = process.env.BACKUP_CHANNEL_ID;
                if (backupChannelId) {
                    const channel = interaction.client.channels.cache.get(backupChannelId);
                    if (channel) {
                        const fs = require('fs');
                        const path = require('path');
                        
                        // Create temp directory if it doesn't exist
                        const tempDir = './temp_backups';
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir, { recursive: true });
                        }
                        
                        // Write backup file
                        const filePath = path.join(tempDir, backupFileName);
                        fs.writeFileSync(filePath, backupJson);
                        
                        const fileStat = fs.statSync(filePath);
                        const fileSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);
                        
                        // Send to backup channel
                        await channel.send({
                            content: `📋 **Manual backup requested by ${interaction.user.username}**\n` +
                                    `Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}\n` +
                                    `Users: ${stats.users_count || 0} | Transactions: ${stats.transactions_count || 0} | Revenue: ${(stats.total_revenue || 0).toFixed(2)}\n` +
                                    `File Size: ${fileSizeMB} MB`,
                            files: [{
                                attachment: filePath,
                                name: backupFileName
                            }]
                        });
                        
                        // Clean up temp file
                        fs.unlinkSync(filePath);
                        
                        await interaction.editReply('✅ Manual backup completed and sent to backup channel!');
                    } else {
                        await interaction.editReply('✅ Manual backup completed, but backup channel not found.');
                    }
                } else {
                    await interaction.editReply('✅ Manual backup completed, but no backup channel configured (BACKUP_CHANNEL_ID not set).');
                }
            } catch (fileError) {
                console.error('Error sending manual backup file:', fileError);
                await interaction.editReply('✅ Manual backup data created, but failed to send file to backup channel.');
            }
    
        } catch (error) {
            console.error('Error creating manual backup:', error);
            await interaction.editReply('❌ Error creating backup.');
        }
    },

    async showDatabaseStats(interaction, database) {
        try {
            const stats = await database.getDatabaseStats();
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Database Statistics')
                .addFields(
                    { name: 'Users', value: `${stats.users_count || 0}`, inline: true },
                    { name: 'Transactions', value: `${stats.transactions_count || 0}`, inline: true },
                    { name: 'Messages', value: `${stats.messages_count || 0}`, inline: true },
                    { name: 'Server Roles', value: `${stats.server_roles_count || 0}`, inline: true },
                    { name: 'Role Setups', value: `${stats.role_setups_count || 0}`, inline: true },
                    { name: 'Scammers', value: `${stats.scammer_count || 0}`, inline: true },
                    { name: 'Purchase Revenue', value: `${(stats.total_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Sales Revenue', value: `${(stats.total_sales_revenue || 0).toFixed(2)}`, inline: true },
                    { name: 'Pending Transactions', value: `${stats.pending_transactions || 0}`, inline: true }
                )
                .setColor('#00FF99');

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing database stats:', error);
            await interaction.reply('❌ Error retrieving database statistics.');
        }
    },

    async testDatabase(interaction, database) {
        try {
            const startTime = Date.now();
            const isConnected = await database.testConnection();
            const responseTime = Date.now() - startTime;

            const embed = new EmbedBuilder()
                .setTitle('🔧 Database Test')
                .addFields(
                    { name: 'Status', value: isConnected ? '✅ Connected' : '❌ Failed', inline: true },
                    { name: 'Response Time', value: `${responseTime}ms`, inline: true }
                )
                .setColor(isConnected ? '#00FF00' : '#FF0000');

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error testing database:', error);
            await interaction.reply('❌ Database test failed.');
        }
    },

    async cleanupOldData(interaction, database) {
        try {
            await interaction.deferReply();
            
            const messagesResult = await database.pool.query(
                "DELETE FROM messages WHERE timestamp < NOW() - INTERVAL '30 days'"
            );
            
            const deletedMessages = messagesResult.rowCount;

            await interaction.editReply(`✅ Cleanup completed! Removed ${deletedMessages} old messages.`);

        } catch (error) {
            console.error('Error during cleanup:', error);
            await interaction.editReply('❌ Error during cleanup.');
        }
    },

    // ==================== UTILITY METHODS ====================

    getStatusEmoji(status) {
        switch (status.toLowerCase()) {
            case 'pending': return '⏳';
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'disputed': return '⚠️';
            case 'cancelled': return '🚫';
            default: return '❓';
        }
    },

    getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'pending': return '#FFA500';
            case 'completed': return '#00FF00';
            case 'failed': return '#FF0000';
            case 'disputed': return '#FFFF00';
            case 'cancelled': return '#808080';
            default: return '#0099FF';
        }
    }
};
