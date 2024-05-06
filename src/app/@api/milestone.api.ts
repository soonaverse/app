import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Milestone, Dataset } from '@buildcore/interfaces';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class MilestoneApi extends BaseApi<Milestone> {
  protected milestoneDataset = this.project.dataset(Dataset.MILESTONE);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.MILESTONE, httpClient);
  }

  public getTopMilestonesLive = () => this.milestoneDataset.getTopLive();
}
