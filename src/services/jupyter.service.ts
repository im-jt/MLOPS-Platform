import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { NotebookService } from './notebook.service';
import { Cell } from '../models/notebook-cell.model';

// A simplified Jupyter message structure
interface JupyterMessage {
  header: {
    msg_id: string;
    session: string;
    username: string;
    date: string;
    msg_type: string;
    version: string;
  };
  parent_header: {
    msg_id?: string;
  };
  metadata: {};
  content: any;
  buffers?: any[];
}

interface PendingRequest {
  output: string;
  cellId?: number;
  resolve?: (output: string) => void;
  reject?: (error: any) => void;
}

@Injectable({
  providedIn: 'root',
})
export class JupyterService implements OnDestroy {
  private notebookService = inject(NotebookService);
  
  // Assumes a Jupyter server is running on localhost:8888 without authentication
  private JUPYTER_URL = 'http://localhost:8888'; 
  private JUPYTER_WS_URL = 'ws://localhost:8888'; 
  
  private kernelId = signal<string | null>(null);
  private sessionId = signal<string>(crypto.randomUUID());
  private kernelSocket: WebSocket | null = null;
  private pendingRequests = new Map<string, PendingRequest>(); // msg_id -> PendingRequest
  private connectionStatus = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  constructor() {
    this.startKernel();
  }

  ngOnDestroy() {
    this.kernelSocket?.close();
  }

  private async startKernel() {
    this.connectionStatus.set('connecting');
    try {
      // NOTE: This fetch request may be blocked by CORS if the Jupyter server is not configured correctly.
      // You need to run jupyter server with --ServerApp.allow_origin='*' or your specific origin.
      const response = await fetch(`${this.JUPYTER_URL}/api/kernels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'python3' }),
      });
      if (!response.ok) {
        throw new Error(`Failed to start kernel: ${response.statusText}`);
      }
      const kernel = await response.json();
      this.kernelId.set(kernel.id);
      this.connectToKernel();
    } catch (error) {
      console.error('Could not start Jupyter kernel. Please ensure a Jupyter server is running on localhost:8888 and that it allows CORS.', error);
      this.connectionStatus.set('error');
    }
  }

  private connectToKernel() {
    const kernelId = this.kernelId();
    if (!kernelId) return;

    this.kernelSocket = new WebSocket(`${this.JUPYTER_WS_URL}/api/kernels/${kernelId}/channels?session_id=${this.sessionId()}`);

    this.kernelSocket.onopen = () => {
      console.log('Jupyter kernel connection established.');
      this.connectionStatus.set('connected');
    };

    this.kernelSocket.onmessage = (event) => {
      this.handleKernelMessage(JSON.parse(event.data));
    };

    this.kernelSocket.onerror = (error) => {
      console.error('Jupyter WebSocket error:', error);
      this.connectionStatus.set('error');
    };

    this.kernelSocket.onclose = () => {
      console.log('Jupyter kernel connection closed.');
      this.kernelSocket = null;
      this.connectionStatus.set('disconnected');
    };
  }

  private createExecuteRequest(code: string): { msg_id: string, message: JupyterMessage } {
    const msg_id = crypto.randomUUID();
    const message: JupyterMessage = {
      header: {
        msg_id,
        session: this.sessionId(),
        username: 'user',
        date: new Date().toISOString(),
        msg_type: 'execute_request',
        version: '5.3',
      },
      parent_header: {},
      metadata: {},
      content: {
        code,
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
      },
    };
    return { msg_id, message };
  }

  executeCode(code: string, cellId: number): Promise<string> {
    if (this.connectionStatus() !== 'connected' || !this.kernelSocket) {
      const errorMessage = 'Error: Jupyter kernel not connected. Please start a Jupyter server on localhost:8888 and refresh.';
      console.error(errorMessage);
      this.notebookService.updateCell(cellId, { output: errorMessage, isExecuting: false });
      return Promise.reject(errorMessage);
    }
    
    return new Promise((resolve, reject) => {
        const { msg_id, message } = this.createExecuteRequest(code);
        
        this.pendingRequests.set(msg_id, { cellId, output: '', resolve, reject });
        // Clear previous output and set executing state
        this.notebookService.updateCell(cellId, { isExecuting: true, output: '' });
        this.kernelSocket.send(JSON.stringify(message));
    });
  }
  
  executeForAgent(code: string): Promise<string> {
    if (this.connectionStatus() !== 'connected' || !this.kernelSocket) {
        return Promise.reject('Jupyter kernel not connected.');
    }
    return new Promise((resolve, reject) => {
      const { msg_id, message } = this.createExecuteRequest(code);
      this.pendingRequests.set(msg_id, { output: '', resolve, reject });
      this.kernelSocket.send(JSON.stringify(message));
    });
  }

  async interruptKernel(): Promise<void> {
    const kernelId = this.kernelId();
    if (!kernelId || this.connectionStatus() !== 'connected') {
      console.warn('Cannot interrupt, kernel not connected.');
      return;
    }
    try {
      const response = await fetch(`${this.JUPYTER_URL}/api/kernels/${kernelId}/interrupt`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to interrupt kernel: ${response.statusText}`);
      }
      console.log('Kernel interrupt request sent.');
      
      // Proactively mark all pending cells as interrupted.
      // The kernel will eventually send 'idle' status, but this provides immediate UI feedback.
      for (const [msgId, request] of this.pendingRequests.entries()) {
        if (request.cellId) {
          this.notebookService.updateCell(request.cellId, {
            isExecuting: false,
            output: (request.output || '') + '\n[Execution Interrupted by User]'
          });
        }
        request.reject?.(new Error('Execution Interrupted by User'));
        this.pendingRequests.delete(msgId);
      }

    } catch (error) {
      console.error('Error interrupting Jupyter kernel:', error);
    }
  }

  private handleKernelMessage(msg: JupyterMessage) {
    const parent_msg_id = msg.parent_header.msg_id;
    if (!parent_msg_id || !this.pendingRequests.has(parent_msg_id)) {
      return;
    }

    const request = this.pendingRequests.get(parent_msg_id)!;
    const msgType = msg.header.msg_type;

    switch (msgType) {
      case 'status':
        if (msg.content.execution_state === 'idle') {
          if (request.cellId) {
            this.notebookService.updateCell(request.cellId, { isExecuting: false });
          }
          request.resolve?.(request.output);
          this.pendingRequests.delete(parent_msg_id);
        }
        break;

      case 'execute_input':
        if (request.cellId) {
          this.notebookService.updateCell(request.cellId, { executionCount: msg.content.execution_count });
        }
        break;

      case 'stream':
        const streamContent = msg.content.text;
        request.output += streamContent;
        if (request.cellId) {
          this.notebookService.appendCellOutput(request.cellId, streamContent);
        }
        break;

      case 'execute_result':
      case 'display_data':
        const data = msg.content.data['text/plain'] || '';
        const dataWithNewline = data + '\n';
        request.output += dataWithNewline;
        if (request.cellId) {
          this.notebookService.appendCellOutput(request.cellId, dataWithNewline);
        }
        break;
      
      case 'error':
        const traceback = msg.content.traceback.join('\n');
        request.output = traceback;
        if (request.cellId) {
          this.notebookService.updateCell(request.cellId, { output: traceback });
        }
        request.reject?.(traceback);
        // Don't delete yet, wait for idle status
        break;
    }
  }
}