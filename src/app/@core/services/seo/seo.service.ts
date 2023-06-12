import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { WEN_NAME } from '@build-5/interfaces';

const DEFAULT_TITLE = WEN_NAME;
const DEFAULT_DESCRIPTION = $localize`Soonaverse is a platform for communities to create and manage decentralized autonomous organizations (DAOs), NFTs, projects, companies, and markets, on the feeless infrastructure of the IOTA network. Any organization can launch and trade liquid assets through our Marketplace, Launchpad, and Token Exchange products.`;
const DEFAULT_IMG = environment.soonaversePlaceholder;

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(private titleService: Title, private metaService: Meta) {}

  public setTags(title?: string, description?: string, image?: string): void {
    this.setTitle(title);
    this.setDescription(description);
    this.setImage(image);
  }

  private setTitle(title?: string): void {
    if (title) {
      title += ' | Soonaverse';
    } else {
      title = DEFAULT_TITLE;
    }

    this.titleService.setTitle(title);

    this.metaService.updateTag({
      property: 'og:title',
      content: title,
    });
  }

  private setDescription(description?: string): void {
    description = description || DEFAULT_DESCRIPTION;

    this.metaService.updateTag({
      name: 'description',
      content: description,
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
  }

  private setImage(image?: string): void {
    this.metaService.updateTag({
      property: 'og:image',
      content: image || DEFAULT_IMG,
    });
  }
}
