// database/connection.js
const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    async initialize() {
        try {
            await this.createTables();
            console.log('Database tables created successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    async createTables() {
        const queries = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                discord_id VARCHAR(20) PRIMARY KEY,
                username VARCHAR(32) NOT NULL,
                discriminator VARCHAR(4),
                join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_purchases INTEGER DEFAULT 0,
                total_spent DECIMAL(10,2) DEFAULT 0,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_scammer BOOLEAN DEFAULT FALSE,
                scammer_notes TEXT
            )`,

            // Transactions table
            `CREATE TABLE IF NOT EXISTS transactions (
                transaction_id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) REFERENCES users(discord_id),
                item_name VARCHAR(255) NOT NULL,
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Messages/Activity table
            `CREATE TABLE IF NOT EXISTS messages (
                message_id VARCHAR(20) PRIMARY KEY,
                user_id VARCHAR(20) REFERENCES users(discord_id),
                channel_id VARCHAR(20) NOT NULL,
                content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                command_used VARCHAR(50)
            )`,

            // Bot configuration table
            `CREATE TABLE IF NOT EXISTS bot_config (
                config_key VARCHAR(50) PRIMARY KEY,
                config_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Role selection configuration
            `CREATE TABLE IF NOT EXISTS role_configs (
                id SERIAL PRIMARY KEY,
                channel_id VARCHAR(20) NOT NULL,
                role_name VARCHAR(100) NOT NULL,
                role_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // YouTube/Twitch creators
            `CREATE TABLE IF NOT EXISTS creators (
                id SERIAL PRIMARY KEY,
                platform VARCHAR(20) NOT NULL,
                creator_id VARCHAR(100) NOT NULL,
                creator_name VARCHAR(100) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                last_video_id VARCHAR(100),
                is_live BOOLEAN DEFAULT FALSE,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Persistent message channels
            `CREATE TABLE IF NOT EXISTS persistent_channels (
                channel_id VARCHAR(20) PRIMARY KEY,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const query of queries) {
            await this.pool.query(query);
        }

        // Insert default configurations
        await this.setDefaultConfigs();
    }

    async setDefaultConfigs() {
        const defaultWelcome = "🎮 Welcome to our Game Shop Discord! 🎮\n\nHere you can browse and purchase in-game items safely. Check out our channels and don't forget to select your roles!\n\n⚠️ Remember: Always use our official trading system to stay protected from scammers.";
        
        await this.pool.query(
            'INSERT INTO bot_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO NOTHING',
            ['welcome_message', defaultWelcome]
        );
    }

    // User methods
    async addUser(discordId, username, discriminator) {
        await this.pool.query(
            'INSERT INTO users (discord_id, username, discriminator) VALUES ($1, $2, $3) ON CONFLICT (discord_id) DO UPDATE SET username = $2, discriminator = $3, last_activity = CURRENT_TIMESTAMP',
            [discordId, username, discriminator]
        );
    }

    async flagUserAsScammer(discordId, notes = null) {
        await this.pool.query(
            'UPDATE users SET is_scammer = TRUE, scammer_notes = $2 WHERE discord_id = $1',
            [discordId, notes]
        );
    }

    async unflagUserAsScammer(discordId) {
        await this.pool.query(
            'UPDATE users SET is_scammer = FALSE, scammer_notes = NULL WHERE discord_id = $1',
            [discordId]
        );
    }

    async getUserInfo(discordId) {
        const result = await this.pool.query(
            'SELECT * FROM users WHERE discord_id = $1',
            [discordId]
        );
        return result.rows[0];
    }

    async getAllScammers() {
        const result = await this.pool.query(
            'SELECT discord_id, username, scammer_notes FROM users WHERE is_scammer = TRUE'
        );
        return result.rows;
    }

    // Transaction methods
    async addTransaction(userId, itemName, quantity, unitPrice, totalAmount) {
        const result = await this.pool.query(
            'INSERT INTO transactions (user_id, item_name, quantity, unit_price, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING transaction_id',
            [userId, itemName, quantity, unitPrice, totalAmount]
        );
        
        // Update user stats
        await this.pool.query(
            'UPDATE users SET total_purchases = total_purchases + 1, total_spent = total_spent + $2 WHERE discord_id = $1',
            [userId, totalAmount]
        );
        
        return result.rows[0].transaction_id;
    }

    async updateTransactionStatus(transactionId, status) {
        await this.pool.query(
            'UPDATE transactions SET status = $2 WHERE transaction_id = $1',
            [transactionId, status]
        );
    }

    async getUserTransactions(userId) {
        const result = await this.pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC',
            [userId]
        );
        return result.rows;
    }

    // Message logging
    async logMessage(messageId, userId, channelId, content, commandUsed = null) {
        await this.pool.query(
            'INSERT INTO messages (message_id, user_id, channel_id, content, command_used) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (message_id) DO NOTHING',
            [messageId, userId, channelId, content, commandUsed]
        );
        
        // Update user last activity
        await this.pool.query(
            'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE discord_id = $1',
            [userId]
        );
    }

    // Configuration methods
    async getWelcomeMessage() {
        const result = await this.pool.query(
            'SELECT config_value FROM bot_config WHERE config_key = $1',
            ['welcome_message']
        );
        return result.rows[0]?.config_value;
    }

    async setWelcomeMessage(message) {
        await this.pool.query(
            'INSERT INTO bot_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP',
            ['welcome_message', message]
        );
    }

    // Creator management
    async addCreator(platform, creatorId, creatorName, channelId) {
        await this.pool.query(
            'INSERT INTO creators (platform, creator_id, creator_name, channel_id) VALUES ($1, $2, $3, $4)',
            [platform, creatorId, creatorName, channelId]
        );
    }

    async removeCreator(platform, creatorId) {
        await this.pool.query(
            'DELETE FROM creators WHERE platform = $1 AND creator_id = $2',
            [platform, creatorId]
        );
    }

    async getCreators(platform) {
        const result = await this.pool.query(
            'SELECT * FROM creators WHERE platform = $1',
            [platform]
        );
        return result.rows;
    }

    // Persistent message channels
    async setPersistentChannel(channelId, message) {
        await this.pool.query(
            'INSERT INTO persistent_channels (channel_id, message) VALUES ($1, $2) ON CONFLICT (channel_id) DO UPDATE SET message = $2',
            [channelId, message]
        );
    }

    async removePersistentChannel(channelId) {
        await this.pool.query(
            'DELETE FROM persistent_channels WHERE channel_id = $1',
            [channelId]
        );
    }

    async getPersistentChannelConfig(channelId) {
        const result = await this.pool.query(
            'SELECT * FROM persistent_channels WHERE channel_id = $1',
            [channelId]
        );
        return result.rows[0];
    }

    async getAllPersistentChannels() {
        const result = await this.pool.query('SELECT * FROM persistent_channels');
        return result.rows;
    }

    // Database backup method
    async getBackupData() {
        const tables = ['users', 'transactions', 'messages', 'bot_config', 'creators', 'persistent_channels'];
        const backupData = {};
        
        for (const table of tables) {
            const result = await this.pool.query(`SELECT * FROM ${table}`);
            backupData[table] = result.rows;
        }
        
        return backupData;
    }
}

module.exports = Database;