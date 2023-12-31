import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  MIN_AMOUNT_TO_TRANSFER,
  PublicCollections,
  StakeReward,
  StakeRewardStatus,
  StakeType,
  TokenStats,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import { StakeRewardRepository } from '@build-5/lib';
import dayjs from 'dayjs';
import { Observable } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class StakeRewardApi extends BaseApi<StakeReward> {
  private stakeRewardRepo = new StakeRewardRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.STAKE_REWARD, httpClient);
  }

  /**
      "<total staked value of the user>/<total staked value for the token> = % they own

      % they own * <total vailable tokens in next 52 weeks> = total tokens earn in one year

      <total tokens earn in one year> / <total staked user stakes>"
  */
  public calcApy(
    tokenStats: TokenStats,
    memberStakeAmount: number,
    rewards: StakeReward[],
  ): number {
    const totalFutureRewards = rewards
      .filter((v) => {
        return (
          v.status === StakeRewardStatus.UNPROCESSED &&
          dayjs().add(52, 'weeks').isAfter(v.endDate.toDate())
        );
      })
      .reduce((acc, act) => acc + act.tokensToDistribute, 0);

    if (totalFutureRewards < MIN_AMOUNT_TO_TRANSFER) {
      return 0;
    }
    let multiplier =
      memberStakeAmount /
      ((tokenStats.stakes?.[StakeType.DYNAMIC]?.value || 0) + memberStakeAmount);
    if (multiplier > 1) {
      multiplier = 1;
    }

    const potentialEarnedTokens = multiplier * totalFutureRewards;
    return potentialEarnedTokens / memberStakeAmount;
  }

  public token = (token: string, lastValue?: string) =>
    this.stakeRewardRepo.getByTokenLive(token, lastValue);

  public submit = (req: WenRequest): Observable<StakeReward[] | undefined> =>
    this.request(WEN_FUNC.stakeReward, req);

  public remove = (req: WenRequest): Observable<StakeReward[] | undefined> =>
    this.request(WEN_FUNC.removeStakeReward, req);
}
