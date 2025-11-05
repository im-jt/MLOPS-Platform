import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PlatformArchitectureService } from '../../services/platform-architecture.service';
import { PlatformPlaneId } from '../../models/platform-architecture.model';

type OverviewTab = 'pillars' | 'planes' | 'tiers' | 'mes' | 'genai';

@Component({
  selector: 'app-architecture-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
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

  readonly selectedPlaneId = signal<PlatformPlaneId>('control');
  readonly selectedTab = signal<OverviewTab>('planes');

  readonly expandedDomains = signal<Record<string, boolean>>({});

  readonly selectedPlane = computed(() =>
    this.planes().find((plane) => plane.id === this.selectedPlaneId()) ?? this.planes()[0],
  );

  readonly planeLifecycleSummary = computed(() => {
    const plane = this.selectedPlane();
    if (!plane) {
      return {};
    }
    const summary: Record<string, number> = {};
    for (const domain of plane.domains) {
      for (const component of domain.components) {
        summary[component.lifecycle] = (summary[component.lifecycle] ?? 0) + 1;
      }
    }
    return summary;
  });

  readonly planeSourceSummary = computed(() => {
    const plane = this.selectedPlane();
    if (!plane) {
      return {};
    }
    const summary: Record<string, number> = {};
    for (const domain of plane.domains) {
      for (const component of domain.components) {
        summary[component.source] = (summary[component.source] ?? 0) + 1;
      }
    }
    return summary;
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
}
