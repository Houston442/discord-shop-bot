// utils/backupManager.js
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class BackupManager {
    constructor(database) {
        this.database = database;
        this.backupDir = './backups';
    }

    async performBackup() {
        try {
            await this.ensureBackupDirectory();
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `backup_${timestamp}.json`;
            const backupPath = path.join(this.backupDir, backupFileName);
            
            // Get all data from database
            const backupData = await this.database.getBackupData();
            backupData.timestamp = new Date().toISOString();
            backupData.version = '1.0';
            
            // Write to file
            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            console.log(`Backup created: ${backupFileName}`);
            
            // Send backup based on configured method
            await this.sendBackup(backupPath, backupFileName);
            
            // Clean old backups (keep last 7 days)
            await this.cleanOldBackups();
            
        } catch (error) {
            console.error('Backup failed:', error);
        }
    }

    async sendBackup(filePath, fileName) {
        const backupMethod = process.env.BACKUP_METHOD || 'discord';
        
        switch (backupMethod) {
            case 'discord':
                await this.sendToDiscord(filePath, fileName);
                break;
            case 'ftp':
                await this.sendToFTP(filePath, fileName);
                break;
            case 'gdrive':
                await this.sendToGoogleDrive(filePath, fileName);
                break;
            default:
                console.log('No backup method configured, backup saved locally only');
        }
    }

    async sendToDiscord(filePath, fileName) {
        try {
            const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
            const client = new Client({ intents: [GatewayIntentBits.Guilds] });
            
            await client.login(process.env.DISCORD_TOKEN);
            
            const channel = client.channels.cache.get(process.env.BACKUP_CHANNEL_ID);
            if (channel) {
                const attachment = new AttachmentBuilder(filePath, { name: fileName });
                await channel.send({
                    content: `📁 Daily Backup - ${new Date().toLocaleDateString()}`,
                    files: [attachment]
                });
                console.log('Backup sent to Discord channel');
            }
            
            client.destroy();
        } catch (error) {
            console.error('Failed to send backup to Discord:', error);
        }
    }

    async sendToFTP(filePath, fileName) {
        try {
            const Client = require('ssh2-sftp-client');
            const sftp = new Client();
            
            await sftp.connect({
                host: process.env.FTP_HOST,
                username: process.env.FTP_USER,
                password: process.env.FTP_PASS,
                port: 22
            });
            
            await sftp.put(filePath, `/backups/${fileName}`);
            await sftp.end();
            
            console.log('Backup sent to FTP server');
        } catch (error) {
            console.error('Failed to send backup to FTP:', error);
        }
    }

    async ensureBackupDirectory() {
        try {
            await fs.access(this.backupDir);
        } catch {
            await fs.mkdir(this.backupDir, { recursive: true });
        }
    }

    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(f => f.startsWith('backup_')).sort();
            
            // Keep last 7 backups
            if (backupFiles.length > 7) {
                const filesToDelete = backupFiles.slice(0, -7);
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.backupDir, file));
                }
                console.log(`Cleaned ${filesToDelete.length} old backup files`);
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }
}

module.exports = BackupManager;