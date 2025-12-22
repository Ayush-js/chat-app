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
  isMenuVisible = false;      // Message context menu
  isHeaderMenuOpen = false;   // 3-dot header menu
  isEmojiPickerOpen = false;  // Emoji panel
  menuX = 0;
  menuY = 0;
  selectedMessage: any = null;

  ngOnInit() {
    this.connect();
  }

  // --- 1. Message Logic (Timestamps & Sending) ---
  sendMessage() {
    if (this.newMessage && this.newMessage.trim() !== "") {
      const now = new Date();
      this.messages.push({
        sender: this.username,
        content: this.newMessage,
        type: 'CHAT',
        messageClass: 'my-message',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEditing: false // Track if this specific message is being edited
      });

      this.newMessage = ''; 
      this.scrollToBottom();
      this.isEmojiPickerOpen = false;
    }
  }

  // --- 2. Inline Editing Logic ---
  startInlineEdit(msg: any) {
    msg.isEditing = true;
    this.isMenuVisible = false; // Hide context menu
  }

  saveInlineEdit(msg: any, newContent: string) {
    if (newContent.trim() !== "") {
      msg.content = newContent;
    }
    msg.isEditing = false;
  }

  cancelEdit(msg: any) {
    msg.isEditing = false;
  }

  // --- 3. Header & 3-Dot Menu Actions ---
  toggleHeaderMenu() {
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  clearChat() {
    this.messages = [];
    this.isHeaderMenuOpen = false;
  }

  // These can be expanded later with search logic or backend calls
  performHeaderAction(action: string) {
    console.log(`Action performed: ${action}`);
    alert(`${action} feature clicked!`);
    this.isHeaderMenuOpen = false;
  }

  // --- 4. Emoji, File & Camera Logic ---
  addEmoji(emoji: string) {
    this.newMessage += emoji;
  }

  triggerFileSelect() {
    document.getElementById('fileInput')?.click();
  }

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
      alert("Camera accessed successfully! (Viewfinder would show here in production)");
      // Stop the camera stream after testing access
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  }

  // --- Context Menu & Global Listeners ---
  openContextMenu(event: MouseEvent, msg: any) {
    event.preventDefault();
    this.isMenuVisible = true;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.selectedMessage = msg;
  }

  @HostListener('document:click')
  closeMenus() {
    this.isMenuVisible = false;
    this.isHeaderMenuOpen = false;
    // We don't close emoji picker here so user can click multiple emojis
  }

  deleteMsg() {
    this.messages = this.messages.filter(m => m !== this.selectedMessage);
    this.isMenuVisible = false;
  }

  // --- WebSocket & Utils ---
  connect() {
    const socket = new (SockJS as any)('http://localhost:8080/ws'); 
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect({}, 
      () => this.onConnected(), 
      (err: any) => this.onError(err)
    );
  }

  onConnected() {
    this.stompClient?.subscribe('/topic/public-chat', (payload: IMessage) => {
      this.onMessageReceived(payload);
    });
    this.stompClient?.send("/app/chat.addUser", {}, JSON.stringify({ sender: this.username, type: 'JOIN' }));
  }

  onError(error: any) { console.error("WebSocket Error", error); }

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