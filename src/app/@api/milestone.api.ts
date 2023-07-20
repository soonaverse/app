import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Milestone, PublicCollections } from '@build-5/interfaces';
import { BaseApi, SOON_ENV } from './base.api';
import { MilestoneRepository } from '@build-5/lib';

@Injectable({
  providedIn: 'root',
})
export class MilestoneApi extends BaseApi<Milestone> {
  protected milestoneRepo = new MilestoneRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.MILESTONE, httpClient);
  }

  public getTopMilestonesLive = () => this.milestoneRepo.getTopMilestonesLive();
}
