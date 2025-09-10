// commands/shop.js - Slash Command Version
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Shop commands for transactions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Create a new transaction')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Name of the item to purchase')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Price per item')
                        .setRequired(true)
                        .setMinValue(0.01))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Quantity to purchase')
                        .setRequired(false)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View your transaction history'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check specific transaction status')
                .addIntegerOption(option =>
                    option.setName('transaction_id')
                        .setDescription('Transaction ID to check')
                        .setRequired(true))),
    
    async execute(interaction, database) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'buy':
                await this.createTransaction(interaction, database);
                break;
            case 'history':
                await this.showHistory(interaction, database);
                break;
            case 'status':
                await this.checkStatus(interaction, database);
                break;
        }
    },

    async createTransaction(interaction, database) {
        try {
            // Ensure user exists in database
            await database.addUser(interaction.user.id, interaction.user.username, interaction.user.discriminator);
            console.log(`User ${interaction.user.username} added/updated in database`);
            
            // Check if user is flagged as scammer
            const userInfo = await database.getUserInfo(interaction.user.id);
            if (userInfo?.is_scammer) {
                return await interaction.reply({ 
                    content: '❌ You are not allowed to make transactions. Contact an administrator if you believe this is an error.',
                    ephemeral: true 
                });
            }
            
            const itemName = interaction.options.getString('item');
            const unitPrice = interaction.options.getNumber('price');
            const quantity = interaction.options.getInteger('quantity') || 1;
            
            const totalAmount = quantity * unitPrice;
            
            console.log(`Creating transaction for user ${interaction.user.id}: ${itemName} x${quantity} @ $${unitPrice}`);
            
            const transactionId = await database.addTransaction(
                interaction.user.id,
                itemName,
                quantity,
                unitPrice,
                totalAmount
            );
            
            const embed = new EmbedBuilder()
                .setTitle('🛒 Transaction Created')
                .setDescription(`Transaction ID: ${transactionId}`)
                .addFields(
                    { name: 'Item', value: itemName, inline: true },
                    { name: 'Quantity', value: quantity.toString(), inline: true },
                    { name: 'Unit Price', value: `$${unitPrice.toFixed(2)}`, inline: true },
                    { name: 'Total Amount', value: `$${totalAmount.toFixed(2)}`, inline: true },
                    { name: 'Status', value: '⏳ Pending', inline: true },
                    { name: 'Buyer', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setColor('#00FF00')
                .setFooter({ text: 'Please wait for admin confirmation' })
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            console.log(`Transaction ${transactionId} created successfully`);
            
        } catch (error) {
            console.error('Error in createTransaction:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while creating the transaction. Please try again or contact an administrator.',
                ephemeral: true 
            });
        }
    },

    async showHistory(interaction, database) {
        try {
            // Ensure user exists
            await database.addUser(interaction.user.id, interaction.user.username, interaction.user.discriminator);
            
            const transactions = await database.getUserTransactions(interaction.user.id);
            
            if (transactions.length === 0) {
                return await interaction.reply({ 
                    content: '📋 You have no transaction history.',
                    ephemeral: true 
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📋 Your Transaction History')
                .setDescription(transactions.slice(0, 10).map(t => 
                    `**ID:** ${t.transaction_id} | **Item:** ${t.item_name} | **Amount:** $${parseFloat(t.total_amount).toFixed(2)} | **Status:** ${this.getStatusEmoji(t.status)} ${t.status}`
                ).join('\n'))
                .setColor('#0099FF')
                .setFooter({ text: `Showing last ${Math.min(transactions.length, 10)} transactions` })
                .setTimestamp();
                
            if (transactions.length > 10) {
                embed.addFields({ name: 'Note', value: `You have ${transactions.length - 10} more transactions not shown.` });
            }
                
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error in showHistory:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while fetching your transaction history.',
                ephemeral: true 
            });
        }
    },

    async checkStatus(interaction, database) {
        try {
            const transactionId = interaction.options.getInteger('transaction_id');
            
            // Ensure user exists
            await database.addUser(interaction.user.id, interaction.user.username, interaction.user.discriminator);
            
            const transactions = await database.getUserTransactions(interaction.user.id);
            const transaction = transactions.find(t => t.transaction_id === transactionId);
            
            if (!transaction) {
                return await interaction.reply({ 
                    content: '❌ Transaction not found or you don\'t have permission to view it.',
                    ephemeral: true 
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Transaction Status')
                .addFields(
                    { name: 'Transaction ID', value: transaction.transaction_id.toString(), inline: true },
                    { name: 'Item', value: transaction.item_name, inline: true },
                    { name: 'Status', value: `${this.getStatusEmoji(transaction.status)} ${transaction.status}`, inline: true },
                    { name: 'Quantity', value: transaction.quantity.toString(), inline: true },
                    { name: 'Unit Price', value: `$${parseFloat(transaction.unit_price).toFixed(2)}`, inline: true },
                    { name: 'Total Amount', value: `$${parseFloat(transaction.total_amount).toFixed(2)}`, inline: true },
                    { name: 'Date Created', value: new Date(transaction.timestamp).toLocaleDateString(), inline: true }
                )
                .setColor(this.getStatusColor(transaction.status))
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } catch (error) {
            console.error('Error in checkStatus:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while checking transaction status.',
                ephemeral: true 
            });
        }
    },

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
