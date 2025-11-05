import { ChangeDetectionStrategy, Component, inject, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var marked: { parse(md: string): string; };

@Component({
  selector: 'app-agent-cell',
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCellComponent {
  geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);
  
  chatHistory = this.geminiService.chatHistory;
  userInput = signal('');
  isHistoryExpanded = signal(false);
  
  private scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      // Trigger scroll whenever history changes
      if (this.isHistoryExpanded()) {
        this.chatHistory(); 
        this.scrollToBottom();
      }
    });
  }

  sendMessage() {
    const message = this.userInput().trim();
    if (!message) return;
    this.geminiService.sendMessage(message);
    this.userInput.set('');
    this.isHistoryExpanded.set(true); // Expand history when a message is sent.
  }

  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';
    const rawHtml = marked.parse(content);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.scrollContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
}
