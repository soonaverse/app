import { Injectable } from '@angular/core';
import { SelectCollectionOption } from '@components/collection/components/select-collection/select-collection.component';
import { SelectSpaceOption } from '@components/space/components/select-space/select-space.component';
import { Collection, Space, Token, TokenDrop, TokenStatus } from '@soonaverse/interfaces';
import dayjs from 'dayjs';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  public preMinted(token: Token): boolean {
    return token.status === TokenStatus.PRE_MINTED;
  }

  public isMinted(token: Token): boolean {
    return token.status === TokenStatus.MINTED || token.status === TokenStatus.BASE;
  }

  public salesInProgressOrUpcoming(token: Token): boolean {
    return (
      !!token.saleStartDate &&
      dayjs(token.saleStartDate?.toDate()).isBefore(dayjs()) &&
      token?.status !== TokenStatus.PRE_MINTED &&
      token?.approved
    );
  }

  public vestingInFuture(drop: TokenDrop): boolean {
    return dayjs(drop.vestingAt.toDate()).isAfter(dayjs());
  }

  public isInCooldown(token?: Token): boolean {
    return (
      !!token?.approved &&
      (token?.status === TokenStatus.AVAILABLE || token?.status === TokenStatus.PROCESSING) &&
      dayjs(token?.coolDownEnd?.toDate()).isAfter(dayjs()) &&
      dayjs(token?.saleStartDate?.toDate())
        .add(token?.saleLength || 0, 'ms')
        .isBefore(dayjs())
    );
  }

  public getCollectionListOptions(list?: Collection[] | null): SelectCollectionOption[] {
    return (list || [])
      .filter((o) => o.rejected !== true)
      .map((o) => ({
        label: o.name || o.uid,
        value: o.uid,
        img: o.bannerUrl,
      }));
  }

  public getSpaceListOptions(list?: Space[] | null): SelectSpaceOption[] {
    return (list || []).map((o) => ({
      label: o.name || o.uid,
      value: o.uid,
      img: o.avatarUrl,
    }));
  }
}
