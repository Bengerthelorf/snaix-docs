import { expect, test } from 'bun:test';
import { labelsFor } from './ui-labels';

test('language variants choose complete Chinese translations and unknown languages use English', () => {
  const simplified = labelsFor('zh-CN');
  const traditional = labelsFor('zh-Hant-TW');
  expect(simplified.search.placeholder).toBe('搜索文档');
  expect(traditional.search.placeholder).toBe('搜尋文件');
  expect(labelsFor('ZH_tw')).toEqual(traditional);
  expect(labelsFor('de-DE')).toEqual(labelsFor('en'));
  for (const labels of [simplified, traditional, labelsFor('en')]) {
    expect(Object.values(labels.search).every((value) => typeof value === 'string' && value.length > 0)).toBe(true);
    expect(Object.values(labels.theme).every((value) => typeof value === 'string' && value.length > 0)).toBe(true);
  }
});
