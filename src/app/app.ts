import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
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
export class AppComponent implements OnInit {
  @ViewChild('messageArea') messageArea!: ElementRef;
  
  private stompClient: CompatClient | null = null;
  username: string = "User_" + Math.floor(Math.random() * 1000);
  chatPartner: string = "Public Group";
  newMessage: string = '';
  messages: Message[] = [];

  // --- UI State Variables ---
  isMenuVisible = false;      
  isHeaderMenuOpen = false;   
  isEmojiPickerOpen = false;  
  isAboutModalOpen = false;   
  isDeleteModalOpen = false;
  isReactionPickerOpen = false;
  isSearchOpen = false;
  isStarredMessagesOpen = false;
  showScrollButton = false;
  isTyping = false;
  typingUsers: string[] = [];
  
  menuX = 0;
  menuY = 0;
  selectedMessage: any = null;
  replyingTo: any = null;
  searchQuery: string = '';
  unreadCount = 0;
  
  // Emoji lists
  emojis = ['😀', '😂', '😍', '🥰', '😎', '😢', '😭', '😡', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💯'];
  reactionEmojis = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

  groupMembers = [
    { name: 'You', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=You&background=00a884&color=fff' },
    { name: 'John Doe', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=667781&color=fff' },
    { name: 'Jane Smith', status: 'typing...', avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=667781&color=fff' },
    { name: 'Alice Johnson', status: 'Online', avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=667781&color=fff' }
  ];

  ngOnInit() {
    this.connect();
    this.simulateTyping();
  }

  // --- Simulate typing indicator ---
  simulateTyping() {
    setInterval(() => {
      const randomUser = this.groupMembers[Math.floor(Math.random() * (this.groupMembers.length - 1)) + 1];
      if (Math.random() > 0.7) {
        this.typingUsers = [randomUser.name];
        setTimeout(() => this.typingUsers = [], 3000);
      }
    }, 8000);
  }

  // --- Header Actions ---
  toggleHeaderMenu() {
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  performHeaderAction(action: string) {
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

  // --- Search Messages ---
  get filteredMessages() {
    if (!this.searchQuery.trim()) return this.messages;
    return this.messages.filter(m => 
      m.content.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // --- Starred Messages ---
  get starredMessages() {
    return this.messages.filter(m => m.isStarred);
  }

  toggleStar(msg: Message) {
    msg.isStarred = !msg.isStarred;
    this.isMenuVisible = false;
  }

  // --- Global Click Listener ---
  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent) {
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

  // --- Scroll Detection ---
  onScroll(event: any) {
    const element = event.target;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    this.showScrollButton = !atBottom;
  }

  scrollToBottom() {
    setTimeout(() => {
      const messageArea = document.getElementById('messageArea');
      if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
        this.showScrollButton = false;
      }
    }, 100);
  }

  // --- Message Logic ---
  sendMessage() {
    if (this.newMessage && this.newMessage.trim() !== "") {
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
      
      // Simulate message status progression
      setTimeout(() => message.status = 'sent', 500);
      setTimeout(() => message.status = 'delivered', 1500);
      setTimeout(() => message.status = 'read', 3000);
      
      // Send via WebSocket if connected
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.send("/app/chat.sendMessage", {}, JSON.stringify({
          sender: this.username,
          content: this.newMessage,
          type: 'CHAT'
        }));
      }
      
      this.newMessage = ''; 
      this.replyingTo = null;
      this.scrollToBottom();
      this.isEmojiPickerOpen = false;
    }
  }

  // --- Reply Feature ---
  replyToMessage(msg: Message) {
    this.replyingTo = msg;
    this.isMenuVisible = false;
    document.getElementById('messageInput')?.focus();
  }

  cancelReply() {
    this.replyingTo = null;
  }

  // --- Forward Feature ---
  forwardMessage(msg: Message) {
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

  // --- Reactions ---
  openReactionPicker(msg: Message) {
    this.selectedMessage = msg;
    this.isReactionPickerOpen = true;
    this.isMenuVisible = false;
  }

  addReaction(msg: Message, emoji: string) {
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

  // --- Edit & Delete Logic ---
  openContextMenu(event: MouseEvent, msg: Message) {
    event.preventDefault();
    this.selectedMessage = msg;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.isMenuVisible = true;
  }

  startInlineEdit(msg: Message) {
    msg.isEditing = true;
    this.isMenuVisible = false;
  }

  saveInlineEdit(msg: Message, newContent: string) {
    if (newContent && newContent.trim() !== "") {
      msg.content = newContent;
    }
    msg.isEditing = false;
  }

  triggerDeleteConfirm() {
    this.isMenuVisible = false;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    if (this.selectedMessage) {
      this.messages = this.messages.filter(m => m !== this.selectedMessage);
    }
    this.isDeleteModalOpen = false;
    this.selectedMessage = null;
  }

  cancelDelete() {
    this.isDeleteModalOpen = false;
    this.selectedMessage = null;
  }

  // --- Date Separator ---
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

  // --- Utility Methods ---
  clearChat() {
    this.messages = [];
    this.isHeaderMenuOpen = false;
  }

  addEmoji(emoji: string) { 
    this.newMessage += emoji;
    this.isEmojiPickerOpen = false;
  }

  triggerFileSelect() { 
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  handleFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Simulate file message
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

  async openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      alert("Camera accessed! (Feature in development)");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) { 
      alert("Camera access denied or not available."); 
    }
  }

  // --- Voice Message Simulation ---
  startVoiceRecording() {
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

  // --- WebSocket Logic ---
  connect() {
    const socket = new (SockJS as any)('http://localhost:8080/ws'); 
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect({}, () => this.onConnected(), (err: any) => console.error(err));
  }

  onConnected() {
    this.stompClient?.subscribe('/topic/public-chat', (payload: IMessage) => this.onMessageReceived(payload));
    this.stompClient?.send("/app/chat.addUser", {}, JSON.stringify({ sender: this.username, type: 'JOIN' }));
  }

  onMessageReceived(payload: any) {
    const message = JSON.parse(payload.body);
    if (message.sender === this.username && message.type === 'CHAT') return;
    const now = new Date();
    this.messages.push({
      ...message,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now,
      messageClass: message.type === 'JOIN' ? 'notification' : 'other-message',
      status: 'delivered',
      reactions: {}
    });
    this.scrollToBottom();
  }

  // Get sender avatar
  getSenderAvatar(sender: string): string {
    const member = this.groupMembers.find(m => m.name === sender);
    return member?.avatar || `https://ui-avatars.com/api/?name=${sender}&background=667781&color=fff`;
  }
}