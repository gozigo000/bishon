import { useMemo } from "react";
import DOMPurify from 'dompurify';

// 안전한 HTML 렌더링을 위한 컴포넌트
export default function RenderHTML({ html, className }: { html: string, className?: string }) {
    const sanitizedHTML = useMemo(() => {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['sub', 'sup', 'b', 'i', 'em', 'strong', 'span', 'p', 'br', 'tbody', 'tr', 'td', 'table'],
            ALLOWED_ATTR: ['class', 'rowspan', 'colspan']
        });
    }, [html]);

    return <span 
                className={className} 
                dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
            />;
}