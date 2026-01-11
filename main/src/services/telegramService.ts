import TelegramBot from 'node-telegram-bot-api';
import { SessionManager } from './sessionManager';
import { ConfigManager } from './configManager';
import { SessionOutput } from '../types/session';

export class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;
  private ownerId: string | null = null;
  private currentSessionId: string | null = null;
  
  // Map Telegram message IDs to Session IDs to handle replies
  private messageSessionMap: Map<number, string> = new Map();

  constructor(
    private sessionManager: SessionManager,
    private configManager: ConfigManager
  ) {
    this.initialize();
  }

  private async initialize() {
    const config = await this.configManager.getConfig();
    
    // Check both config and environment variables (prioritize config)
    const token = config.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = config.telegram?.chatId || process.env.TELEGRAM_CHAT_ID;
    const ownerId = config.telegram?.ownerId || process.env.TELEGRAM_OWNER_ID;
    const isEnabled = config.telegram?.enabled || (!!token && !!chatId);

    if (isEnabled && token && chatId) {
      this.chatId = chatId;
      this.ownerId = ownerId || null;
      
      try {
        if (this.bot) {
            this.bot.stopPolling();
        }
        this.bot = new TelegramBot(token, { polling: true });
        console.log('[TelegramService] Bot initialized');

        this.setupEventListeners();
        this.setupBotListeners();
        
        // Don't spam online message every time config changes, only on first init
        if (!this.currentSessionId) {
            this.sendMessage(`Crystal is online! 💎`);
        }
      } catch (error) {
        console.error('[TelegramService] Failed to initialize bot:', error);
      }
    }
  }

  private setupEventListeners() {
    this.sessionManager.on('session-created', (session) => {
      this.sendMessage(
          `🆕 *Session Created*\n` +
          `Name: *${session.name}*\n` +
          `ID: 
${session.id}
`,
          this.getSessionKeyboard(session.id)
      );
      this.currentSessionId = session.id;
    });

    this.sessionManager.on('session-updated', (session) => {
        // Only notify about important status changes
        if (session.status === 'completed' || session.status === 'error' || session.status === 'waiting') {
             const statusEmoji = session.status === 'completed' ? '✅' : session.status === 'error' ? '❌' : '⏳';
             this.sendMessage(
                 `${statusEmoji} Session *${session.name}* is now: *${session.status}*`,
                 this.getSessionKeyboard(session.id)
             );
        }
    });

    this.sessionManager.on('session-output', (output: SessionOutput) => {
      // Logic remains same, but we use sendSessionMessage which adds keyboard
      if (output.type === 'json' && output.data) {
        const data = typeof output.data === 'string' ? JSON.parse(output.data) : output.data;
        
        if (data.type === 'assistant' && data.message?.content) {
             let text = '';
             if (Array.isArray(data.message.content)) {
                 text = data.message.content
                    .filter((c: any) => c.type === 'text')
                    .map((c: any) => c.text)
                    .join('');
             } else if (typeof data.message.content === 'string') {
                 text = data.message.content;
             }
             
             if (text) {
                 this.sendSessionMessage(output.sessionId, `🤖 *AI (${output.sessionId.slice(0,8)}):*\n${text}`);
             }
        }
      } else if (output.type === 'error') {
          this.sendSessionMessage(output.sessionId, `❌ *Error (${output.sessionId.slice(0,8)}):*\n${JSON.stringify(output.data)}`);
      }
    });
  }

  private setupBotListeners() {
    if (!this.bot) return;

    this.bot.on('callback_query', async (query) => {
        if (!query.data || !this.bot) return;
        
        const [action, sessionId] = query.data.split(':');
        
        switch (action) {
            case 'switch':
                this.currentSessionId = sessionId;
                const session = this.sessionManager.getSession(sessionId);
                await this.bot.answerCallbackQuery(query.id, { text: `Switched to ${session?.name || sessionId}` });
                this.sendMessage(`✅ Switched context to: *${session?.name || sessionId}*`, this.getSessionKeyboard(sessionId));
                break;
            case 'stop':
                try {
                    await this.sessionManager.stopSession(sessionId);
                    await this.bot.answerCallbackQuery(query.id, { text: `Stopped session` });
                    this.sendMessage(`⏹ Stopped session: 
${sessionId}
`);
                } catch (e) {
                    await this.bot.answerCallbackQuery(query.id, { text: `Error: ${e}` });
                }
                break;
            case 'list':
                this.handleCommand('/list');
                await this.bot.answerCallbackQuery(query.id);
                break;
        }
    });

    this.bot.on('message', async (msg) => {
      if (msg.chat.id.toString() !== this.chatId) return;
      if (!msg.text) return;

      const text = msg.text;

      // Handle commands
      if (text.startsWith('/')) {
        this.handleCommand(text);
        return;
      }

      // Handle replies or direct messages
      let targetSessionId = this.currentSessionId;

      // Check if replying to a message
      if (msg.reply_to_message && this.messageSessionMap.has(msg.reply_to_message.message_id)) {
        targetSessionId = this.messageSessionMap.get(msg.reply_to_message.message_id)!;
        // Update current session context
        this.currentSessionId = targetSessionId;
      }

      if (targetSessionId) {
        try {
            await this.sessionManager.continueConversation(targetSessionId, text);
        } catch (error) {
            this.sendMessage(`⚠️ Failed to send message to session 
${targetSessionId}
: ${error}`);
        }
      } else {
        this.sendMessage(`⚠️ No active session selected. Use /list to pick one.`);
      }
    });
  }

  private getSessionKeyboard(sessionId: string) {
      return {
          inline_keyboard: [
              [
                  { text: '🔄 Switch to this', callback_data: `switch:${sessionId}` },
                  { text: '⏹ Stop', callback_data: `stop:${sessionId}` }
              ],
              [
                  { text: '📋 List Sessions', callback_data: 'list:all' }
              ]
          ]
      };
  }

  private handleCommand(text: string) {
      const [cmd, ...args] = text.split(' ');
      
      switch (cmd) {
          case '/list':
              const sessions = this.sessionManager.getAllSessions();
              const active = sessions.filter(s => s.status !== 'stopped' && s.status !== 'error' && !s.archived);
              if (active.length === 0) {
                  this.sendMessage("No active sessions.");
              } else {
                  const list = active.map(s => `• *${s.name}* (
${s.id}
) - ${s.status}`).join('\n');
                  this.sendMessage(`📋 *Active Sessions:*
${list}`, {
                      inline_keyboard: active.slice(0, 5).map(s => ([
                          { text: `Connect to ${s.name}`, callback_data: `switch:${s.id}` }
                      ]))
                  });
              }
              break;
          case '/switch':
              const id = args[0];
              if (id) {
                  const session = this.sessionManager.getSession(id) || this.sessionManager.getAllSessions().find(s => s.id.startsWith(id));
                  if (session) {
                      this.currentSessionId = session.id;
                      this.sendMessage(`✅ Switched context to: *${session.name}*`, this.getSessionKeyboard(session.id));
                  } else {
                      this.sendMessage(`❌ Session not found.`);
                  }
              } else {
                  this.sendMessage(`Usage: /switch <session_id>`);
              }
              break;
          case '/help':
              this.sendMessage(
                  `🤖 *Crystal Bot Help*\n\n` +
                  `Talk to the bot to send messages to the active session.\n` +
                  `Reply to a specific message to talk to that session.\n\n` +
                  `/list - List active sessions\n` +
                  `/switch <id> - Switch active session context\n` +
                  `/help - Show this help`
              );
              break;
      }
  }

  private async sendMessage(text: string, keyboard?: any) {
    if (!this.bot || !this.chatId) return;
    try {
      await this.bot.sendMessage(this.chatId, text, { 
          parse_mode: 'Markdown',
          reply_markup: keyboard
      });
    } catch (e) {
      console.error('[TelegramService] Error sending message:', e);
    }
  }

  private async sendSessionMessage(sessionId: string, text: string) {
      if (!this.bot || !this.chatId) return;
      try {
          const sent = await this.bot.sendMessage(this.chatId, text, { 
              parse_mode: 'Markdown',
              reply_markup: this.getSessionKeyboard(sessionId)
          });
          this.messageSessionMap.set(sent.message_id, sessionId);
          
          if (this.messageSessionMap.size > 1000) {
              const firstKey = this.messageSessionMap.keys().next().value;
              if (firstKey !== undefined) this.messageSessionMap.delete(firstKey);
          }
      } catch (e) {
          console.error('[TelegramService] Error sending session message:', e);
      }
  }
}