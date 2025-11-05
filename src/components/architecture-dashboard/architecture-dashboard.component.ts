import { ChangeDetectionStrategy, Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformArchitectureService } from '../../services/platform-architecture.service';
import {
  ComponentApproval,
  ComponentLifecycle,
  PlatformComponent,
  PlatformPlaneId,
  PlaneTelemetry,
} from '../../models/platform-architecture.model';

type OverviewTab = 'pillars' | 'planes' | 'tiers' | 'mes' | 'genai';

@Component({
  selector: 'app-architecture-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './architecture-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureDashboardComponent {
  private architectureService = inject(PlatformArchitectureService);

  readonly lastUpdated = this.architectureService.lastUpdated;
  readonly pillars = this.architectureService.pillars;
  readonly planes = this.architectureService.planes;
  readonly tiers = this.architectureService.tiers;
  readonly mesDimensions = this.architectureService.mesDimensions;
  readonly genAiCapabilities = this.architectureService.genAiCapabilities;
  readonly telemetry = this.architectureService.telemetry;
  readonly isLoading = this.architectureService.isLoading;
  readonly error = this.architectureService.error;

  readonly selectedPlaneId = signal<PlatformPlaneId>('control');
  readonly selectedTab = signal<OverviewTab>('planes');

  readonly expandedDomains = signal<Record<string, boolean>>({});
  private readonly pendingLifecycle = signal<Record<string, boolean>>({});
  private readonly pendingApprovalUpdates = signal<Record<string, boolean>>({});
  readonly openApprovalComponentId = signal<string | null>(null);
  readonly approvalForm = signal<{ requestedBy: string; notes: string }>({ requestedBy: '', notes: '' });
  readonly pendingApprovalRequest = signal<boolean>(false);
  readonly lifecycleOptions: ComponentLifecycle[] = ['planned', 'in-experiment', 'active', 'deprecated'];

  readonly selectedPlane = computed(() =>
    this.planes().find((plane) => plane.id === this.selectedPlaneId()) ?? this.planes()[0],
  );

  readonly planeTelemetry = computed<PlaneTelemetry | null>(() => {
    const plane = this.selectedPlane();
    if (!plane) {
      return null;
    }
    return this.telemetry().find((entry) => entry.planeId === plane.id) ?? null;
  });

  readonly planeLifecycleSummary = computed(() => {
    const telemetry = this.planeTelemetry();
    if (telemetry) {
      return telemetry.lifecycleBreakdown;
    }
    return this.computeLifecycleFallback();
  });

  readonly planeSourceSummary = computed(() => {
    const telemetry = this.planeTelemetry();
    if (telemetry) {
      return telemetry.sourceBreakdown;
    }
    return this.computeSourceFallback();
  });

  selectTab(tab: OverviewTab): void {
    this.selectedTab.set(tab);
  }

  selectPlane(planeId: PlatformPlaneId): void {
    this.selectedPlaneId.set(planeId);
  }

  toggleDomain(domainId: string): void {
    this.expandedDomains.update((state) => ({
      ...state,
      [domainId]: !state[domainId],
    }));
  }

  isDomainExpanded(domainId: string): boolean {
    return !!this.expandedDomains()[domainId];
  }

  isLifecycleUpdating(componentId: string): boolean {
    return !!this.pendingLifecycle()[componentId];
  }

  isApprovalUpdating(approvalId: string): boolean {
    return !!this.pendingApprovalUpdates()[approvalId];
  }

  openApprovalForm(component: PlatformComponent): void {
    this.openApprovalComponentId.set(component.id);
    this.approvalForm.set({ requestedBy: '', notes: '' });
  }

  closeApprovalForm(): void {
    this.openApprovalComponentId.set(null);
    this.approvalForm.set({ requestedBy: '', notes: '' });
    this.pendingApprovalRequest.set(false);
  }

  async onLifecycleChange(component: PlatformComponent, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const nextLifecycle = select.value as ComponentLifecycle;
    const previousLifecycle = component.lifecycle;
    this.updatePendingRecord(this.pendingLifecycle, component.id, true);
    const result = await this.architectureService.setComponentLifecycle(component.id, nextLifecycle);
    if (!result) {
      select.value = previousLifecycle;
    }
    this.updatePendingRecord(this.pendingLifecycle, component.id, false);
  }

  async submitApproval(component: PlatformComponent): Promise<void> {
    const form = this.approvalForm();
    if (!form.requestedBy.trim()) {
      return;
    }
    this.pendingApprovalRequest.set(true);
    const result = await this.architectureService.requestComponentApproval(
      component.id,
      form.requestedBy.trim(),
      form.notes?.trim() || undefined,
    );
    if (result) {
      this.closeApprovalForm();
    } else {
      this.pendingApprovalRequest.set(false);
    }
  }

  async updateApprovalStatus(
    component: PlatformComponent,
    approval: ComponentApproval,
    status: ComponentApproval['status'],
  ): Promise<void> {
    if (approval.status === status) {
      return;
    }
    this.updatePendingRecord(this.pendingApprovalUpdates, approval.id, true);
    await this.architectureService.updateApprovalStatus(component.id, approval.id, status);
    this.updatePendingRecord(this.pendingApprovalUpdates, approval.id, false);
  }

  private computeLifecycleFallback(): Record<string, number> {
    const plane = this.selectedPlane();
    if (!plane) {
      return {};
    }
    const summary: Record<string, number> = {};
    for (const domain of plane.domains) {
      for (const component of domain.components ?? []) {
        summary[component.lifecycle] = (summary[component.lifecycle] ?? 0) + 1;
      }
    }
    return summary;
  }

  private computeSourceFallback(): Record<string, number> {
    const plane = this.selectedPlane();
    if (!plane) {
      return {};
    }
    const summary: Record<string, number> = {};
    for (const domain of plane.domains) {
      for (const component of domain.components ?? []) {
        summary[component.source] = (summary[component.source] ?? 0) + 1;
      }
    }
    return summary;
  }

  private updatePendingRecord(target: WritableSignal<Record<string, boolean>>, key: string, value: boolean): void {
    target.update((state) => {
      const next = { ...state };
      if (value) {
        next[key] = true;
      } else {
        delete next[key];
      }
      return next;
    });
  }
}
