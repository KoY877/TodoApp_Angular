import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatText',
})
export class FormatTextPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value?: string): SafeHtml {
    if (!value) return '';
    const html = value
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<em>$1</em>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}
