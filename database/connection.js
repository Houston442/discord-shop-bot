// database/connection.js - Complete Database Connection and Management
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

            // Messages/Activity table - NOW ONLY FOR COMMANDS
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

    // ==================== USER MANAGEMENT METHODS ====================

    // Enhanced addUser function with conflict handling
    async addUser(discordId, username, discriminator) {
        try {
            await this.pool.query(
                `INSERT INTO users (discord_id, username, discriminator) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (discord_id) 
                 DO UPDATE SET 
                    username = EXCLUDED.username, 
                    discriminator = EXCLUDED.discriminator, 
                    last_activity = CURRENT_TIMESTAMP`,
                [discordId, username, discriminator]
            );
        } catch (error) {
            console.error('Error adding/updating user:', error);
            throw error;
        }
    }

    // Update existing user information
    async updateUserInfo(discordId, username, discriminator) {
        try {
            await this.pool.query(
                'UPDATE users SET username = $2, discriminator = $3, last_activity = CURRENT_TIMESTAMP WHERE discord_id = $1',
                [discordId, username, discriminator]
            );
        } catch (error) {
            console.error('Error updating user info:', error);
            throw error;
        }
    }

    // Flag user as scammer
    async flagUserAsScammer(discordId, notes = null) {
        try {
            await this.pool.query(
                'UPDATE users SET is_scammer = TRUE, scammer_notes = $2 WHERE discord_id = $1',
                [discordId, notes]
            );
        } catch (error) {
            console.error('Error flagging user as scammer:', error);
            throw error;
        }
    }

    // Remove scammer flag from user
    async unflagUserAsScammer(discordId) {
        try {
            await this.pool.query(
                'UPDATE users SET is_scammer = FALSE, scammer_notes = NULL WHERE discord_id = $1',
                [discordId]
            );
        } catch (error) {
            console.error('Error unflagging user as scammer:', error);
            throw error;
        }
    }

    // Get user information
    async getUserInfo(discordId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM users WHERE discord_id = $1',
                [discordId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }

    // Get all flagged scammers
    async getAllScammers() {
        try {
            const result = await this.pool.query(
                'SELECT discord_id, username, scammer_notes FROM users WHERE is_scammer = TRUE ORDER BY username'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting scammers list:', error);
            throw error;
        }
    }

    // Get user count (excluding scammers)
    async getUserCount() {
        try {
            const result = await this.pool.query('SELECT COUNT(*) as count FROM users WHERE is_scammer = FALSE');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting user count:', error);
            return 0;
        }
    }

    // Get total user count (including scammers)
    async getTotalUserCount() {
        try {
            const result = await this.pool.query('SELECT COUNT(*) as count FROM users');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting total user count:', error);
            return 0;
        }
    }

    // Get recent users
    async getRecentUsers(limit = 10) {
        try {
            const result = await this.pool.query(
                'SELECT discord_id, username, join_date FROM users ORDER BY join_date DESC LIMIT $1',
                [limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting recent users:', error);
            return [];
        }
    }

    // ==================== TRANSACTION METHODS ====================

    // Add new transaction
    async addTransaction(userId, itemName, quantity, unitPrice, totalAmount) {
        try {
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
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    // Update transaction status
    async updateTransactionStatus(transactionId, status) {
        try {
            await this.pool.query(
                'UPDATE transactions SET status = $2 WHERE transaction_id = $1',
                [transactionId, status]
            );
        } catch (error) {
            console.error('Error updating transaction status:', error);
            throw error;
        }
    }

    // Get user transactions
    async getUserTransactions(userId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting user transactions:', error);
            throw error;
        }
    }

    // Get all transactions (admin use)
    async getAllTransactions(limit = 50) {
        try {
            const result = await this.pool.query(
                `SELECT t.*, u.username 
                 FROM transactions t 
                 JOIN users u ON t.user_id = u.discord_id 
                 ORDER BY t.timestamp DESC 
                 LIMIT $1`,
                [limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all transactions:', error);
            throw error;
        }
    }

    // Get transaction by ID with user info
    async getTransactionById(transactionId) {
        try {
            const result = await this.pool.query(
                `SELECT t.*, u.username 
                 FROM transactions t 
                 JOIN users u ON t.user_id = u.discord_id 
                 WHERE t.transaction_id = $1`,
                [transactionId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting transaction by ID:', error);
            throw error;
        }
    }

    // ==================== MESSAGE LOGGING METHODS ====================
    // MODIFIED: Now only logs commands, not all messages

    // Log ONLY bot commands (messages starting with !)
    async logMessage(messageId, userId, channelId, content, commandUsed = null) {
        try {
            // Only log if it's a command (content starts with !)
            if (content && content.startsWith('!')) {
                await this.pool.query(
                    'INSERT INTO messages (message_id, user_id, channel_id, content, command_used) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (message_id) DO NOTHING',
                    [messageId, userId, channelId, content, commandUsed]
                );
            }
            
            // Always update user last activity regardless of message type
            await this.pool.query(
                'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE discord_id = $1',
                [userId]
            );
        } catch (error) {
            console.error('Error logging message:', error);
            throw error;
        }
    }

    // Update user activity without logging message content
    async updateLastActivity(userId) {
        try {
            await this.pool.query(
                'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE discord_id = $1',
                [userId]
            );
        } catch (error) {
            console.error('Error updating last activity:', error);
            throw error;
        }
    }

    // Get user activity stats (now only shows command activity)
    async getUserActivity(userId, days = 7) {
        try {
            const result = await this.pool.query(
                `SELECT COUNT(*) as command_count, 
                        COUNT(CASE WHEN command_used LIKE '!shop%' THEN 1 END) as shop_commands,
                        COUNT(CASE WHEN command_used LIKE '!admin%' THEN 1 END) as admin_commands,
                        COUNT(CASE WHEN command_used LIKE '!message%' THEN 1 END) as message_commands
                 FROM messages 
                 WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '${days} days'`,
                [userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user activity:', error);
            return {
                command_count: 0,
                shop_commands: 0,
                admin_commands: 0,
                message_commands: 0
            };
        }
    }

    // ==================== CONFIGURATION METHODS ====================

    // Get welcome message
    async getWelcomeMessage() {
        try {
            const result = await this.pool.query(
                'SELECT config_value FROM bot_config WHERE config_key = $1',
                ['welcome_message']
            );
            return result.rows[0]?.config_value;
        } catch (error) {
            console.error('Error getting welcome message:', error);
            throw error;
        }
    }

    // Set welcome message
    async setWelcomeMessage(message) {
        try {
            await this.pool.query(
                'INSERT INTO bot_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP',
                ['welcome_message', message]
            );
        } catch (error) {
            console.error('Error setting welcome message:', error);
            throw error;
        }
    }

    // Get configuration value
    async getConfig(key) {
        try {
            const result = await this.pool.query(
                'SELECT config_value FROM bot_config WHERE config_key = $1',
                [key]
            );
            return result.rows[0]?.config_value;
        } catch (error) {
            console.error('Error getting config:', error);
            throw error;
        }
    }

    // Set configuration value
    async setConfig(key, value) {
        try {
            await this.pool.query(
                'INSERT INTO bot_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP',
                [key, value]
            );
        } catch (error) {
            console.error('Error setting config:', error);
            throw error;
        }
    }

    // ==================== CREATOR MANAGEMENT METHODS ====================

    // Add creator for monitoring
    async addCreator(platform, creatorId, creatorName, channelId) {
        try {
            await this.pool.query(
                'INSERT INTO creators (platform, creator_id, creator_name, channel_id) VALUES ($1, $2, $3, $4)',
                [platform, creatorId, creatorName, channelId]
            );
        } catch (error) {
            console.error('Error adding creator:', error);
            throw error;
        }
    }

    // Remove creator from monitoring
    async removeCreator(platform, creatorId) {
        try {
            await this.pool.query(
                'DELETE FROM creators WHERE platform = $1 AND creator_id = $2',
                [platform, creatorId]
            );
        } catch (error) {
            console.error('Error removing creator:', error);
            throw error;
        }
    }

    // Get creators by platform
    async getCreators(platform) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM creators WHERE platform = $1',
                [platform]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting creators:', error);
            throw error;
        }
    }

    // Update creator's last video/stream info
    async updateCreatorLastVideo(creatorId, platform, lastVideoId) {
        try {
            await this.pool.query(
                'UPDATE creators SET last_video_id = $1 WHERE creator_id = $2 AND platform = $3',
                [lastVideoId, creatorId, platform]
            );
        } catch (error) {
            console.error('Error updating creator last video:', error);
            throw error;
        }
    }

    // Update creator live status
    async updateCreatorLiveStatus(creatorId, platform, isLive) {
        try {
            await this.pool.query(
                'UPDATE creators SET is_live = $1 WHERE creator_id = $2 AND platform = $3',
                [isLive, creatorId, platform]
            );
        } catch (error) {
            console.error('Error updating creator live status:', error);
            throw error;
        }
    }

    // ==================== PERSISTENT MESSAGE METHODS ====================

    // Set persistent message for channel
    async setPersistentChannel(channelId, message) {
        try {
            await this.pool.query(
                'INSERT INTO persistent_channels (channel_id, message) VALUES ($1, $2) ON CONFLICT (channel_id) DO UPDATE SET message = $2',
                [channelId, message]
            );
        } catch (error) {
            console.error('Error setting persistent channel:', error);
            throw error;
        }
    }

    // Remove persistent message from channel
    async removePersistentChannel(channelId) {
        try {
            await this.pool.query(
                'DELETE FROM persistent_channels WHERE channel_id = $1',
                [channelId]
            );
        } catch (error) {
            console.error('Error removing persistent channel:', error);
            throw error;
        }
    }

    // Get persistent channel configuration
    async getPersistentChannelConfig(channelId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM persistent_channels WHERE channel_id = $1',
                [channelId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting persistent channel config:', error);
            throw error;
        }
    }

    // Get all persistent channels
    async getAllPersistentChannels() {
        try {
            const result = await this.pool.query('SELECT * FROM persistent_channels');
            return result.rows;
        } catch (error) {
            console.error('Error getting all persistent channels:', error);
            throw error;
        }
    }

    // ==================== BACKUP AND UTILITY METHODS ====================

    // Get backup data for all tables
    async getBackupData() {
        try {
            const tables = ['users', 'transactions', 'messages', 'bot_config', 'creators', 'persistent_channels'];
            const backupData = {};
            
            for (const table of tables) {
                const result = await this.pool.query(`SELECT * FROM ${table}`);
                backupData[table] = result.rows;
            }
            
            return backupData;
        } catch (error) {
            console.error('Error getting backup data:', error);
            throw error;
        }
    }

    // Get database statistics
    async getDatabaseStats() {
        try {
            const stats = {};
            
            // Table row counts
            const tables = ['users', 'transactions', 'messages', 'creators', 'persistent_channels'];
            for (const table of tables) {
                const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                stats[`${table}_count`] = parseInt(result.rows[0].count);
            }
            
            // Additional stats
            const scammerResult = await this.pool.query('SELECT COUNT(*) as count FROM users WHERE is_scammer = TRUE');
            stats.scammer_count = parseInt(scammerResult.rows[0].count);
            
            const totalSpentResult = await this.pool.query('SELECT SUM(total_spent) as total FROM users');
            stats.total_revenue = parseFloat(totalSpentResult.rows[0].total || 0);
            
            const pendingTransactionsResult = await this.pool.query('SELECT COUNT(*) as count FROM transactions WHERE status = \'pending\'');
            stats.pending_transactions = parseInt(pendingTransactionsResult.rows[0].count);
            
            return stats;
        } catch (error) {
            console.error('Error getting database stats:', error);
            throw error;
        }
    }

    // Test database connection
    async testConnection() {
        try {
            const result = await this.pool.query('SELECT NOW() as current_time');
            console.log('Database connection successful:', result.rows[0].current_time);
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }

    // Close database connection
    async close() {
        try {
            await this.pool.end();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }
}

module.exports = Database;
