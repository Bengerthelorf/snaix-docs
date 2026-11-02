interface UILabels {
  search: {
    placeholder: string;
    results: string;
    empty: string;
    hint: string;
    loading: string;
    error: string;
    scope: string;
    currentProduct: string;
    allProducts: string;
    scopeFallback: string;
    docs: string;
  };
  theme: {
    light: string;
    dark: string;
    switchToLight: string;
    switchToDark: string;
    darkTheme: string;
  };
}

const en: UILabels = {
  search: {
    placeholder: 'search docs', results: 'search results', empty: 'no matches.',
    hint: 'type to search · esc to close', loading: 'searching…',
    error: 'search unavailable. type again to retry.', scope: 'search scope',
    currentProduct: 'current product', allProducts: 'all products',
    scopeFallback: 'Product filter unavailable. Showing all products.', docs: 'docs',
  },
  theme: { light: 'light', dark: 'dark', switchToLight: 'switch to light', switchToDark: 'switch to dark', darkTheme: 'dark theme' },
};

const zh: UILabels = {
  search: {
    placeholder: '搜索文档', results: '搜索结果', empty: '没有找到结果。',
    hint: '输入关键词搜索 · Esc 关闭', loading: '正在搜索…',
    error: '搜索暂不可用，请重新输入以重试。', scope: '搜索范围',
    currentProduct: '当前产品', allProducts: '全部产品',
    scopeFallback: '产品筛选暂不可用，正在显示全部产品。', docs: '文档',
  },
  theme: { light: '浅色', dark: '深色', switchToLight: '切换至浅色主题', switchToDark: '切换至深色主题', darkTheme: '深色主题' },
};

const zhHant: UILabels = {
  search: {
    placeholder: '搜尋文件', results: '搜尋結果', empty: '找不到結果。',
    hint: '輸入關鍵字搜尋 · Esc 關閉', loading: '搜尋中…',
    error: '搜尋暫時無法使用，請重新輸入以重試。', scope: '搜尋範圍',
    currentProduct: '目前產品', allProducts: '全部產品',
    scopeFallback: '產品篩選暫時無法使用，正在顯示全部產品。', docs: '文件',
  },
  theme: { light: '淺色', dark: '深色', switchToLight: '切換至淺色主題', switchToDark: '切換至深色主題', darkTheme: '深色主題' },
};

/** Unsupported languages retain a complete, explicit English UI fallback. */
export function labelsFor(locale = 'en'): UILabels {
  const language = locale.toLowerCase().replace(/_/g, '-');
  if (/^zh(?:-|$)/.test(language)) {
    return /(?:^|-)(?:hant|tw|hk|mo)(?:-|$)/.test(language) ? zhHant : zh;
  }
  return en;
}
