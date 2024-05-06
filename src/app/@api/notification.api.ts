import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Notification, Dataset } from '@buildcore/interfaces';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class NotificationApi extends BaseApi<Notification> {
  private notificationDataset = this.project.dataset(Dataset.NOTIFICATION);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.NOTIFICATION, httpClient);
  }

  public topMember = (memberUid: string, lastValue?: string, limit?: number) =>
    this.notificationDataset.getByMemberLive(memberUid, lastValue, limit);
}
