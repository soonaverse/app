import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  MIN_AMOUNT_TO_TRANSFER,
  Dataset,
  StakeReward,
  StakeRewardStatus,
  StakeType,
  TokenStats,
  WEN_FUNC,
  Build5Request,
  TokenStakeRewardRequest,
  TokenStakeRewardsRemoveRequest,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { Observable } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class StakeRewardApi extends BaseApi<StakeReward> {
  private stakeRewardDataset = this.project.dataset(Dataset.STAKE_REWARD);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.STAKE_REWARD, httpClient);
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
    this.stakeRewardDataset.getByTokenLive(token, lastValue);

  public submit = (
    req: Build5Request<TokenStakeRewardRequest>,
  ): Observable<StakeReward[] | undefined> => this.request(WEN_FUNC.stakeReward, req);

  public remove = (
    req: Build5Request<TokenStakeRewardsRemoveRequest>,
  ): Observable<StakeReward[] | undefined> => this.request(WEN_FUNC.removeStakeReward, req);
}
