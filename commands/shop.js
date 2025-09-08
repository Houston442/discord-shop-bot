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
        // Check if user is flagged as scammer
        const userInfo = await database.getUserInfo(message.author.id);
        if (userInfo?.is_scammer) {
            return message.reply('❌ You are not allowed to make transactions. Contact an administrator if you believe this is an error.');
        }
        
        const itemName = args[1];
        const quantity = parseInt(args[2]) || 1;
        const unitPrice = parseFloat(args[3]);
        
        if (!itemName || !unitPrice || isNaN(unitPrice)) {
            return message.reply('Usage: `!shop buy <item> [quantity] <price>`');
        }
        
        const totalAmount = quantity * unitPrice;
        
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
                { name: 'Unit Price', value: `$${unitPrice}`, inline: true },
                { name: 'Total Amount', value: `$${totalAmount}`, inline: true },
                { name: 'Status', value: 'Pending', inline: true }
            )
            .setColor('#00FF00')
            .setFooter({ text: 'Please wait for admin confirmation' });
            
        message.reply({ embeds: [embed] });
    },

    async showHistory(message, database) {
        const transactions = await database.getUserTransactions(message.author.id);
        
        if (transactions.length === 0) {
            return message.reply('You have no transaction history.');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📋 Your Transaction History')
            .setDescription(transactions.slice(0, 10).map(t => 
                `**ID:** ${t.transaction_id} | **Item:** ${t.item_name} | **Amount:** ${t.total_amount} | **Status:** ${t.status}`
            ).join('\n'))
            .setColor('#0099FF');
            
        message.reply({ embeds: [embed] });
    },

    async checkStatus(message, args, database) {
        const transactionId = parseInt(args[1]);
        
        if (!transactionId || isNaN(transactionId)) {
            return message.reply('Usage: `!shop status <transaction_id>`');
        }
        
        const transactions = await database.getUserTransactions(message.author.id);
        const transaction = transactions.find(t => t.transaction_id === transactionId);
        
        if (!transaction) {
            return message.reply('Transaction not found or you don\'t have permission to view it.');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Transaction Status')
            .addFields(
                { name: 'Transaction ID', value: transaction.transaction_id.toString(), inline: true },
                { name: 'Item', value: transaction.item_name, inline: true },
                { name: 'Status', value: transaction.status, inline: true },
                { name: 'Total Amount', value: `${transaction.total_amount}`, inline: true },
                { name: 'Date', value: transaction.timestamp.toLocaleDateString(), inline: true }
            )
            .setColor('#0099FF');
            
        message.reply({ embeds: [embed] });
    },

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Shop Commands')
            .addFields(
                { name: '`!shop buy <item> [quantity] <price>`', value: 'Create a new transaction' },
                { name: '`!shop history`', value: 'View your transaction history' },
                { name: '`!shop status <transaction_id>`', value: 'Check transaction status' }
            )
            .setColor('#0099FF');
            
        message.reply({ embeds: [embed] });
    }
};