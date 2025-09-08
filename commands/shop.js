// commands/shop.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'shop',
    description: 'Shop commands for transactions',
    
    async execute(message, args, database) {
        const subCommand = args[0];
        
        switch (subCommand) {
            case 'buy':
                await this.createTransaction(message, args, database);
                break;
                
            case 'history':
                await this.showHistory(message, database);
                break;
                
            case 'status':
                await this.checkStatus(message, args, database);
                break;
                
            default:
                await this.showHelp(message);
        }
    },

    async createTransaction(message, args, database) {
        try {
            // FIRST: Ensure user exists in database
            await database.addUser(message.author.id, message.author.username, message.author.discriminator);
            console.log(`User ${message.author.username} added/updated in database`);
            
            // THEN: Check if user is flagged as scammer
            const userInfo = await database.getUserInfo(message.author.id);
            if (userInfo?.is_scammer) {
                return message.reply('❌ You are not allowed to make transactions. Contact an administrator if you believe this is an error.');
            }
            
            const itemName = args[1];
            const quantity = parseInt(args[2]) || 1;
            const unitPrice = parseFloat(args[3]);
            
            if (!itemName || !unitPrice || isNaN(unitPrice)) {
                return message.reply('Usage: `!shop buy <item> [quantity] <price>`\nExample: `!shop buy DragonSword 1 25.99`');
            }
            
            if (quantity <= 0 || unitPrice <= 0) {
                return message.reply('❌ Quantity and price must be positive numbers!');
            }
            
            const totalAmount = quantity * unitPrice;
            
            console.log(`Creating transaction for user ${message.author.id}: ${itemName} x${quantity} @ $${unitPrice}`);
            
            // Create transaction (user definitely exists now)
            const transactionId = await database.addTransaction(
                message.author.id,
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
                    { name: 'Buyer', value: `<@${message.author.id}>`, inline: true }
                )
                .setColor('#00FF00')
                .setFooter({ text: 'Please wait for admin confirmation' })
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
            console.log(`Transaction ${transactionId} created successfully`);
            
        } catch (error) {
            console.error('Error in createTransaction:', error);
            await message.reply('❌ An error occurred while creating the transaction. Please try again or contact an administrator.');
        }
    },

    async showHistory(message, database) {
        try {
            // Ensure user exists
            await database.addUser(message.author.id, message.author.username, message.author.discriminator);
            
            const transactions = await database.getUserTransactions(message.author.id);
            
            if (transactions.length === 0) {
                return message.reply('📋 You have no transaction history.');
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
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in showHistory:', error);
            await message.reply('❌ An error occurred while fetching your transaction history.');
        }
    },

    async checkStatus(message, args, database) {
        try {
            const transactionId = parseInt(args[1]);
            
            if (!transactionId || isNaN(transactionId)) {
                return message.reply('Usage: `!shop status <transaction_id>`\nExample: `!shop status 1`');
            }
            
            // Ensure user exists
            await database.addUser(message.author.id, message.author.username, message.author.discriminator);
            
            const transactions = await database.getUserTransactions(message.author.id);
            const transaction = transactions.find(t => t.transaction_id === transactionId);
            
            if (!transaction) {
                return message.reply('❌ Transaction not found or you don\'t have permission to view it.');
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
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in checkStatus:', error);
            await message.reply('❌ An error occurred while checking transaction status.');
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
            case 'pending': return '#FFA500';  // Orange
            case 'completed': return '#00FF00';  // Green
            case 'failed': return '#FF0000';  // Red
            case 'disputed': return '#FFFF00';  // Yellow
            case 'cancelled': return '#808080';  // Gray
            default: return '#0099FF';  // Blue
        }
    },

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Shop Commands')
            .setDescription('Available shop commands:')
            .addFields(
                { name: '`!shop buy <item> [quantity] <price>`', value: 'Create a new transaction\nExample: `!shop buy DragonSword 1 25.99`' },
                { name: '`!shop history`', value: 'View your transaction history' },
                { name: '`!shop status <transaction_id>`', value: 'Check specific transaction status\nExample: `!shop status 1`' }
            )
            .setColor('#0099FF')
            .setFooter({ text: 'Need help? Contact an administrator!' });
            
        await message.reply({ embeds: [embed] });
    }
};
