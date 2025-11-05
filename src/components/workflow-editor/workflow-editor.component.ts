import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, viewChild, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkflowService } from '../../services/workflow.service';
import { MLOpsPanelComponent } from '../mlops-panel/mlops-panel.component';

@Component({
  selector: 'app-workflow-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, MLOpsPanelComponent],
  templateUrl: './workflow-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowEditorComponent implements OnInit {
  workflowService = inject(WorkflowService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  workflowName = computed(() => this.workflowService.activeWorkflowName());
  isEditingName = signal(false);
  nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const workflowId = params.get('id');
      if (workflowId) {
        const success = this.workflowService.loadWorkflow(workflowId);
        if (!success) {
          this.router.navigate(['/']);
        }
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  editName() {
    this.isEditingName.set(true);
    setTimeout(() => {
        this.nameInput()?.nativeElement.focus();
        this.nameInput()?.nativeElement.select();
    }, 0);
  }

  saveName(event: Event) {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    if (newName && newName !== this.workflowName()) {
        this.workflowService.updateWorkflowName(newName);
    }
    this.isEditingName.set(false);
  }

  cancelEditName() {
    this.isEditingName.set(false);
  }
}
