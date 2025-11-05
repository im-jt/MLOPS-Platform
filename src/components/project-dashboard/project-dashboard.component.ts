import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { MLProject, ProjectTier } from '../../models/project.model';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './project-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDashboardComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);

  projects = signal<MLProject[]>([]);
  filteredProjects = computed(() => {
    const tier = this.selectedTier();
    const search = this.searchQuery().toLowerCase();
    let filtered = this.projects();

    if (tier !== 'all') {
      filtered = filtered.filter(p => p.tier === tier);
    }

    if (search) {
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.metadata.owner.toLowerCase().includes(search) ||
          p.metadata.team.toLowerCase().includes(search) ||
          p.metadata.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return filtered;
  });

  selectedTier = signal<ProjectTier | 'all'>('all');
  searchQuery = signal('');
  sortBy = signal<'name' | 'tier' | 'mes' | 'lastModified'>('lastModified');
  sortDirection = signal<'asc' | 'desc'>('desc');

  showCreateModal = signal(false);
  newProject = signal({
    name: '',
    tier: 'tier-3' as ProjectTier,
    owner: 'user@company.com',
    team: '',
    businessUnit: '',
    description: '',
    tags: '',
  });

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    const allProjects = this.projectService.getProjects();
    this.projects.set(this.sortProjects(allProjects));
  }

  sortProjects(projects: MLProject[]): MLProject[] {
    const sorted = [...projects];
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (this.sortBy()) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'tier':
          return direction * a.tier.localeCompare(b.tier);
        case 'mes':
          return direction * ((a.modelExcellenceScore || 0) - (b.modelExcellenceScore || 0));
        case 'lastModified':
          return direction * (a.metadata.lastModified - b.metadata.lastModified);
        default:
          return 0;
      }
    });

    return sorted;
  }

  filterByTier(tier: ProjectTier | 'all') {
    this.selectedTier.set(tier);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  onSortChange(sortBy: 'name' | 'tier' | 'mes' | 'lastModified') {
    if (this.sortBy() === sortBy) {
      this.sortDirection.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(sortBy);
      this.sortDirection.set('desc');
    }
    this.loadProjects();
  }

  getTierColor(tier: ProjectTier): string {
    switch (tier) {
      case 'tier-1':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'tier-2':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'tier-3':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'tier-4':
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getTierLabel(tier: ProjectTier): string {
    return tier.toUpperCase().replace('-', ' ');
  }

  getMESColor(score?: number): string {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'development':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewProject(project: MLProject) {
    this.projectService.setActiveProject(project);
    this.router.navigate(['/project', project.id]);
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.newProject.set({
      name: '',
      tier: 'tier-3',
      owner: 'user@company.com',
      team: '',
      businessUnit: '',
      description: '',
      tags: '',
    });
  }

  createProject() {
    const formData = this.newProject();
    const project = this.projectService.createProject({
      name: formData.name,
      tier: formData.tier,
      metadata: {
        owner: formData.owner,
        team: formData.team,
        businessUnit: formData.businessUnit,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        createdAt: Date.now(),
        lastModified: Date.now(),
      },
      status: 'development',
      modelExcellenceScore: 0,
    });
    this.closeCreateModal();
    this.loadProjects();
    this.viewProject(project);
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  // Helper methods for form bindings
  updateProjectName(value: string) {
    this.newProject.update(p => ({ ...p, name: value }));
  }

  updateProjectTier(value: ProjectTier) {
    this.newProject.update(p => ({ ...p, tier: value }));
  }

  updateProjectOwner(value: string) {
    this.newProject.update(p => ({ ...p, owner: value }));
  }

  updateProjectTeam(value: string) {
    this.newProject.update(p => ({ ...p, team: value }));
  }

  updateProjectBusinessUnit(value: string) {
    this.newProject.update(p => ({ ...p, businessUnit: value }));
  }

  updateProjectDescription(value: string) {
    this.newProject.update(p => ({ ...p, description: value }));
  }

  updateProjectTags(value: string) {
    this.newProject.update(p => ({ ...p, tags: value }));
  }
}
