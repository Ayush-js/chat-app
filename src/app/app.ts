import { Component, OnInit, HostListener, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import SockJS from 'sockjs-client'; 
import { Stomp, CompatClient, IMessage } from '@stomp/stompjs';

interface Message {
  sender: string;
  content: string;
  type: string;
  messageClass: string;
  time: string;
  date: Date;
  isEditing: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isForwarded?: boolean;
  isStarred?: boolean;
  replyTo?: any;
  reactions?: { [emoji: string]: string[] };
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  isVoiceMessage?: boolean;
  voiceDuration?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('messageArea') messageArea!: ElementRef;
  
  // WebSocket Configuration
  private stompClient: CompatClient | null = null;
  private readonly WS_ENDPOINT = 'http://localhost:8080/ws';
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectInterval = 3000;
  
  // Connection Status
  isConnected = false;
  connectionError = false;
  connectionMessage = 'Connecting...';
  
  username: string = "User_" + Math.floor(Math.random() * 1000);
  chatPartner: string = "Public Group";
  newMessage: string = '';
  messages: Message[] = [];

  // UI State Variables
  isMenuVisible = false;      
  isHeaderMenuOpen = false;   
  isEmojiPickerOpen = false;  
  isAboutModalOpen = false;   
  isDeleteModalOpen = false;
  isReactionPickerOpen = false;
  isSearchOpen = false;
  isStarredMessagesOpen = false;
  showScrollButton = false;
  typingUsers: string[] = [];
  
  menuX = 0;
  menuY = 0;
  selectedMessage: any = null;
  replyingTo: any = null;
  searchQuery: string = '';
  
  // Emoji lists
  emojis = ['😀', '😂', '😍', '🥰', '😎', '😢', '😭', '😡', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💯'];
  reactionEmojis = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

  groupMembers = [
    { name: 'You', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=You&background=00a884&color=fff' },
    { name: 'John Doe', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=667781&color=fff' },
    { name: 'Jane Smith', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=667781&color=fff' },
    { name: 'Alice Johnson', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=667781&color=fff' }
  ];

  ngOnInit() {
    this.connect();
    this.simulateTyping();
  }

  ngOnDestroy() {
    this.disconnect();
  }

  // WebSocket Connection
  connect(): void {
    try {
      this.connectionMessage = 'Connecting to server...';
      this.connectionError = false;
      
      console.log(`🔌 Attempting to connect to: ${this.WS_ENDPOINT}`);
      
      const socket = new (SockJS as any)(this.WS_ENDPOINT);
      this.stompClient = Stomp.over(socket);
      
      this.stompClient.debug = (str: string) => {
        console.log('STOMP: ' + str);
      };
      
      this.stompClient.connect(
        {},
        () => {
          this.onConnected();
        },
        (error: any) => {
          this.onError(error);
        }
      );
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.handleConnectionError(error);
    }
  }

  onConnected(): void {
    console.log('✅ Connected to WebSocket server');
    this.isConnected = true;
    this.connectionError = false;
    this.connectionMessage = 'Connected';
    this.reconnectAttempts = 0;
    
    // Subscribe to public topic
    this.stompClient?.subscribe('/topic/public', (payload: IMessage) => {
      this.onMessageReceived(payload);
    });
    
    // Send JOIN message
    this.stompClient?.send(
      "/app/chat.addUser",
      {},
      JSON.stringify({ sender: this.username, type: 'JOIN' })
    );
    
    this.showSystemNotification(`Connected as ${this.username}`);
  }

  onError(error: any): void {
    console.error('❌ WebSocket connection error:', error);
    this.handleConnectionError(error);
  }

  handleConnectionError(error: any): void {
    this.isConnected = false;
    this.connectionError = true;
    
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      this.connectionMessage = `Reconnecting... (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`;
      
      console.log(`🔄 Reconnect attempt ${this.reconnectAttempts} in ${this.reconnectInterval}ms`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
      
      this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 30000);
    } else {
      this.connectionMessage = 'Unable to connect. Please check your backend server.';
    }
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(
        "/app/chat.addUser",
        {},
        JSON.stringify({ sender: this.username, type: 'LEAVE' })
      );
      
      this.stompClient.disconnect(() => {
        console.log('🔌 Disconnected from WebSocket');
      });
    }
    this.isConnected = false;
  }

  // Message Handling
  onMessageReceived(payload: any): void {
    try {
      const message = JSON.parse(payload.body);
      
      // Don't show our own CHAT messages (already added when sending)
      if (message.sender === this.username && message.type === 'CHAT') {
        return;
      }
      
      const now = new Date();
      const formattedMessage: Message = {
        sender: message.sender,
        content: message.content || '',
        type: message.type,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now,
        messageClass: message.type === 'JOIN' || message.type === 'LEAVE' ? 'notification' : 'other-message',
        status: 'delivered',
        reactions: {},
        isEditing: false
      };
      
      // Format JOIN/LEAVE messages
      if (message.type === 'JOIN') {
        formattedMessage.content = `${message.sender} joined the chat`;
      } else if (message.type === 'LEAVE') {
        formattedMessage.content = `${message.sender} left the chat`;
      }
      
      this.messages.push(formattedMessage);
      this.scrollToBottom();
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }

  sendMessage(): void {
    if (!this.newMessage || this.newMessage.trim() === "") {
      return;
    }
    
    if (!this.isConnected) {
      alert('Not connected to server. Please wait...');
      return;
    }
    
    const now = new Date();
    const message: Message = {
      sender: this.username,
      content: this.newMessage,
      type: 'CHAT',
      messageClass: 'my-message',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now,
      isEditing: false,
      status: 'sending',
      replyTo: this.replyingTo,
      reactions: {}
    };
    
    this.messages.push(message);
    
    try {
      this.stompClient?.send(
        "/app/chat.sendMessage",
        {},
        JSON.stringify({
          sender: this.username,
          content: this.newMessage,
          type: 'CHAT'
        })
      );
      
      setTimeout(() => message.status = 'sent', 300);
      setTimeout(() => message.status = 'delivered', 800);
      setTimeout(() => message.status = 'read', 2000);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      message.status = 'sent';
    }
    
    this.newMessage = '';
    this.replyingTo = null;
    this.scrollToBottom();
    this.isEmojiPickerOpen = false;
  }

  showSystemNotification(text: string): void {
    const now = new Date();
    this.messages.push({
      sender: 'System',
      content: text,
      type: 'NOTIFICATION',
      messageClass: 'notification',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now,
      isEditing: false,
      reactions: {}
    });
    this.scrollToBottom();
  }

  simulateTyping(): void {
    setInterval(() => {
      if (this.isConnected && Math.random() > 0.8) {
        const randomUser = this.groupMembers[Math.floor(Math.random() * (this.groupMembers.length - 1)) + 1];
        this.typingUsers = [randomUser.name];
        setTimeout(() => this.typingUsers = [], 3000);
      }
    }, 10000);
  }

  // Header Actions
  toggleHeaderMenu(): void {
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  performHeaderAction(action: string): void {
    if (action === 'About') {
      this.isAboutModalOpen = true;
    } else if (action === 'Search') {
      this.isSearchOpen = !this.isSearchOpen;
      this.searchQuery = '';
    } else if (action === 'Clear Chat') {
      this.clearChat();
    } else if (action === 'Starred') {
      this.isStarredMessagesOpen = true;
    }
    this.isHeaderMenuOpen = false;
  }

  get filteredMessages(): Message[] {
    if (!this.searchQuery.trim()) return this.messages;
    return this.messages.filter(m =>
      m.content.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get starredMessages(): Message[] {
    return this.messages.filter(m => m.isStarred);
  }

  toggleStar(msg: Message): void {
    msg.isStarred = !msg.isStarred;
    this.isMenuVisible = false;
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.context-menu')) {
      this.isMenuVisible = false;
    }

    if (!target.closest('.header-options')) {
      this.isHeaderMenuOpen = false;
    }

    if (!target.closest('.emoji-picker') && !target.closest('.emoji-btn')) {
      this.isEmojiPickerOpen = false;
    }

    if (!target.closest('.reaction-picker') && !target.closest('.reaction-trigger')) {
      this.isReactionPickerOpen = false;
    }

    if (target.classList.contains('modal-overlay')) {
      this.isAboutModalOpen = false;
      this.isDeleteModalOpen = false;
      this.isStarredMessagesOpen = false;
    }
  }

  onScroll(event: any): void {
    const element = event.target;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    this.showScrollButton = !atBottom;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messageArea = document.getElementById('messageArea');
      if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
        this.showScrollButton = false;
      }
    }, 100);
  }

  replyToMessage(msg: Message): void {
    this.replyingTo = msg;
    this.isMenuVisible = false;
    document.getElementById('messageInput')?.focus();
  }

  cancelReply(): void {
    this.replyingTo = null;
  }

  forwardMessage(msg: Message): void {
    const forwardedMsg: Message = {
      ...msg,
      sender: this.username,
      messageClass: 'my-message',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(),
      isForwarded: true,
      status: 'sent'
    };
    this.messages.push(forwardedMsg);
    this.isMenuVisible = false;
    this.scrollToBottom();
  }

  openReactionPicker(msg: Message): void {
    this.selectedMessage = msg;
    this.isReactionPickerOpen = true;
    this.isMenuVisible = false;
  }

  addReaction(msg: Message, emoji: string): void {
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const userIndex = msg.reactions[emoji].indexOf(this.username);
    if (userIndex > -1) {
      msg.reactions[emoji].splice(userIndex, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(this.username);
    }
    this.isReactionPickerOpen = false;
  }

  getReactionKeys(reactions: any): string[] {
    return Object.keys(reactions || {});
  }

  openContextMenu(event: MouseEvent, msg: Message): void {
    event.preventDefault();
    this.selectedMessage = msg;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.isMenuVisible = true;
  }

  startInlineEdit(msg: Message): void {
    msg.isEditing = true;
    this.isMenuVisible = false;
  }

  saveInlineEdit(msg: Message, newContent: string): void {
    if (newContent && newContent.trim() !== "") {
      msg.content = newContent;
    }
    msg.isEditing = false;
  }

  triggerDeleteConfirm(): void {
    this.isMenuVisible = false;
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    if (this.selectedMessage) {
      this.messages = this.messages.filter(m => m !== this.selectedMessage);
    }
    this.isDeleteModalOpen = false;
    this.selectedMessage = null;
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.selectedMessage = null;
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const currentDate = this.messages[index].date;
    const previousDate = this.messages[index - 1].date;
    return currentDate.toDateString() !== previousDate.toDateString();
  }

  getDateLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  clearChat(): void {
    if (confirm('Are you sure you want to clear all messages?')) {
      this.messages = [];
      this.isHeaderMenuOpen = false;
    }
  }

  addEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.isEmojiPickerOpen = false;
  }

  triggerFileSelect(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  handleFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const now = new Date();
        const fileMsg: Message = {
          sender: this.username,
          content: file.name,
          type: 'CHAT',
          messageClass: 'my-message',
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: now,
          isEditing: false,
          status: 'sent',
          mediaUrl: e.target.result,
          mediaType: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document',
          reactions: {}
        };
        this.messages.push(fileMsg);
        this.scrollToBottom();
      };
      reader.readAsDataURL(file);
    }
  }

  async openCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      alert("Camera accessed! (Feature in development)");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert("Camera access denied or not available.");
    }
  }

  startVoiceRecording(): void {
    const now = new Date();
    const voiceMsg: Message = {
      sender: this.username,
      content: 'Voice message',
      type: 'CHAT',
      messageClass: 'my-message',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now,
      isEditing: false,
      status: 'sent',
      isVoiceMessage: true,
      voiceDuration: '0:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
      reactions: {}
    };
    this.messages.push(voiceMsg);
    this.scrollToBottom();
  }

  getSenderAvatar(sender: string): string {
    const member = this.groupMembers.find(m => m.name === sender);
    return member?.avatar || `https://ui-avatars.com/api/?name=${sender}&background=667781&color=fff`;
  }
}