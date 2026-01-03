import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
    html: false,
    xhtmlOut: false, 
    breaks: true,
    linkify: true,
    typographer: true, 
});

export function renderMarkdown(content?: string): string {
    if (!content) return '';
    return md.render(content);
}
