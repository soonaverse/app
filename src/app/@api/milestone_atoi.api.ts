import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Milestone, PublicCollections } from '@build-5/interfaces';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class MilestoneAtoiApi extends BaseApi<Milestone> {
  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.MILESTONE_ATOI, httpClient);
  }
}
