import { ONode } from "../2-xmlParser/nodes";
import { indexBy } from "../_utils/arrayUtils";

type AbstractNum = {
    levels: Record<string, NumberingLevel>;
    numStyleLink?: string;
}

type Num = {
    abstractNumId: string;
}

type NumberingStyles = Pick<Styles, 'findNumberingStyleById'>;

export class Numberings {
    private nums: Record<string, Num>;
    private abstractNums: Record<string, AbstractNum>;
    private styles: NumberingStyles;
    private levelsByParagraphStyleId: Record<string, NumberingLevel>;

    constructor(nums: Record<string, Num>, abstractNums: Record<string, AbstractNum>, styles: NumberingStyles) {
        this.nums = nums;
        this.abstractNums = abstractNums;
        this.styles = styles;
        const allLevels: NumberingLevel[] = Object.values(abstractNums)
            .map(abstractNum => Object.values(abstractNum.levels))
            .flat();
        this.levelsByParagraphStyleId = indexBy(
            allLevels.filter(level => level.paragraphStyleId != null),
            "paragraphStyleId"
        );
    }

    findLevel(numId: string, level: string): NumberingLevel | null {
        const num = this.nums[numId];
        if (!num) return null;

        const abstractNum = this.abstractNums[num.abstractNumId];
        if (!abstractNum) return null;
        
        if (abstractNum.numStyleLink == null) {
            return this.abstractNums[num.abstractNumId].levels[level];
        } else {
            const style = this.styles.findNumberingStyleById(abstractNum.numStyleLink);
            return this.findLevel(style?.numId ?? "", level);
        }
    }

    findLevelByParagraphStyleId(styleId: string): NumberingLevel | null {
        return this.levelsByParagraphStyleId[styleId] || null;
    }
}

export const defaultNumbering = new Numberings({}, {}, { findNumberingStyleById: () => ({ numId: "" }) });

export function readNumbering(root: ONode, options: { styles: NumberingStyles }): Numberings {
    if (!options || !options.styles) {
        throw new Error("styles is missing");
    }
    const nums = readNums(root);
    const abstractNums = readAbstractNums(root);
    return new Numberings(nums, abstractNums, options.styles);
}

function readAbstractNums(root: ONode): Record<string, AbstractNum> {
    const abstractNums: Record<string, AbstractNum> = {};
    root.getElementsByTagName("w:abstractNum").forEach((element: ONode) => {
        const id = element.attributes["w:abstractNumId"];
        abstractNums[id] = readAbstractNum(element);
    });
    return abstractNums;
}

function readAbstractNum(element: ONode): AbstractNum {
    const levels: Record<string, NumberingLevel> = {};
    element.getElementsByTagName("w:lvl").forEach((levelElement: ONode) => {
        const levelIdx = levelElement.attributes["w:ilvl"];
        const numFmt = levelElement.getFirstOrEmpty("w:numFmt").attributes["w:val"];
        const paragraphStyleId = levelElement.getFirstOrEmpty("w:pStyle").attributes["w:val"];
        levels[levelIdx] = {
            isOrdered: numFmt !== "bullet",
            level: levelIdx,
            paragraphStyleId: paragraphStyleId
        };
    });
    const numStyleLink = element.getFirstOrEmpty("w:numStyleLink").attributes["w:val"];
    return { levels, numStyleLink };
}

function readNums(root: ONode): Record<string, Num> {
    const nums: Record<string, Num> = {};
    root.getElementsByTagName("w:num").forEach((element: ONode) => {
        const numId = element.attributes["w:numId"];
        const abstractNumId = element.getFirst("w:abstractNumId")?.attributes["w:val"]!;
        nums[numId] = { abstractNumId };
    });
    return nums;
}
