// utils/backupManager.js - Enhanced Backup Manager with PC Download
const fs = require('fs').promises;
const fsSync = require('fs');
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
            backupData.backup_type = 'automatic';
            
            // Write to file
            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            console.log(`Backup created: ${backupFileName}`);
            
            // Send backup to multiple destinations
            await this.sendBackupToAllDestinations(backupPath, backupFileName, backupData);
            
            // Clean old backups (keep last 7 days)
            await this.cleanOldBackups();
            
        } catch (error) {
            console.error('Backup failed:', error);
        }
    }

    async sendBackupToAllDestinations(filePath, fileName, backupData) {
        const backupMethods = (process.env.BACKUP_METHOD || 'discord').split(',');
        
        for (const method of backupMethods) {
            const trimmedMethod = method.trim();
            try {
                switch (trimmedMethod) {
                    case 'discord':
                        await this.sendToDiscord(filePath, fileName);
                        break;
                    case 'ftp':
                        await this.sendToFTP(filePath, fileName);
                        break;
                    case 'sftp':
                        await this.sendToSFTP(filePath, fileName);
                        break;
                    case 'webhook':
                        await this.sendViaWebhook(filePath, fileName);
                        break;
                    case 'email':
                        await this.sendViaEmail(filePath, fileName, backupData);
                        break;
                    case 'gdrive':
                        await this.sendToGoogleDrive(filePath, fileName);
                        break;
                    case 'dropbox':
                        await this.sendToDropbox(filePath, fileName);
                        break;
                    default:
                        console.log(`Unknown backup method: ${trimmedMethod}`);
                }
            } catch (error) {
                console.error(`Failed to send backup via ${trimmedMethod}:`, error);
            }
        }
    }

    // ==================== DISCORD BACKUP ====================
    async sendToDiscord(filePath, fileName) {
        try {
            const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
            const client = new Client({ intents: [GatewayIntentBits.Guilds] });
            
            await client.login(process.env.DISCORD_TOKEN);
            
            const channel = client.channels.cache.get(process.env.BACKUP_CHANNEL_ID);
            if (channel) {
                const attachment = new AttachmentBuilder(filePath, { name: fileName });
                const stats = await fs.stat(filePath);
                const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB
                
                await channel.send({
                    content: `📁 **Automatic Database Backup**\n` +
                           `🕒 **Time:** ${new Date().toLocaleString()}\n` +
                           `📊 **Size:** ${fileSize} MB\n` +
                           `💾 **File:** ${fileName}`,
                    files: [attachment]
                });
                console.log('✅ Backup sent to Discord channel');
            }
            
            client.destroy();
        } catch (error) {
            console.error('❌ Failed to send backup to Discord:', error);
        }
    }

    // ==================== FTP/SFTP BACKUP (TO YOUR PC) ====================
    async sendToFTP(filePath, fileName) {
        try {
            const ftp = require('basic-ftp');
            const client = new ftp.Client();
            
            await client.access({
                host: process.env.FTP_HOST,
                user: process.env.FTP_USER,
                password: process.env.FTP_PASS,
                port: parseInt(process.env.FTP_PORT || '21')
            });
            
            // Create backups directory if it doesn't exist
            try {
                await client.ensureDir('/backups');
            } catch (error) {
                console.log('Backups directory already exists or created');
            }
            
            await client.uploadFrom(filePath, `/backups/${fileName}`);
            await client.close();
            
            console.log('✅ Backup sent to FTP server (your PC)');
        } catch (error) {
            console.error('❌ Failed to send backup to FTP:', error);
        }
    }

    async sendToSFTP(filePath, fileName) {
        try {
            const Client = require('ssh2-sftp-client');
            const sftp = new Client();
            
            await sftp.connect({
                host: process.env.SFTP_HOST,
                username: process.env.SFTP_USER,
                password: process.env.SFTP_PASS,
                port: parseInt(process.env.SFTP_PORT || '22')
            });
            
            // Ensure backup directory exists
            const remotePath = `/backups/${fileName}`;
            await sftp.mkdir('/backups', true);
            
            await sftp.put(filePath, remotePath);
            await sftp.end();
            
            console.log('✅ Backup sent to SFTP server (your PC)');
        } catch (error) {
            console.error('❌ Failed to send backup to SFTP:', error);
        }
    }

    // ==================== WEBHOOK BACKUP (TO YOUR PC VIA HTTP) ====================
    async sendViaWebhook(filePath, fileName) {
        try {
            const axios = require('axios');
            const FormData = require('form-data');
            
            const form = new FormData();
            form.append('file', fsSync.createReadStream(filePath), fileName);
            form.append('timestamp', new Date().toISOString());
            form.append('type', 'database_backup');
            
            await axios.post(process.env.WEBHOOK_URL, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${process.env.WEBHOOK_TOKEN || ''}`
                },
                timeout: 30000 // 30 second timeout
            });
            
            console.log('✅ Backup sent via webhook to your PC');
        } catch (error) {
            console.error('❌ Failed to send backup via webhook:', error);
        }
    }

    // ==================== EMAIL BACKUP ====================
    async sendViaEmail(filePath, fileName, backupData) {
        try {
            const nodemailer = require('nodemailer');
            
            const transporter = nodemailer.createTransporter({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            const stats = await fs.stat(filePath);
            const fileSize = (stats.size / 1024 / 1024).toFixed(2);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.BACKUP_EMAIL,
                subject: `Discord Bot Database Backup - ${new Date().toLocaleDateString()}`,
                html: `
                    <h2>🤖 Discord Shop Bot - Database Backup</h2>
                    <p><strong>Backup Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>File Size:</strong> ${fileSize} MB</p>
                    <p><strong>Total Users:</strong> ${backupData.users?.length || 0}</p>
                    <p><strong>Total Transactions:</strong> ${backupData.transactions?.length || 0}</p>
                    <p><strong>Total Messages:</strong> ${backupData.messages?.length || 0}</p>
                    <br>
                    <p>Your database backup is attached to this email.</p>
                    <p><em>This is an automated backup from your Discord bot.</em></p>
                `,
                attachments: [
                    {
                        filename: fileName,
                        path: filePath
                    }
                ]
            };
            
            await transporter.sendMail(mailOptions);
            console.log('✅ Backup sent via email');
        } catch (error) {
            console.error('❌ Failed to send backup via email:', error);
        }
    }

    // ==================== CLOUD STORAGE BACKUPS ====================
    async sendToGoogleDrive(filePath, fileName) {
        try {
            const { google } = require('googleapis');
            const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
            
            const auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/drive.file']
            });
            
            const drive = google.drive({ version: 'v3', auth });
            
            const fileMetadata = {
                name: fileName,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root']
            };
            
            const media = {
                mimeType: 'application/json',
                body: fsSync.createReadStream(filePath)
            };
            
            await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
            });
            
            console.log('✅ Backup sent to Google Drive');
        } catch (error) {
            console.error('❌ Failed to send backup to Google Drive:', error);
        }
    }

    async sendToDropbox(filePath, fileName) {
        try {
            const { Dropbox } = require('dropbox');
            const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
            
            const fileContent = await fs.readFile(filePath);
            
            await dbx.filesUpload({
                path: `/backups/${fileName}`,
                contents: fileContent,
                mode: 'overwrite',
                autorename: true
            });
            
            console.log('✅ Backup sent to Dropbox');
        } catch (error) {
            console.error('❌ Failed to send backup to Dropbox:', error);
        }
    }

    // ==================== UTILITY METHODS ====================
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
                console.log(`🧹 Cleaned ${filesToDelete.length} old backup files`);
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }

    // Manual backup with custom options
    async performManualBackup(triggeredBy = 'unknown', options = {}) {
        try {
            await this.ensureBackupDirectory();
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `manual_backup_${timestamp}.json`;
            const backupPath = path.join(this.backupDir, backupFileName);
            
            // Get all data from database
            const backupData = await this.database.getBackupData();
            backupData.timestamp = new Date().toISOString();
            backupData.version = '1.0';
            backupData.backup_type = 'manual';
            backupData.triggered_by = triggeredBy;
            backupData.options = options;
            
            // Write to file
            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            console.log(`Manual backup created: ${backupFileName} by ${triggeredBy}`);
            
            // Send backup to all configured destinations
            await this.sendBackupToAllDestinations(backupPath, backupFileName, backupData);
            
            return {
                success: true,
                fileName: backupFileName,
                filePath: backupPath,
                size: (await fs.stat(backupPath)).size,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Manual backup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = BackupManager;
