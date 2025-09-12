// commands/roles.js - Fixed Syntax Error
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup commands for bot features')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Create role selection menu')),
    
    async execute(interaction, database) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'roles':
                await this.setupRoleSelection(interaction);
                break;
        }
    },

    async setupRoleSelection(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🎭 Role Selection')
                .setDescription('Choose your roles from the dropdown below!')
                .setColor('#0099FF');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('role_select')
                .setPlaceholder('Select your roles...')
                .setMinValues(0)
                .setMaxValues(5)
                .addOptions([
                    {
                        label: 'Buyer',
                        description: 'Looking to purchase items',
                        value: 'Buyer',
                        emoji: '🛒'
                    },
                    {
                        label: 'Seller',
                        description: 'Looking to sell items',
                        value: 'Seller',
                        emoji: '💰'
                    },
                    {
                        label: 'Notifications',
                        description: 'Get notified about new items',
                        value: 'Notifications',
                        emoji: '🔔'
                    },
                    {
                        label: 'VIP',
                        description: 'VIP member access',
                        value: 'VIP',
                        emoji: '⭐'
                    },
                    {
                        label: 'Updates',
                        description: 'Get server updates',
                        value: 'Updates',
                        emoji: '📢'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
            
        } catch (error) {
            console.error('Error setting up role selection:', error);
            await interaction.reply({ 
                content: '❌ Error setting up role selection menu.',
                ephemeral: true 
            });
        }
    }
};
