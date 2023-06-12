import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Notification, PublicCollections } from '@build-5/interfaces';
import { NotificationRepository } from '@build-5/lib';
import { BaseApi, SOON_ENV } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class NotificationApi extends BaseApi<Notification> {
  private notificationRepo = new NotificationRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.NOTIFICATION, httpClient);
  }

  public topMember = (memberUid: string, lastValue?: string, limit?: number) =>
    this.notificationRepo.getByMemberLive(memberUid, lastValue, limit);
}
