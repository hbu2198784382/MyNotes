'use strict';

/*
 * Note Char Count — 统计全库笔记字符总数
 * 纯 CommonJS，无需构建，Obsidian 直接加载。
 */

const {
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	Modal,
	TFile,
	normalizePath,
} = require('obsidian');

const CJK_RE = /[㐀-䶿一-鿿豈-﫿぀-ヿ가-힯]/g;

const DEFAULT_SETTINGS = {
	includeFolders: '', // 白名单：留空 = 统计全库；非空 = 只统计这些目录
	excludeFolders: '', // 黑名单：在白名单范围内再排除
	includeFrontmatter: false,
	countCodeBlocks: true,
	showStatusBar: true,
	topN: 10,
};

/** 去掉 YAML frontmatter，返回正文。 */
function stripFrontmatter(text) {
	if (!/^---\r?\n/.test(text)) return text;
	const m = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/);
	return m ? text.slice(m[0].length) : text;
}

/** 去掉围栏代码块（``` / ~~~）。 */
function stripCodeBlocks(text) {
	return text.replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[^\n]*$/gm, '');
}

/**
 * 统计一段文本的各项指标。
 * 字符数按 Unicode 码点计算（emoji 等代理对记 1）。
 */
function countText(raw, settings) {
	let content = raw;
	if (!settings.includeFrontmatter) content = stripFrontmatter(content);
	if (!settings.countCodeBlocks) content = stripCodeBlocks(content);

	const totalChars = Array.from(content).length; // 含空白与换行
	const nonSpaceChars = Array.from(content.replace(/\s/g, '')).length; // 不含空白

	const cjkMatches = content.match(CJK_RE);
	const cjkChars = cjkMatches ? cjkMatches.length : 0;

	// 英文/数字单词：先把中日韩字符剔除，再按词切分
	const latinWords = content.replace(CJK_RE, ' ').match(/[A-Za-z0-9][A-Za-z0-9'’_-]*/g);
	const wordCount = latinWords ? latinWords.length : 0;

	const lines = content.length === 0 ? 0 : content.split(/\r?\n/).length;

	return { totalChars, nonSpaceChars, cjkChars, wordCount, lines };
}

function emptyCounts() {
	return { totalChars: 0, nonSpaceChars: 0, cjkChars: 0, wordCount: 0, lines: 0 };
}

function fmt(n) {
	return n.toLocaleString('en-US');
}

function debounce(fn, wait) {
	let timer = null;
	return function (...args) {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			fn.apply(this, args);
		}, wait);
	};
}

/* ------------------------------------------------------------------ */
/* 统计面板                                                            */
/* ------------------------------------------------------------------ */

class StatsModal extends Modal {
	constructor(app, plugin, result) {
		super(app);
		this.plugin = plugin;
		this.result = result;
		this.sortKey = 'totalChars';
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('ncc-modal');

		contentEl.createEl('h2', { text: '全库字数统计' });
		contentEl.createEl('div', {
			cls: 'ncc-sub',
			text: `扫描时间：${new Date().toLocaleString()}`,
		});

		this.summaryEl = contentEl.createDiv({ cls: 'ncc-summary' });
		this.renderSummary();

		contentEl.createEl('h3', { text: '最长的笔记' });
		this.tableEl = contentEl.createDiv({ cls: 'ncc-table' });
		this.renderTable();

		const footer = contentEl.createDiv({ cls: 'ncc-footer' });
		const btn = footer.createEl('button', { text: '重新统计', cls: 'mod-cta' });
		btn.addEventListener('click', async () => {
			btn.disabled = true;
			btn.setText('统计中…');
			this.result = await this.plugin.scanAll();
			this.renderSummary();
			this.renderTable();
			btn.disabled = false;
			btn.setText('重新统计');
		});
	}

	renderSummary() {
		const t = this.result.totals;
		this.summaryEl.empty();

		const tiles = [
			['笔记总数', `${fmt(t.files)} 篇`],
			['总字符数', fmt(t.totalChars)],
			['字符数（不含空白）', fmt(t.nonSpaceChars)],
			['中文字符数', fmt(t.cjkChars)],
			['英文单词数', fmt(t.wordCount)],
			['总行数', fmt(t.lines)],
		];

		for (const [label, value] of tiles) {
			const tile = this.summaryEl.createDiv({ cls: 'ncc-tile' });
			tile.createDiv({ cls: 'ncc-tile-label', text: label });
			tile.createDiv({ cls: 'ncc-tile-value', text: value });
		}

		if (this.result.includedFolders.length) {
			this.summaryEl.createDiv({
				cls: 'ncc-note',
				text: `仅统计目录：${this.result.includedFolders.join('、')}`,
			});
		}
		if (this.result.skippedFolders.length) {
			this.summaryEl.createDiv({
				cls: 'ncc-note',
				text: `已排除目录：${this.result.skippedFolders.join('、')}`,
			});
		}
	}

	renderTable() {
		this.tableEl.empty();
		const top = [...this.result.files]
			.sort((a, b) => b.totalChars - a.totalChars)
			.slice(0, this.plugin.settings.topN);

		if (!top.length) {
			this.tableEl.createDiv({ text: '没有可统计的笔记。' });
			return;
		}

		const table = this.tableEl.createEl('table');
		const thead = table.createEl('thead').createEl('tr');
		for (const h of ['#', '笔记', '字符数', '中文字数', '行数']) {
			thead.createEl('th', { text: h });
		}

		const tbody = table.createEl('tbody');
		top.forEach((entry, i) => {
			const tr = tbody.createEl('tr');
			tr.createEl('td', { text: String(i + 1) });

			const nameCell = tr.createEl('td');
			const link = nameCell.createEl('a', { text: entry.name, cls: 'ncc-link' });
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const file = this.app.vault.getAbstractFileByPath(entry.path);
				if (file instanceof TFile) {
					this.app.workspace.getLeaf(false).openFile(file);
					this.close();
				}
			});
			nameCell.createDiv({ cls: 'ncc-path', text: entry.path });

			tr.createEl('td', { text: fmt(entry.totalChars), cls: 'ncc-num' });
			tr.createEl('td', { text: fmt(entry.cjkChars), cls: 'ncc-num' });
			tr.createEl('td', { text: fmt(entry.lines), cls: 'ncc-num' });
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}

/* ------------------------------------------------------------------ */
/* 设置面板                                                            */
/* ------------------------------------------------------------------ */

class NoteCharCountSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h3', { text: '统计范围' });

		new Setting(containerEl)
			.setName('白名单：只统计这些目录')
			.setDesc(
				'每行一个目录路径（相对库根目录），包含其所有子目录。留空则统计全库。' +
					'例如填「数据结构」后，只统计 数据结构/ 下的笔记，其他目录一律不算。' +
					'也可以直接写某个笔记的完整路径（如 算法/排序.md）来只统计单篇。'
			)
			.addTextArea((ta) => {
				ta.setPlaceholder('留空 = 全库\n数据结构\n算法');
				ta.setValue(this.plugin.settings.includeFolders);
				ta.inputEl.rows = 4;
				ta.onChange(async (value) => {
					this.plugin.settings.includeFolders = value;
					await this.plugin.saveSettings();
					this.plugin.refreshDebounced();
				});
			});

		new Setting(containerEl)
			.setName('黑名单：额外排除这些目录')
			.setDesc(
				'每行一个目录路径，这些目录下的笔记不计入统计。' +
					'注意：此项在白名单范围之内生效，优先级高于白名单。例如：Excalidraw'
			)
			.addTextArea((ta) => {
				ta.setPlaceholder('Excalidraw\n模板');
				ta.setValue(this.plugin.settings.excludeFolders);
				ta.inputEl.rows = 4;
				ta.onChange(async (value) => {
					this.plugin.settings.excludeFolders = value;
					await this.plugin.saveSettings();
					this.plugin.refreshDebounced();
				});
			});

		containerEl.createEl('h3', { text: '统计口径' });

		new Setting(containerEl)
			.setName('统计 Frontmatter')
			.setDesc('开启后，笔记开头的 YAML 元数据也计入字符数。默认关闭。')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.includeFrontmatter).onChange(async (v) => {
					this.plugin.settings.includeFrontmatter = v;
					await this.plugin.saveSettings();
					this.plugin.refreshDebounced();
				})
			);

		new Setting(containerEl)
			.setName('统计代码块')
			.setDesc('关闭后，``` 围栏代码块内的内容不计入字符数。默认开启。')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.countCodeBlocks).onChange(async (v) => {
					this.plugin.settings.countCodeBlocks = v;
					await this.plugin.saveSettings();
					this.plugin.refreshDebounced();
				})
			);

		new Setting(containerEl)
			.setName('状态栏显示总数')
			.setDesc('在右下角状态栏常驻显示全库字符总数，点击可打开统计面板。')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.showStatusBar).onChange(async (v) => {
					this.plugin.settings.showStatusBar = v;
					await this.plugin.saveSettings();
					this.plugin.updateStatusBar();
				})
			);

		new Setting(containerEl)
			.setName('排行榜条数')
			.setDesc('统计面板中显示的最长笔记数量。')
			.addSlider((s) =>
				s
					.setLimits(5, 50, 5)
					.setValue(this.plugin.settings.topN)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.topN = v;
						await this.plugin.saveSettings();
					})
			);
	}
}

/* ------------------------------------------------------------------ */
/* 插件主体                                                            */
/* ------------------------------------------------------------------ */

module.exports = class NoteCharCountPlugin extends Plugin {
	async onload() {
		await this.loadSettings();

		/** @type {Map<string, object>} path -> 单篇统计结果 */
		this.cache = new Map();
		this.totals = { files: 0, ...emptyCounts() };

		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.addClass('ncc-statusbar');
		this.statusBarEl.addEventListener('click', () => this.openStats());

		this.refreshDebounced = debounce(() => this.scanAll(), 800);

		this.addCommand({
			id: 'count-vault-characters',
			name: '统计全库字数',
			callback: () => this.openStats(),
		});

		this.addCommand({
			id: 'count-current-note',
			name: '统计当前笔记字数',
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) this.countCurrent(file);
				return true;
			},
		});

		this.addSettingTab(new NoteCharCountSettingTab(this.app, this));

		// 增量维护缓存，避免每次整库重扫
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') this.scheduleUpdate(file);
			})
		);
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') this.scheduleUpdate(file);
			})
		);
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					if (this.cache.delete(file.path)) this.recomputeTotals();
					this.updateStatusBar();
				}
			})
		);
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				const entry = this.cache.get(oldPath);
				if (entry) {
					this.cache.delete(oldPath);
					this.cache.set(file.path, { ...entry, path: file.path, name: file.basename });
				}
				this.scheduleUpdate(file);
			})
		);

		// 首次全量统计放到工作区就绪之后，避免拖慢启动
		this.app.workspace.onLayoutReady(() => {
			this.updateStatusBar();
			this.scanAll().catch((e) => console.error('[note-char-count]', e));
		});

		this.perFileTimers = new Map();
	}

	onunload() {
		if (this.perFileTimers) {
			for (const t of this.perFileTimers.values()) clearTimeout(t);
			this.perFileTimers.clear();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** 把设置里的多行目录列表解析为规范化前缀数组。 */
	parsePrefixes(raw) {
		return (raw || '')
			.split('\n')
			.map((s) => s.trim().replace(/^\/+|\/+$/g, ''))
			.filter(Boolean)
			.map((s) => normalizePath(s));
	}

	/** 白名单目录（只统计这些目录及其子目录）。 */
	includedPrefixes() {
		return this.parsePrefixes(this.settings.includeFolders);
	}

	/** 黑名单目录（在白名单范围内再排除）。 */
	excludedPrefixes() {
		return this.parsePrefixes(this.settings.excludeFolders);
	}

	/** 笔记路径是否落在某个目录（或其子目录）下；也支持直接写某个 .md 的完整路径。 */
	matchesPrefix(path, prefix) {
		return path === prefix || path.startsWith(prefix + '/');
	}

	/**
	 * 该笔记是否应该计入统计。
	 * 规则：白名单为空 → 全库统计；白名单非空 → 只统计白名单内的。
	 * 黑名单优先级更高，命中即排除。
	 */
	shouldCount(path) {
		const included = this.includedPrefixes();
		if (included.length > 0 && !included.some((p) => this.matchesPrefix(path, p))) {
			return false;
		}
		return !this.excludedPrefixes().some((p) => this.matchesPrefix(path, p));
	}

	scheduleUpdate(file) {
		const existing = this.perFileTimers.get(file.path);
		if (existing) clearTimeout(existing);
		const timer = setTimeout(async () => {
			this.perFileTimers.delete(file.path);
			try {
				await this.updateFile(file);
			} catch (e) {
				console.error('[note-char-count]', e);
			}
		}, 1000);
		this.perFileTimers.set(file.path, timer);
	}

	/** 重算单篇笔记并更新缓存与总数。 */
	async updateFile(file) {
		if (!this.shouldCount(file.path)) {
			if (this.cache.delete(file.path)) {
				this.recomputeTotals();
				this.updateStatusBar();
			}
			return;
		}
		const text = await this.app.vault.cachedRead(file);
		this.cache.set(file.path, {
			path: file.path,
			name: file.basename,
			...countText(text, this.settings),
		});
		this.recomputeTotals();
		this.updateStatusBar();
	}

	/** 全量扫描，返回统计结果。 */
	async scanAll() {
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((f) => this.shouldCount(f.path));

		const next = new Map();
		for (const file of files) {
			let text = '';
			try {
				text = await this.app.vault.cachedRead(file);
			} catch (e) {
				console.error('[note-char-count] 读取失败', file.path, e);
				continue;
			}
			next.set(file.path, {
				path: file.path,
				name: file.basename,
				...countText(text, this.settings),
			});
		}

		this.cache = next;
		this.recomputeTotals();
		this.updateStatusBar();

		return {
			files: [...this.cache.values()],
			totals: this.totals,
			includedFolders: this.includedPrefixes(),
			skippedFolders: this.excludedPrefixes(),
		};
	}

	recomputeTotals() {
		const totals = { files: 0, ...emptyCounts() };
		for (const entry of this.cache.values()) {
			totals.files += 1;
			totals.totalChars += entry.totalChars;
			totals.nonSpaceChars += entry.nonSpaceChars;
			totals.cjkChars += entry.cjkChars;
			totals.wordCount += entry.wordCount;
			totals.lines += entry.lines;
		}
		this.totals = totals;
	}

	updateStatusBar() {
		if (!this.statusBarEl) return;
		this.statusBarEl.toggleClass('ncc-hidden', !this.settings.showStatusBar);
		if (!this.settings.showStatusBar) return;
		const { totalChars, files } = this.totals;
		this.statusBarEl.setText(
			files ? `📝 ${fmt(totalChars)} 字 / ${fmt(files)} 篇` : '📝 统计中…'
		);
		this.statusBarEl.setAttr('aria-label', '点击查看全库字数统计');
	}

	async openStats() {
		new Notice('正在统计全库字数…');
		let result;
		try {
			result = await this.scanAll();
		} catch (e) {
			console.error('[note-char-count]', e);
			new Notice('统计失败，请查看控制台。');
			return;
		}
		new StatsModal(this.app, this, result).open();
	}

	async countCurrent(file) {
		const text = await this.app.vault.cachedRead(file);
		const c = countText(text, this.settings);
		new Notice(
			`《${file.basename}》\n` +
				`字符数（含空白）：${fmt(c.totalChars)}\n` +
				`字符数（不含空白）：${fmt(c.nonSpaceChars)}\n` +
				`中文字符：${fmt(c.cjkChars)}　英文单词：${fmt(c.wordCount)}\n` +
				`行数：${fmt(c.lines)}`,
			8000
		);
	}
};
