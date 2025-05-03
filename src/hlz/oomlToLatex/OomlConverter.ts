import { JSDOM } from 'jsdom';
import { convertMoMath } from './TagConverter';

/**
 * OMML을 LaTeX로 변환하는 클래스
 */
export class OomlConverter {
    /**
     * OMML XML 문자열을 LaTeX 문자열로 변환
     * @param xmlStr - 변환할 OOML XML 문자열
     * @returns 변환된 LaTeX 문자열
     */
    public static convert(xmlStr: string): string {
        try {
            const dom = new JSDOM(xmlStr, { contentType: 'text/xml' });
            let ooml = dom.window.document.documentElement;;
            if (ooml.tagName === 'm:oMathPara') {
                ooml = ooml.children[0] as HTMLElement;
            }
            if (ooml.tagName !== 'm:oMath') {
                throw new Error(`Expected 'oMath' node, but got '${ooml.tagName}'!`);
            }    
            // OOML XML 문자열을 LaTeX 문자열로 변환
            const latexStr = convertMoMath(ooml)
            return latexStr.trim();

        } catch (error) {
            console.error('Error converting OOML to LaTeX:', error);
            return '';
        }
    }
} 

