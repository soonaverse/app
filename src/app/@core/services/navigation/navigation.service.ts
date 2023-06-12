import { Injectable, OnDestroy } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { BehaviorSubject, filter, map, Observable, pairwise, Subscription } from 'rxjs';

export interface NavigationObject {
  text: string;
  url: string[];
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService implements OnDestroy {
  private subsRouter$?: Subscription;
  private navigationState = new BehaviorSubject<NavigationObject[]>([]);

  constructor(private router: Router) {
    // None.
  }

  public watchPathHistory(): void {
    this.subsRouter$ = this.router.events
      .pipe(
        filter((evt: any) => evt instanceof RoutesRecognized),
        pairwise(),
      )
      .subscribe((events: RoutesRecognized[]) => {
        const prevUrl = events[0].urlAfterRedirects;
        const targetUrl = events[1].urlAfterRedirects;
        this.returnableUrl().forEach((o) => {
          if (prevUrl.startsWith('/' + o.url) && !targetUrl.startsWith('/' + o.url)) {
            this.pushState({ text: o.text, url: prevUrl.split('/') });
          }
        });
        this.forwardableUrl().forEach((o) => {
          if (!prevUrl.startsWith('/' + o.url) && targetUrl.startsWith('/' + o.url)) {
            this.pushState({ text: o.text, url: prevUrl.split('/') });
          }
        });
      });
  }

  private returnableUrl(): { url: string; text: string }[] {
    return [
      { url: ROUTER_UTILS.config.space.root, text: 'Space' },
      { url: ROUTER_UTILS.config.discover.root, text: 'Discover' },
      { url: ROUTER_UTILS.config.member.root, text: 'Profile' },
      { url: ROUTER_UTILS.config.market.root, text: 'Marketplace' },
      { url: ROUTER_UTILS.config.collection.root, text: 'Collection' },
      { url: ROUTER_UTILS.config.base.dashboard, text: 'Overview' },
      { url: ROUTER_UTILS.config.tokens.root, text: 'Tokens' },
      // { url: ROUTER_UTILS.config.award.root, text: 'Award' },
      // { url: ROUTER_UTILS.config.proposal.root, text: 'Proposal' },
    ];
  }

  private forwardableUrl(): { url: string; text: string }[] {
    return [
      {
        url: `${ROUTER_UTILS.config.collection.root}/${ROUTER_UTILS.config.collection.edit}`,
        text: 'Collection',
      },
    ];
  }

  public getLastUrl(): string[] {
    const value = this.navigationState.getValue();
    return value[value.length - 1]?.url || [''];
  }

  public getTitle(): Observable<string> {
    return this.navigationState.pipe(
      map((state) => $localize`Back` + ` ${state.length > 0 ? state[state.length - 1].text : ''}`),
    );
  }

  public goBack(): void {
    const prevUrl = this.router.url;
    const url = [...this.getLastUrl()];
    this.popState();
    this.router.navigate(url);
    setTimeout(() => {
      if (this.getLastUrl().join('/') === prevUrl) {
        this.popState();
      }
    }, 0);
  }

  private pushState(nav: NavigationObject): void {
    this.navigationState.next([...this.navigationState.getValue(), nav]);
  }

  private popState(): NavigationObject | null {
    const value = this.navigationState.getValue();
    if (value.length > 0) {
      this.navigationState.next(value.slice(0, value.length - 1));
      return value[value.length - 1];
    }
    return null;
  }

  public ngOnDestroy(): void {
    if (this.subsRouter$) {
      this.subsRouter$.unsubscribe();
    }
  }
}
