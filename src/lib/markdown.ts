import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// Map common language aliases to highlight.js language names
const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'shell': 'bash',
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'sql': 'sql',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'vue': 'vue',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'md': 'markdown',
    'markdown': 'markdown',
    'txt': 'plaintext',
};

const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: true,
    linkify: true,
    typographer: true,
});

md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    if (!token) return '';

    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    const lang = info ? info.split(/\s+/g)[0] : '';
    const content = token.content ?? '';

    // Normalize language name
    const normalizedLang = (lang && languageMap[lang]) || lang || 'plaintext';

    let highlighted: string;
    let displayLang = normalizedLang;

    try {
        // Try to highlight with the specified language
        if (lang && lang !== 'plaintext') {
            const result = hljs.highlight(content, { language: normalizedLang });
            highlighted = result.value;
        } else {
            // Auto-detect language for plain text blocks
            const result = hljs.highlightAuto(content);
            highlighted = result.value;
            displayLang = result.language || 'plaintext';
        }
    } catch {
        // Fallback to auto-detection if highlighting fails
        const result = hljs.highlightAuto(content);
        highlighted = result.value;
        displayLang = result.language || 'plaintext';
    }

    return `<div class="relative group rounded-xl overflow-hidden my-6 border border-border/50">
        <div class="flex items-center justify-between px-4 py-2 bg-muted/30">
            <span class="text-xs font-medium text-muted-foreground font-mono uppercase">${displayLang}</span>
            <button class="code-copy-btn opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground" onclick="const code = this.parentElement.nextElementSibling.querySelector('code'); navigator.clipboard.writeText(code.textContent); const icon = this.querySelector('i'); icon.className = 'fa-solid fa-check'; setTimeout(() => icon.className = 'fa-regular fa-copy', 2000);">
                <i class="fa-regular fa-copy"></i>
            </button>
        </div>
        <pre class="my-0! rounded-none! border-0! border-t-0!"><code class="hljs language-${displayLang} block">${highlighted}</code></pre>
    </div>`;
};

// Custom rule for inline code
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
