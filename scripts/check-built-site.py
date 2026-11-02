#!/usr/bin/env python3
"""Check all built HTML links/fragments and local HTML/CSS assets offline."""
import argparse
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.assets = []
        self.canonical = None

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if attributes.get('id'):
            self.ids.add(attributes['id'])
        if tag == 'a' and attributes.get('href'):
            self.links.append(attributes['href'])
        if tag == 'link' and attributes.get('rel') == 'canonical':
            self.canonical = attributes.get('href')
        if tag in ('img', 'script', 'video', 'audio', 'source') and attributes.get('src'):
            self.assets.append(attributes['src'])
        if tag == 'link' and attributes.get('rel') in ('stylesheet', 'icon', 'preload'):
            self.assets.append(attributes.get('href', ''))
        if tag == 'meta' and (attributes.get('property') == 'og:image' or attributes.get('name') == 'twitter:image'):
            self.assets.append(attributes.get('content', ''))


def check(root, origin='https://app.snaix.homes'):
    documents = {}
    for path in root.rglob('*.html'):
        document = Document()
        document.feed(path.read_text())
        documents[path] = document
    if not documents:
        raise ValueError(f'No built HTML pages in {root}; finish the build first')
    issues = []
    assets = set()

    def target(base, href):
        url = urlsplit(urljoin(base, href))
        if url.scheme not in ('http', 'https') or url.netloc != urlsplit(origin).netloc:
            return None, url
        path = root / unquote(url.path).lstrip('/')
        if path.is_dir() or (not path.exists() and not path.suffix):
            path /= 'index.html'
        return path, url

    for path, document in documents.items():
        base = document.canonical or origin.rstrip('/') + '/' + path.relative_to(root).as_posix()
        for href in document.links:
            destination, url = target(base, href)
            if destination is None:
                continue
            # These paths are served by the separately deployed, tested Worker.
            if re.match(r'^/(bcmr|pikpaktui)/(install\.sh$|releases/)', url.path):
                continue
            kind = None
            if not destination.exists():
                kind = 'missing-link'
            elif url.fragment and destination in documents and unquote(url.fragment) not in documents[destination].ids:
                kind = 'missing-fragment'
            if kind:
                issues.append({'kind': kind, 'page': str(path.relative_to(root)), 'href': href})
        for asset in document.assets:
            destination, _ = target(base, asset)
            if destination is not None:
                assets.add(destination)
                if not destination.is_file():
                    issues.append({'kind': 'missing-asset', 'page': str(path.relative_to(root)), 'href': asset})

    for path in root.rglob('*.css'):
        base = origin.rstrip('/') + '/' + path.relative_to(root).as_posix()
        for href in re.findall(r'url\(\s*[\'\"]?([^\)\'\"\s]+)', path.read_text()):
            if href.startswith('#'):
                continue
            destination, _ = target(base, href)
            if destination is not None:
                assets.add(destination)
                if not destination.is_file():
                    issues.append({'kind': 'missing-css-asset', 'page': str(path.relative_to(root)), 'href': href})
    return {'pages': len(documents), 'link_occurrences': sum(len(d.links) for d in documents.values()),
            'local_assets': len(assets), 'issue_count': len(issues), 'issues': issues}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', nargs='?', default='apps/site/dist')
    parser.add_argument('--json', type=Path)
    parser.add_argument('--origin', default='https://app.snaix.homes')
    arguments = parser.parse_args()
    root = Path(arguments.directory).resolve()
    if not root.is_dir():
        parser.error(f'Build directory does not exist: {root}')
    try:
        report = check(root, arguments.origin)
    except ValueError as error:
        parser.error(str(error))
    if arguments.json:
        arguments.json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'issues'}, ensure_ascii=False))
    for issue, count in Counter((i['kind'], i['href']) for i in report['issues']).most_common(20):
        print(f'{count:>3} {issue[0]}: {issue[1]}')
    raise SystemExit(1 if report['issues'] else 0)
