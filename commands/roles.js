// commands/roles.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'setup',
    description: 'Setup commands for bot features',
    
    async execute(message, args, database) {
        // Check if user has admin permissions
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('You need administrator permissions to use this command!');
        }

        const subCommand = args[0];
        
        switch (subCommand) {
            case 'roles':
                await this.setupRoleSelection(message);
                break;
                
            default:
                await this.showHelp(message);
        }
    },

    async setupRoleSelection(message) {
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
        
        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
        
        message.delete().catch(() => {});
    },

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Setup Commands')
            .addFields(
                { name: '`!setup roles`', value: 'Create role selection menu' }
            )
            .setColor('#0099FF');
            
        message.reply({ embeds: [embed] });
    }
};