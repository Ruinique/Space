export type Lang = 'zh' | 'en';

export const DICT = {
  zh: {
    'nav.about': '关于',
    'nav.blog': '博客',
    'nav.moments': '动态',
    'nav.admin': '管理',
    'nav.langBtn': 'EN',
    'nav.langTitle': 'Switch to English',
    'search.placeholder': '搜索静态归档文章... (ESC 关闭)',
    'search.emptyPrompt': '输入关键词搜索文章...',
    'search.noResults': '未找到匹配的文章。',
    'search.noIndex': '生产构建后可使用全文搜索。',

    'about.role': '电子科技大学 (UESTC) · 计算机科学与工程学院 · NDSL-HPC 研究生',
    'about.bioPrefix': '专注于',
    'about.bio1': '数值线性代数',
    'about.bio2': 'GPU 算子优化',
    'about.bio3': '大模型推理系统',
    'about.bioMid': '。在这里记录长篇技术调研（',
    'about.bioMid2': '）与日常实验碎片（',
    'about.bioSuffix': '）。',
    'about.location': '成都 · NDSL-HPC',
    'about.researchTitle': '研究方向',
    'about.area1.tag': '算法',
    'about.area1.title': '数值线性代数',
    'about.area1.desc': '特征值分治求解器（Divide-and-Conquer）、三对角特征值问题与稠密矩阵核函数。',
    'about.area2.tag': 'CUDA',
    'about.area2.title': 'GPU 与高性能计算',
    'about.area2.desc': 'Warp 级原语、存储层次调优与高吞吐 GPU Kernel 工程实现。',
    'about.area3.tag': '系统',
    'about.area3.title': 'LLM 与多模态推理',
    'about.area3.desc': '高吞吐推理引擎、请求调度与音频/多模态模型服务架构。',
    'about.pinnedTitle': '置顶项目',
    'about.allRepos': '全部仓库 ↗',
    'about.toolkit': '技术栈',
    'about.recentBlog': '最新长文',
    'about.viewAll': '查看全部 →',
    'about.noArticles': '暂无在线文章。',

    'blog.all': '全部',
    'blog.write': '+ 写长文',
    'blog.loading': '正在加载文章...',
    'blog.empty': '暂无长文，欢迎前往 Moments 查看碎片动态。',

    'moments.badge': '实验笔记与碎片',
    'moments.connecting': '● 连接中...',
    'moments.syncing': '正在同步动态...',
    'moments.live': '● 实时',
    'moments.countUnit': '条动态',
    'moments.leaveComment': '写评论',
    'moments.commentSingular': '条评论',
    'moments.commentPlural': '条评论',
    'moments.noComments': '暂无评论，抢占沙发吧。',
    'moments.writePlaceholder': '写下你的评论...',
    'moments.commentingAs': '当前登录：',
    'moments.signInPrompt': '登录后即可发表评论：',
    'moments.signOut': '退出登录',
    'moments.delete': '删除',

    'article.backToBlog': '返回博客',
    'article.loading': '正在加载文章...',
    'article.discussion': '讨论区',
    'article.signInGoogle': 'Google 登录',
    'article.signOut': '退出登录',
    'article.writePlaceholder': '写下你的评论...',
    'article.noComments': '暂无评论。',
    'article.rateLimit': '发送过于频繁，请稍候再试',

    'admin.tabCompose': '频道动态',
    'admin.tabArticle': '发布长文',
    'admin.tabComments': '评论管理',
    'admin.importMd': '导入 .md',
    'admin.exportMd': '导出 .md',
    'admin.publishArticle': '发布长文到频道',
    'admin.allMoments': '全部频道动态',
    'admin.allArticles': '已发布在线文章 (Firestore)',
    'admin.allComments': '全部讨论消息',
  },
  en: {
    'nav.about': 'About',
    'nav.blog': 'Blog',
    'nav.moments': 'Moments',
    'nav.admin': 'Admin',
    'nav.langBtn': '中',
    'nav.langTitle': '切换为中文',
    'search.placeholder': 'Search posts... (ESC to close)',
    'search.emptyPrompt': 'Type to search static archive...',
    'search.noResults': 'No matching messages.',
    'search.noIndex': 'Search index available after production build.',

    'about.role': 'Graduate Student @uestc-ndsl-hpc · School of CSE, UESTC',
    'about.bioPrefix': 'Focused on ',
    'about.bio1': 'numerical linear algebra',
    'about.bio2': 'GPU kernel optimization',
    'about.bio3': 'LLM serving systems',
    'about.bioMid': '. Sharing long-form technical notes in ',
    'about.bioMid2': ' and real-time lab fragments in ',
    'about.bioSuffix': '.',
    'about.location': 'Chengdu · NDSL-HPC',
    'about.researchTitle': 'Research Focus',
    'about.area1.tag': 'Algorithms',
    'about.area1.title': 'Numerical Linear Algebra',
    'about.area1.desc': 'Eigenvalue divide-and-conquer solvers, tridiagonal eigensolvers, and dense linear algebra kernels.',
    'about.area2.tag': 'CUDA',
    'about.area2.title': 'GPU & HPC Systems',
    'about.area2.desc': 'Warp-level primitives, memory hierarchy optimization, and high-throughput kernel engineering.',
    'about.area3.tag': 'Systems',
    'about.area3.title': 'LLM & Multimodal Serving',
    'about.area3.desc': 'Low-latency inference engines, scheduling, and audio/multimodal serving architectures.',
    'about.pinnedTitle': 'Pinned Projects',
    'about.allRepos': 'All Repositories ↗',
    'about.toolkit': 'Toolkit',
    'about.recentBlog': 'Recent from Blog',
    'about.viewAll': 'View all →',
    'about.noArticles': 'No articles published yet.',

    'blog.all': 'All',
    'blog.write': '+ Write',
    'blog.loading': 'Loading articles...',
    'blog.empty': 'No articles yet. Check out Moments for real-time fragments.',

    'moments.badge': 'Lab Notes & Fragments',
    'moments.connecting': '● Connecting...',
    'moments.syncing': 'Synchronizing messages...',
    'moments.live': '● Live',
    'moments.countUnit': 'messages',
    'moments.leaveComment': 'Leave a comment',
    'moments.commentSingular': 'comment',
    'moments.commentPlural': 'comments',
    'moments.noComments': 'No comments yet. Be the first to reply.',
    'moments.writePlaceholder': 'Write a comment...',
    'moments.commentingAs': 'Commenting as ',
    'moments.signInPrompt': 'Sign in to leave a comment:',
    'moments.signOut': 'Sign Out',
    'moments.delete': 'Delete',

    'article.backToBlog': 'Back to Blog',
    'article.loading': 'Loading article...',
    'article.discussion': 'Discussion',
    'article.signInGoogle': 'Sign in with Google',
    'article.signOut': 'Sign Out',
    'article.writePlaceholder': 'Write a comment...',
    'article.noComments': 'No comments yet.',
    'article.rateLimit': 'Too fast, please wait a few seconds.',

    'admin.tabCompose': 'Channel Composer',
    'admin.tabArticle': 'Long-Form Article',
    'admin.tabComments': 'Comments Moderation',
    'admin.importMd': 'Import .md',
    'admin.exportMd': 'Export .md',
    'admin.publishArticle': 'Publish Article',
    'admin.allMoments': 'All Channel Moments',
    'admin.allArticles': 'Published Online Articles (Firestore)',
    'admin.allComments': 'All Discussion Messages',
  },
} as const;

export type I18nKey = keyof typeof DICT.en;

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'zh';
  const stored = localStorage.getItem('lang');
  if (stored === 'zh' || stored === 'en') return stored;
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

export function t(key: I18nKey, lang: Lang = getLang()): string {
  return DICT[lang][key] ?? DICT.en[key] ?? key;
}

export function applyI18n(lang: Lang = getLang(), root: Document | HTMLElement = document): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }

  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n') as I18nKey | null;
    if (key && key in DICT[lang]) {
      el.textContent = DICT[lang][key];
    }
  });

  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder') as I18nKey | null;
    if (key && key in DICT[lang]) {
      el.placeholder = DICT[lang][key];
    }
  });

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.textContent = DICT[lang]['nav.langBtn'];
    langBtn.title = DICT[lang]['nav.langTitle'];
  }
}

export function setLang(lang: Lang): void {
  localStorage.setItem('lang', lang);
  applyI18n(lang);
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

export function toggleLang(): Lang {
  const next: Lang = getLang() === 'zh' ? 'en' : 'zh';
  setLang(next);
  return next;
}
