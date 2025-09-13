// commands/roles.js - Role Deployment System
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Deploy and manage role selection menus')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy a role setup to a channel')
                .addIntegerOption(option =>
                    option.setName('setup_id')
                        .setDescription('ID of the role setup to deploy')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to deploy the role menu to')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview a role setup before deploying')
                .addIntegerOption(option =>
                    option.setName('setup_id')
                        .setDescription('ID of the role setup to preview')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('undeploy')
                .setDescription('Remove a deployed role menu')
                .addIntegerOption(option =>
                    option.setName('setup_id')
                        .setDescription('ID of the role setup to undeploy')
                        .setRequired(true))),
    
    async execute(interaction, database) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'deploy':
                await this.deployRoleSetup(interaction, database);
                break;
            case 'preview':
                await this.previewRoleSetup(interaction, database);
                break;
            case 'undeploy':
                await this.undeployRoleSetup(interaction, database);
                break;
        }
    },

    async deployRoleSetup(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
            
            // Get the role setup
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            // Get the role options
            const options = await database.getRoleSetupOptions(setupId);
            if (options.length === 0) {
                return await interaction.reply('❌ No role options found for this setup.');
            }
            
            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle(setup.embed_title || 'Role Selection')
                .setDescription(setup.embed_description || 'Select your roles from the dropdown below!')
                .setColor(setup.embed_color || '#0099FF');
                
            if (setup.embed_thumbnail_url) {
                embed.setThumbnail(setup.embed_thumbnail_url);
            }
            
            if (setup.embed_image_url) {
                embed.setImage(setup.embed_image_url);
            }
            
            if (setup.embed_footer_text) {
                embed.setFooter({ text: setup.embed_footer_text });
            }
            
            // Create the select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`role_setup_${setupId}`)
                .setPlaceholder('Select your roles...')
                .setMinValues(0)
                .setMaxValues(options.length);
                
            // Add options to the select menu
            for (const option of options) {
                selectMenu.addOptions({
                    label: option.option_label,
                    description: option.option_description || 'Toggle this role',
                    value: option.option_id.toString(),
                    emoji: option.option_emoji || undefined
                });
            }
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            // Send the role menu
            const message = await targetChannel.send({
                embeds: [embed],
                components: [row]
            });
            
            // Update the setup with deployment info
            await database.updateRoleSetupDeployment(setupId, targetChannel.id, message.id);
            
            // Send confirmation
            await interaction.reply({
                content: `✅ **Role setup "${setup.setup_name}" deployed successfully!**\n` +
                        `📍 **Channel:** ${targetChannel}\n` +
                        `🆔 **Message ID:** ${message.id}\n` +
                        `🎭 **Role Options:** ${options.length}`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error deploying role setup:', error);
            await interaction.reply('❌ Error deploying role setup.');
        }
    },

    async previewRoleSetup(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            
            // Get the role setup
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            // Get the role options
            const options = await database.getRoleSetupOptions(setupId);
            if (options.length === 0) {
                return await interaction.reply('❌ No role options found for this setup.');
            }
            
            // Create the preview embed
            const embed = new EmbedBuilder()
                .setTitle(setup.embed_title || 'Role Selection')
                .setDescription(setup.embed_description || 'Select your roles from the dropdown below!')
                .setColor(setup.embed_color || '#0099FF');
                
            if (setup.embed_thumbnail_url) {
                embed.setThumbnail(setup.embed_thumbnail_url);
            }
            
            if (setup.embed_image_url) {
                embed.setImage(setup.embed_image_url);
            }
            
            if (setup.embed_footer_text) {
                embed.setFooter({ text: setup.embed_footer_text });
            }
            
            // Create options preview text
            const optionsText = options.map((option, index) => 
                `${option.option_emoji || '🎭'} **${option.option_label}** - ${option.option_description || 'Toggle this role'}\n` +
                `   → Role: ${option.role_name || 'Unknown'}`
            ).join('\n\n');
            
            // Send preview
            await interaction.reply({
                content: `🔍 **Preview of Role Setup "${setup.setup_name}"**\n\n` +
                        `**Setup ID:** ${setupId}\n` +
                        `**Status:** ${setup.channel_id ? '🟢 Deployed' : '🟡 Not Deployed'}\n` +
                        `**Role Options:** ${options.length}\n\n` +
                        `**Embed Preview:**`,
                embeds: [embed],
                ephemeral: true
            });
            
            await interaction.followUp({
                content: `**Role Options:**\n${optionsText}\n\n` +
                        `💡 Use \`/roles deploy ${setupId}\` to deploy this setup to a channel.`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error previewing role setup:', error);
            await interaction.reply('❌ Error previewing role setup.');
        }
    },

    async undeployRoleSetup(interaction, database) {
        try {
            const setupId = interaction.options.getInteger('setup_id');
            
            // Get the role setup
            const setup = await database.getRoleSetup(setupId);
            if (!setup) {
                return await interaction.reply('❌ Role setup not found.');
            }
            
            if (!setup.channel_id || !setup.message_id) {
                return await interaction.reply('❌ This role setup is not currently deployed.');
            }
            
            // Try to delete the deployed message
            try {
                const channel = interaction.guild.channels.cache.get(setup.channel_id);
                if (channel) {
                    const message = await channel.messages.fetch(setup.message_id);
                    if (message) {
                        await message.delete();
                    }
                }
            } catch (error) {
                console.log('Could not delete deployed message (may have been deleted manually):', error.message);
            }
            
            // Clear deployment info from database
            await database.updateRoleSetupDeployment(setupId, null, null);
            
            await interaction.reply({
                content: `✅ **Role setup "${setup.setup_name}" undeployed successfully!**\n` +
                        `The role menu has been removed from the channel.`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error undeploying role setup:', error);
            await interaction.reply('❌ Error undeploying role setup.');
        }
    }
};
