import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: true,
    linkify: true,
    typographer: true,
});

// Add syntax highlighting support with language detection
md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    if (!token) return '';

    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    const lang = info ? info.split(/\s+/g)[0] : '';

    let content = token.content ?? '';

    // Basic language detection for common languages
    const languageMap: Record<string, string> = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'rb': 'ruby',
        'sh': 'bash',
        'bash': 'bash',
        'zsh': 'bash',
        'yaml': 'yaml',
        'yml': 'yaml',
        'json': 'json',
        'xml': 'xml',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'sql': 'sql',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'go': 'go',
        'rs': 'rust',
        'php': 'php',
        'vue': 'vue',
        'jsx': 'jsx',
        'tsx': 'tsx',
        'md': 'markdown',
        'markdown': 'markdown',
    };

    const displayLang = (lang && languageMap[lang]) || lang || 'text';

    // Escape HTML entities in code content
    content = md.utils.escapeHtml(content);

    return `<div class="relative group rounded-xl overflow-hidden my-6">
        <div class="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
            <span class="text-xs font-medium text-muted-foreground font-mono uppercase">${displayLang}</span>
            <button class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000);">Copy</button>
        </div>
        <pre class="my-0! rounded-none! border-0!"><code class="language-${displayLang}">${content}</code></pre>
    </div>`;
};

// Custom rule for inline code to preserve the default behavior
md.renderer.rules.code_inline = (tokens, idx) => {
    const token = tokens[idx];
    if (!token) return '<code></code>';

    const content = md.utils.escapeHtml(token.content ?? '');
    return `<code>${content}</code>`;
};

export function renderMarkdown(content?: string): string {
    if (!content) return '';
    return md.render(content);
}
