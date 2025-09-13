// database/connection.js - Complete Clean Version with Welcome Embed System
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
            // Users table with seller tracking
            `CREATE TABLE IF NOT EXISTS users (
                discord_id VARCHAR(20) PRIMARY KEY,
                username VARCHAR(32) NOT NULL,
                discriminator VARCHAR(4),
                join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_purchases INTEGER DEFAULT 0,
                total_spent DECIMAL(10,2) DEFAULT 0,
                total_sales INTEGER DEFAULT 0,
                total_earned DECIMAL(10,2) DEFAULT 0,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_scammer BOOLEAN DEFAULT FALSE,
                scammer_notes TEXT
            )`,

            // Transactions table with created_by tracking
            `CREATE TABLE IF NOT EXISTS transactions (
                transaction_id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) REFERENCES users(discord_id),
                item_name VARCHAR(255) NOT NULL,
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_by VARCHAR(20) REFERENCES users(discord_id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Messages/Activity table - ONLY FOR COMMANDS
            `CREATE TABLE IF NOT EXISTS messages (
                message_id VARCHAR(20) PRIMARY KEY,
                user_id VARCHAR(20) REFERENCES users(discord_id),
                channel_id VARCHAR(20) NOT NULL,
                content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                command_used VARCHAR(50)
            )`,

            // Bot configuration table with welcome embed settings
            `CREATE TABLE IF NOT EXISTS bot_config (
                config_key VARCHAR(50) PRIMARY KEY,
                config_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Server roles table - stores all Discord roles
            `CREATE TABLE IF NOT EXISTS server_roles (
                role_id VARCHAR(20) PRIMARY KEY,
                role_name VARCHAR(100) NOT NULL,
                role_color INTEGER DEFAULT 0,
                role_position INTEGER DEFAULT 0,
                role_permissions BIGINT DEFAULT 0,
                is_hoisted BOOLEAN DEFAULT FALSE,
                is_mentionable BOOLEAN DEFAULT FALSE,
                is_managed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Role setups table - stores custom role menu configurations
            `CREATE TABLE IF NOT EXISTS role_setups (
                setup_id SERIAL PRIMARY KEY,
                setup_name VARCHAR(100) NOT NULL,
                channel_id VARCHAR(20),
                message_id VARCHAR(20),
                embed_title TEXT,
                embed_description TEXT,
                embed_thumbnail_url TEXT,
                embed_image_url TEXT,
                embed_color VARCHAR(7) DEFAULT '#0099FF',
                embed_footer_text TEXT,
                created_by VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Role setup options table - individual role options for each setup
            `CREATE TABLE IF NOT EXISTS role_setup_options (
                option_id SERIAL PRIMARY KEY,
                setup_id INTEGER REFERENCES role_setups(setup_id) ON DELETE CASCADE,
                option_label VARCHAR(100) NOT NULL,
                option_description TEXT,
                option_emoji VARCHAR(100),
                discord_role_id VARCHAR(20) REFERENCES server_roles(role_id),
                option_order INTEGER DEFAULT 0
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
                message_type VARCHAR(10) DEFAULT 'text',
                message_content TEXT,
                embed_title TEXT,
                embed_description TEXT,
                embed_color VARCHAR(7) DEFAULT '#0099FF',
                embed_thumbnail_url TEXT,
                embed_image_url TEXT,
                embed_footer_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const query of queries) {
            await this.pool.query(query);
        }

        // Insert default configurations
        await this.setDefaultConfigs();
    }

    async setDefaultConfigs() {
        const defaultWelcome = "Welcome to our Game Shop Discord!\n\nHere you can browse and purchase in-game items safely. Check out our channels and don't forget to select your roles!\n\nRemember: Always use our official trading system to stay protected from scammers.";
        
        const configs = [
            ['welcome_message', defaultWelcome],
            ['welcome_embed_title', 'Welcome to the Server!'],
            ['welcome_embed_description', defaultWelcome],
            ['welcome_embed_color', '#00FF00'],
            ['welcome_embed_thumbnail', null],
            ['welcome_embed_image', null],
            ['welcome_embed_footer', null],
            ['welcome_use_embed', 'true'],
            ['auto_role', 'Tesco Clubcard']
        ];

        for (const [key, value] of configs) {
            await this.pool.query(
                'INSERT INTO bot_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO NOTHING',
                [key, value]
            );
        }
    }

    // ==================== USER MANAGEMENT METHODS ====================

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

    async getUserCount() {
        try {
            const result = await this.pool.query('SELECT COUNT(*) as count FROM users WHERE is_scammer = FALSE');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting user count:', error);
            return 0;
        }
    }

    async getTotalUserCount() {
        try {
            const result = await this.pool.query('SELECT COUNT(*) as count FROM users');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting total user count:', error);
            return 0;
        }
    }

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

    // ==================== SELLER TRACKING METHODS ====================

    async getSellerStats(userId) {
        try {
            const result = await this.pool.query(
                'SELECT total_sales, total_earned FROM users WHERE discord_id = $1',
                [userId]
            );
            return result.rows[0] || { total_sales: 0, total_earned: 0 };
        } catch (error) {
            console.error('Error getting seller stats:', error);
            return { total_sales: 0, total_earned: 0 };
        }
    }

    async getTopSellers(limit = 10) {
        try {
            const result = await this.pool.query(
                'SELECT discord_id, username, total_sales, total_earned FROM users WHERE total_sales > 0 ORDER BY total_earned DESC LIMIT $1',
                [limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting top sellers:', error);
            return [];
        }
    }

    async updateSellerStats(createdBy, totalAmount) {
        try {
            if (createdBy) {
                await this.pool.query(
                    'UPDATE users SET total_sales = total_sales + 1, total_earned = total_earned + $2 WHERE discord_id = $1',
                    [createdBy, totalAmount]
                );
            }
        } catch (error) {
            console.error('Error updating seller stats:', error);
            throw error;
        }
    }

    // ==================== TRANSACTION METHODS ====================

    async addTransaction(userId, itemName, quantity, unitPrice, totalAmount, createdBy = null) {
        try {
            const result = await this.pool.query(
                'INSERT INTO transactions (user_id, item_name, quantity, unit_price, total_amount, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING transaction_id',
                [userId, itemName, quantity, unitPrice, totalAmount, createdBy]
            );
            
            return result.rows[0].transaction_id;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    async updateTransactionStatus(transactionId, status) {
        try {
            const transactionResult = await this.pool.query(
                'SELECT * FROM transactions WHERE transaction_id = $1',
                [transactionId]
            );
            
            const transaction = transactionResult.rows[0];
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            
            await this.pool.query(
                'UPDATE transactions SET status = $2 WHERE transaction_id = $1',
                [transactionId, status]
            );
            
            if (status === 'completed') {
                await this.pool.query(
                    'UPDATE users SET total_purchases = total_purchases + 1, total_spent = total_spent + $2 WHERE discord_id = $1',
                    [transaction.user_id, transaction.total_amount]
                );
                
                if (transaction.created_by) {
                    await this.updateSellerStats(transaction.created_by, transaction.total_amount);
                }
            } else if (status === 'cancelled' && transaction.status === 'completed') {
                await this.pool.query(
                    'UPDATE users SET total_purchases = total_purchases - 1, total_spent = total_spent - $2 WHERE discord_id = $1',
                    [transaction.user_id, transaction.total_amount]
                );
                
                if (transaction.created_by) {
                    await this.pool.query(
                        'UPDATE users SET total_sales = total_sales - 1, total_earned = total_earned - $2 WHERE discord_id = $1',
                        [transaction.created_by, transaction.total_amount]
                    );
                }
            }
            
        } catch (error) {
            console.error('Error updating transaction status:', error);
            throw error;
        }
    }

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

    async getAllTransactions(limit = 50) {
        try {
            const result = await this.pool.query(
                `SELECT t.*, u.username, c.username as creator_username
                 FROM transactions t 
                 JOIN users u ON t.user_id = u.discord_id 
                 LEFT JOIN users c ON t.created_by = c.discord_id
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

    async getTransactionById(transactionId) {
        try {
            const result = await this.pool.query(
                `SELECT t.*, u.username, c.username as creator_username
                 FROM transactions t 
                 JOIN users u ON t.user_id = u.discord_id 
                 LEFT JOIN users c ON t.created_by = c.discord_id
                 WHERE t.transaction_id = $1`,
                [transactionId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting transaction by ID:', error);
            throw error;
        }
    }

    // ==================== ROLE MANAGEMENT METHODS ====================

    async addServerRole(roleId, roleName, roleColor, rolePosition, rolePermissions, isHoisted, isMentionable, isManaged) {
        try {
            await this.pool.query(
                `INSERT INTO server_roles (role_id, role_name, role_color, role_position, role_permissions, is_hoisted, is_mentionable, is_managed) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 ON CONFLICT (role_id) 
                 DO UPDATE SET 
                    role_name = EXCLUDED.role_name,
                    role_color = EXCLUDED.role_color,
                    role_position = EXCLUDED.role_position,
                    role_permissions = EXCLUDED.role_permissions,
                    is_hoisted = EXCLUDED.is_hoisted,
                    is_mentionable = EXCLUDED.is_mentionable,
                    is_managed = EXCLUDED.is_managed,
                    updated_at = CURRENT_TIMESTAMP`,
                [roleId, roleName, roleColor, rolePosition, rolePermissions, isHoisted, isMentionable, isManaged]
            );
        } catch (error) {
            console.error('Error adding/updating server role:', error);
            throw error;
        }
    }

    async removeServerRole(roleId) {
        try {
            await this.pool.query(
                'DELETE FROM server_roles WHERE role_id = $1',
                [roleId]
            );
        } catch (error) {
            console.error('Error removing server role:', error);
            throw error;
        }
    }

    async getAllServerRoles() {
        try {
            const result = await this.pool.query(
                'SELECT * FROM server_roles ORDER BY role_position DESC'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all server roles:', error);
            return [];
        }
    }

    async getAssignableRoles() {
        try {
            const result = await this.pool.query(
                'SELECT * FROM server_roles WHERE is_managed = FALSE AND role_name != \'@everyone\' ORDER BY role_position DESC'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting assignable roles:', error);
            return [];
        }
    }

    async getRoleByName(roleName) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM server_roles WHERE role_name = $1',
                [roleName]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting role by name:', error);
            return null;
        }
    }

    // ==================== ROLE SETUP METHODS ====================

    async createRoleSetup(setupName, createdBy, embedTitle, embedDescription, embedThumbnailUrl, embedImageUrl, embedColor, embedFooterText) {
        try {
            const result = await this.pool.query(
                `INSERT INTO role_setups (setup_name, created_by, embed_title, embed_description, embed_thumbnail_url, embed_image_url, embed_color, embed_footer_text) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 RETURNING setup_id`,
                [setupName, createdBy, embedTitle, embedDescription, embedThumbnailUrl, embedImageUrl, embedColor, embedFooterText]
            );
            return result.rows[0].setup_id;
        } catch (error) {
            console.error('Error creating role setup:', error);
            throw error;
        }
    }

    async addRoleSetupOption(setupId, optionLabel, optionDescription, optionEmoji, discordRoleId, optionOrder) {
        try {
            await this.pool.query(
                'INSERT INTO role_setup_options (setup_id, option_label, option_description, option_emoji, discord_role_id, option_order) VALUES ($1, $2, $3, $4, $5, $6)',
                [setupId, optionLabel, optionDescription, optionEmoji, discordRoleId, optionOrder]
            );
        } catch (error) {
            console.error('Error adding role setup option:', error);
            throw error;
        }
    }

    async updateRoleSetupDeployment(setupId, channelId, messageId) {
        try {
            await this.pool.query(
                'UPDATE role_setups SET channel_id = $2, message_id = $3, updated_at = CURRENT_TIMESTAMP WHERE setup_id = $1',
                [setupId, channelId, messageId]
            );
        } catch (error) {
            console.error('Error updating role setup deployment:', error);
            throw error;
        }
    }

    async getRoleSetup(setupId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM role_setups WHERE setup_id = $1',
                [setupId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting role setup:', error);
            return null;
        }
    }

    async getRoleSetupOptions(setupId) {
        try {
            const result = await this.pool.query(
                `SELECT rso.*, sr.role_name 
                 FROM role_setup_options rso 
                 LEFT JOIN server_roles sr ON rso.discord_role_id = sr.role_id 
                 WHERE rso.setup_id = $1 
                 ORDER BY rso.option_order`,
                [setupId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting role setup options:', error);
            return [];
        }
    }

    async getAllRoleSetups() {
        try {
            const result = await this.pool.query(
                'SELECT rs.*, u.username as creator_name FROM role_setups rs LEFT JOIN users u ON rs.created_by = u.discord_id ORDER BY rs.created_at DESC'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all role setups:', error);
            return [];
        }
    }

    async deleteRoleSetup(setupId) {
        try {
            await this.pool.query(
                'DELETE FROM role_setups WHERE setup_id = $1',
                [setupId]
            );
        } catch (error) {
            console.error('Error deleting role setup:', error);
            throw error;
        }
    }

    // ==================== MESSAGE LOGGING METHODS ====================

    async logMessage(messageId, userId, channelId, content, commandUsed = null) {
        try {
            if (content && content.startsWith('!')) {
                await this.pool.query(
                    'INSERT INTO messages (message_id, user_id, channel_id, content, command_used) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (message_id) DO NOTHING',
                    [messageId, userId, channelId, content, commandUsed]
                );
            }
            
            await this.pool.query(
                'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE discord_id = $1',
                [userId]
            );
        } catch (error) {
            console.error('Error logging message:', error);
            throw error;
        }
    }

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

    async getAutoRole() {
        try {
            const result = await this.pool.query(
                'SELECT config_value FROM bot_config WHERE config_key = $1',
                ['auto_role']
            );
            return result.rows[0]?.config_value;
        } catch (error) {
            console.error('Error getting auto role:', error);
            return null;
        }
    }

    async setAutoRole(roleName) {
        try {
            await this.pool.query(
                'INSERT INTO bot_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP',
                ['auto_role', roleName]
            );
        } catch (error) {
            console.error('Error setting auto role:', error);
            throw error;
        }
    }

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

    async setPersistentChannel(channelId, message) {
        try {
            await this.pool.query(
                `INSERT INTO persistent_channels (channel_id, message_type, message_content) 
                 VALUES ($1, 'text', $2) 
                 ON CONFLICT (channel_id) 
                 DO UPDATE SET message_type = 'text', message_content = $2, updated_at = CURRENT_TIMESTAMP`,
                [channelId, message]
            );
        } catch (error) {
            console.error('Error setting persistent channel:', error);
            throw error;
        }
    }

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

    async getAllPersistentChannels() {
        try {
            const result = await this.pool.query('SELECT * FROM persistent_channels');
            return result.rows;
        } catch (error) {
            console.error('Error getting all persistent channels:', error);
            throw error;
        }
    }
    
    async setPersistentChannelEmbed(channelId, title, description, color, thumbnail, image, footer) {
        try {
            await this.pool.query(
                `INSERT INTO persistent_channels 
                 (channel_id, message_type, message_content, embed_title, embed_description, embed_color, embed_thumbnail_url, embed_image_url, embed_footer_text, updated_at) 
                 VALUES ($1, 'embed', '', $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) 
                 ON CONFLICT (channel_id) 
                 DO UPDATE SET 
                    message_type = 'embed',
                    message_content = '',
                    embed_title = $2,
                    embed_description = $3,
                    embed_color = $4,
                    embed_thumbnail_url = $5,
                    embed_image_url = $6,
                    embed_footer_text = $7,
                    updated_at = CURRENT_TIMESTAMP`,
                [channelId, title, description, color, thumbnail, image, footer]
            );
        } catch (error) {
            console.error('Error setting persistent channel embed:', error);
            throw error;
        }
    }

    async setPersistentChannelText(channelId, message) {
        try {
            await this.pool.query(
                `INSERT INTO persistent_channels 
                 (channel_id, message_type, message_content, updated_at) 
                 VALUES ($1, 'text', $2, CURRENT_TIMESTAMP) 
                 ON CONFLICT (channel_id) 
                 DO UPDATE SET 
                    message_type = 'text',
                    message_content = $2,
                    embed_title = NULL,
                    embed_description = NULL,
                    embed_color = '#0099FF',
                    embed_thumbnail_url = NULL,
                    embed_image_url = NULL,
                    embed_footer_text = NULL,
                    updated_at = CURRENT_TIMESTAMP`,
                [channelId, message]
            );
        } catch (error) {
            console.error('Error setting persistent channel text:', error);
            throw error;
        }
    }
    
    // ==================== BACKUP AND UTILITY METHODS ====================

    async getBackupData() {
        try {
            const tables = ['users', 'transactions', 'messages', 'bot_config', 'creators', 'persistent_channels', 'server_roles', 'role_setups', 'role_setup_options'];
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

    async getDatabaseStats() {
        try {
            const stats = {};
            
            const tables = ['users', 'transactions', 'messages', 'creators', 'persistent_channels', 'server_roles', 'role_setups'];
            for (const table of tables) {
                const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                stats[`${table}_count`] = parseInt(result.rows[0].count);
            }
            
            const scammerResult = await this.pool.query('SELECT COUNT(*) as count FROM users WHERE is_scammer = TRUE');
            stats.scammer_count = parseInt(scammerResult.rows[0].count);
            
            const totalSpentResult = await this.pool.query('SELECT SUM(total_spent) as total FROM users');
            stats.total_revenue = parseFloat(totalSpentResult.rows[0].total || 0);
            
            const totalEarnedResult = await this.pool.query('SELECT SUM(total_earned) as total FROM users');
            stats.total_sales_revenue = parseFloat(totalEarnedResult.rows[0].total || 0);
            
            const pendingTransactionsResult = await this.pool.query('SELECT COUNT(*) as count FROM transactions WHERE status = \'pending\'');
            stats.pending_transactions = parseInt(pendingTransactionsResult.rows[0].count);
            
            return stats;
        } catch (error) {
            console.error('Error getting database stats:', error);
            throw error;
        }
    }

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
