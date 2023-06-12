import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '../../@core/utils/router.utils';
import { NewPage } from './pages/new/new.page';
import { OverviewPage } from './pages/overview/overview.page';
import { VotesPage } from './pages/votes/votes.page';
import { ParticipantsPage } from './pages/participants/participants.page';
import { ProposalPage } from './pages/proposal/proposal.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.proposal.newProposal,
    component: NewPage,
  },
  {
    path: ROUTER_UTILS.config.proposal.proposal,
    component: ProposalPage,
    children: [
      {
        path: '',
        redirectTo: ROUTER_UTILS.config.proposal.overview,
        pathMatch: 'full',
      },
      { path: ROUTER_UTILS.config.proposal.overview, component: OverviewPage },
      { path: ROUTER_UTILS.config.proposal.votes, component: VotesPage },
      { path: ROUTER_UTILS.config.proposal.participants, component: ParticipantsPage },
    ],
  },
  {
    path: '',
    redirectTo:
      '/' + ROUTER_UTILS.config.discover.root + '/' + ROUTER_UTILS.config.discover.proposals,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProposalRoutingModule {}
