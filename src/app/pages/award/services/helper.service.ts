import { Injectable } from '@angular/core';
import { Award } from '@build-5/interfaces';
import dayjs from 'dayjs';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  public getExperiencePointsPerBadge(award: Award | undefined | null): number {
    if (award?.badge?.tokenReward && award.badge.tokenReward > 0 && award?.badge?.total > 1) {
      return (award.badge.tokenReward || 0) / (award.badge.total || 0);
    } else {
      return award?.badge?.tokenReward || 0;
    }
  }

  public isCompleted(award: Award | undefined | null): boolean {
    if (!award) {
      return false;
    }

    return (
      award.issued >= award.badge.total ||
      (dayjs(award?.endDate.toDate()).isBefore(dayjs()) && award.approved)
    );
  }

  public getShareUrl(award?: Award | null): string {
    return award?.wenUrl || window?.location.href;
  }
}
