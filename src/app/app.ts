import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import SockJS from 'sockjs-client'; 
import { Stomp, CompatClient, IMessage } from '@stomp/stompjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private stompClient: CompatClient | null = null;
  username: string = "User_" + Math.floor(Math.random() * 1000);
  chatPartner: string = "Public Group";
  newMessage: string = '';
  messages: any[] = [];

  // --- UI State Variables ---
  isMenuVisible = false;      
  isHeaderMenuOpen = false;   
  isEmojiPickerOpen = false;  
  isAboutModalOpen = false;   
  isDeleteModalOpen = false;
  
  menuX = 0;
  menuY = 0;
  selectedMessage: any = null;

  // Emoji list
  emojis = ['😀', '😂', '😍', '🥰', '😎', '😢', '😭', '😡', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💯'];

  groupMembers = [
    { name: 'You', status: 'Online' },
    { name: 'John Doe', status: 'Away' },
    { name: 'Jane Smith', status: 'Online' },
    { name: 'Alice Johnson', status: 'Offline' }
  ];

  ngOnInit() {
    this.connect();
  }

  // --- Header Actions ---
  toggleHeaderMenu() {
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  performHeaderAction(action: string) {
    if (action === 'About') {
      this.isAboutModalOpen = true; 
    } else if (action === 'Search') {
      alert("Search feature coming soon!");
    } else if (action === 'Clear Chat') {
      this.clearChat();
    }
    this.isHeaderMenuOpen = false;
  }

  // --- Global Click Listener ---
  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close right-click menu if clicking elsewhere
    if (!target.closest('.context-menu')) {
      this.isMenuVisible = false;
    }
    
    // Close 3-dot header menu
    if (!target.closest('.header-options')) {
      this.isHeaderMenuOpen = false;
    }

    // Close emoji picker
    if (!target.closest('.emoji-picker') && !target.closest('.emoji-btn')) {
      this.isEmojiPickerOpen = false;
    }

    // Close modals if clicking the backdrop (overlay)
    if (target.classList.contains('modal-overlay')) {
      this.isAboutModalOpen = false;
      this.isDeleteModalOpen = false;
    }
  }

  // --- Message Logic ---
  sendMessage() {
    if (this.newMessage && this.newMessage.trim() !== "") {
      const now = new Date();
      const message = {
        sender: this.username,
        content: this.newMessage,
        type: 'CHAT',
        messageClass: 'my-message',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEditing: false
      };
      
      this.messages.push(message);
      
      // Send via WebSocket if connected
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.send("/app/chat.sendMessage", {}, JSON.stringify({
          sender: this.username,
          content: this.newMessage,
          type: 'CHAT'
        }));
      }
      
      this.newMessage = ''; 
      this.scrollToBottom();
      this.isEmojiPickerOpen = false;
    }
  }

  // --- Edit & Delete Logic ---
  
  openContextMenu(event: MouseEvent, msg: any) {
    event.preventDefault();
    this.selectedMessage = msg;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.isMenuVisible = true;
  }

  startInlineEdit(msg: any) {
    msg.isEditing = true;
    this.isMenuVisible = false;
  }

  saveInlineEdit(msg: any, newContent: string) {
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
      alert(`File selected: ${file.name}`);
      // Here you can add file upload logic
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
      messageClass: message.type === 'JOIN' ? 'notification' : 'other-message'
    });
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      const messageArea = document.getElementById('messageArea');
      if (messageArea) messageArea.scrollTop = messageArea.scrollHeight;
    }, 100);
  }
}