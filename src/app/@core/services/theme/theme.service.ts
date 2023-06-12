import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { getItem, setItem, StorageItem } from '@core/utils';
import { BehaviorSubject, fromEventPattern, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DEFAULT_BASE_THEME, ThemeList } from './theme.config';

@Injectable({
  providedIn: 'root',
})
export class ThemeService implements OnDestroy {
  destroy$ = new Subject();
  theme$ = new BehaviorSubject<ThemeList | undefined>(<ThemeList>getItem(StorageItem.Theme));

  private readonly mediaQuery = window?.matchMedia('(prefers-color-scheme: dark)');

  constructor(@Inject(DOCUMENT) private document: Document) {}

  get storedTheme(): ThemeList {
    return <ThemeList>getItem(StorageItem.Theme);
  }

  init(): void {
    this.makeAutomaticCheck();
    this.listenForMediaQueryChanges();
  }

  /** themeService.theme$ | async
   * Manually changes theme in LocalStorage & HTML body
   *
   * @param {ThemeList} theme Select theme you want to use.
   */
  setTheme(theme: ThemeList): void {
    this.clearThemes();
    setItem(StorageItem.Theme, theme);
    this.theme$.next(theme);

    this.document.body.classList.add(theme);
  }

  /**
   * Makes initial theme check based on LocalStorage theme
   *
   */
  private makeAutomaticCheck(): void {
    this.setTheme(this.storedTheme || DEFAULT_BASE_THEME);
  }

  /**
   * Handles system theme changes & applies theme automatically
   *
   */
  private listenForMediaQueryChanges(): void {
    fromEventPattern<MediaQueryListEvent>(
      this.mediaQuery.addListener.bind(this.mediaQuery),
      this.mediaQuery.removeListener.bind(this.mediaQuery),
    ).pipe(takeUntil(this.destroy$));
  }

  /**
   * Clears all themes in ThemeList enum from the HTML element
   *
   */
  private clearThemes(): void {
    for (const theme in ThemeList) {
      if (Object.prototype.hasOwnProperty.call(ThemeList, theme)) {
        const key: ThemeList = ThemeList[theme as keyof typeof ThemeList];
        this.document.body.classList.remove(key);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
