// import { useMemo } from "react";
// import DOMPurify from 'dompurify';

// HTML 렌더링을 위한 컴포넌트
export default function RenderHTML({ html, imgUrls, className }: { html: string, imgUrls?: Record<string, string>, className?: string }) {
    return <span 
        className={className} 
        dangerouslySetInnerHTML={{ __html: insertImgUrlInHtml(html, imgUrls) }} 
    />;
}

// 이미지 태그에 URL 삽입
function insertImgUrlInHtml(html: string, imgUrls?: Record<string, string>) {
    if (!imgUrls) return html;
    if (!/<img .*>/.test(html)) return html;

    const imgTags = html.matchAll(/<img .*?he="([^"]*)" wi="([^"]*)" file="([^"]*)"[^>]*?>/g);
    for (const { 0: imgTag, 1: height, 2: width, 3: fileName } of imgTags) {
        const url = imgUrls[fileName];
        if (!url) continue;
        html = html.replace(imgTag, `<img 
            style="width: ${Number(width) * 4}px; height: auto; max-width: 93%; display: inline-block; vertical-align: middle;"
            src="${url}" 
            alt="이미지" 
            onerror="console.error('이미지 로드 실패:', this.src)"
        />`);
    }
    return html;
};