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
  isAboutModalOpen = false;   // NEW: For Group Info/About
  menuX = 0;
  menuY = 0;
  selectedMessage: any = null;

  // NEW: Mock data for Group Members
  groupMembers = [
    { name: 'You', status: 'Online' },
    { name: 'John Doe', status: 'Away' },
    { name: 'Jane Smith', status: 'Online' },
    { name: 'Alice Johnson', status: 'Offline' }
  ];

  ngOnInit() {
    this.connect();
  }

  // --- Header Actions Update ---
  toggleHeaderMenu() {
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  performHeaderAction(action: string) {
    if (action === 'About') {
      this.isAboutModalOpen = true; // Open the info modal
    } else if (action === 'Search') {
      alert("Search feature coming soon!");
    } else if (action === 'Starred Text') {
      alert("No starred messages yet.");
    }
    this.isHeaderMenuOpen = false;
  }

  // --- Global Click Listener Update ---
  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.context-menu')) this.isMenuVisible = false;
    
    // Close 3-dot menu if clicking outside
    if (!target.closest('.header-options')) this.isHeaderMenuOpen = false;

    // Close emoji picker if clicking outside
    if (!target.closest('.emoji-picker') && !target.closest('.icon-btn')) {
      this.isEmojiPickerOpen = false;
    }

    // NEW: Close About Modal if clicking the backdrop (overlay)
    if (target.classList.contains('modal-overlay')) {
      this.isAboutModalOpen = false;
    }
  }

  // --- Rest of your existing logic (sendMessage, connect, etc.) ---
  sendMessage() {
    if (this.newMessage && this.newMessage.trim() !== "") {
      const now = new Date();
      this.messages.push({
        sender: this.username,
        content: this.newMessage,
        type: 'CHAT',
        messageClass: 'my-message',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEditing: false
      });
      this.newMessage = ''; 
      this.scrollToBottom();
      this.isEmojiPickerOpen = false;
    }
  }

  startInlineEdit(msg: any) {
    msg.isEditing = true;
    this.isMenuVisible = false;
  }

  saveInlineEdit(msg: any, newContent: string) {
    if (newContent.trim() !== "") msg.content = newContent;
    msg.isEditing = false;
  }

  cancelEdit(msg: any) { msg.isEditing = false; }

  clearChat() {
    this.messages = [];
    this.isHeaderMenuOpen = false;
  }

  addEmoji(emoji: string) { this.newMessage += emoji; }

  triggerFileSelect() { document.getElementById('fileInput')?.click(); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const now = new Date();
      this.messages.push({
        sender: this.username,
        content: `Attached File: ${file.name}`,
        type: 'CHAT',
        messageClass: 'my-message',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFile: true
      });
      this.scrollToBottom();
    }
  }

  async openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      alert("Camera accessed!");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) { alert("Camera error."); }
  }

  openContextMenu(event: MouseEvent, msg: any) {
    event.preventDefault();
    this.isMenuVisible = true;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.selectedMessage = msg;
  }

  deleteMsg() {
    this.messages = this.messages.filter(m => m !== this.selectedMessage);
    this.isMenuVisible = false;
  }

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