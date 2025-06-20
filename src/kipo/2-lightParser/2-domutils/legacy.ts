import type { XNodeType } from "../1-node/nodeType.js";
import { isXElement, isXText, XNode, XElement } from "../1-node/node.js";

type TestType = (node: XNode) => boolean;

/**
 * An object with keys to check elements against. 
 * If a key is `tag_name`, `tag_type` or `tag_contains`, 
 * it will check the value against that specific value. 
 * Otherwise, it will check an attribute with the key's name.
 */
export type TestNodeOptions = {
    tag_name?: string | ((name: string) => boolean);
    tag_type?: string | ((name: string) => boolean);
    tag_contains?: string | ((data?: string) => boolean);
    [attributeName: string]: string | ((attributeValue: string) => boolean) | undefined;
}

/**
 * @param node The node to test.
 * @param options An object describing nodes to look for.
 * @returns Whether the node matches the description in `options`.
 */
export function testNode(node: XNode, options: TestNodeOptions): boolean {
    const test = compileTest(options);
    return test ? test(node) : true;
}

/**
 * @param nodes Nodes to search through.
 * @param options An object describing nodes to look for.
 * @param isRecursive Also consider child nodes.
 * @returns All nodes that match `options`.
 */
export function getNodes(node: XNode, options: TestNodeOptions, isRecursive: boolean): XNode[] {
    const test = compileTest(options);
    return test ? node.findAll(test, isRecursive) : [];
}

/**
 * @param options An object describing nodes to look for.
 * @returns A function that executes all checks in `options` and returns `true`
 *   if any of them match a node.
 */
function compileTest(options: TestNodeOptions): TestType | null {
    const fns = Object.keys(options).map((key) => {
        const value = options[key];
        return Object.prototype.hasOwnProperty.call(Checks, key) ?
            Checks[key](value) :
            getAttribCheck(key, value);
    });
    return fns.length === 0 ? null : fns.reduce(combineFuncs);
}

/**
 * A map of functions to check nodes against.
 */
const Checks: Record<string, (value: string | undefined | ((str: string) => boolean)) => TestType> = {
    tag_name(name) {
        if (typeof name === "function") {
            return (node: XNode) => isXElement(node) && name(node.tagName);
        } else if (name === "*") {
            return isXElement;
        }
        return (node: XNode) => isXElement(node) && node.tagName === name;
    },
    tag_type(type) {
        if (typeof type === "function") {
            return (node: XNode) => type(node.type);
        }
        return (node: XNode) => node.type === type;
    },
    tag_contains(data) {
        if (typeof data === "function") {
            return (node: XNode) => isXText(node) && data(node.content);
        }
        return (node: XNode) => isXText(node) && node.content === data;
    },
};

/**
 * @param t1 First function to combine.
 * @param t2 Second function to combine.
 * @returns A function taking a node and returning `true` if 
 *   either of the input functions returns `true` for the node.
 */
function combineFuncs(t1: TestType, t2: TestType): TestType {
    return (node: XNode) => t1(node) || t2(node);
}

/**
 * @param nodes Nodes to search through.
 * @param id The unique ID attribute value to look for.
 * @param isRecursive Also consider child nodes.
 * @returns The node with the supplied ID.
 */
export function getElementById(
    nodes: XNode,
    id: string | ((id: string) => boolean),
    isRecursive = true,
): XNode | null {
    return nodes.findOne(getAttribCheck("id", id), isRecursive);
}

/**
 * @param nodes Nodes to search through.
 * @param tagName Tag name to search for.
 * @param isRecursive Also consider child nodes.
 * @returns All nodes with the supplied `tagName`.
 */
export function getElementsByTagName(
    node: XNode,
    tagName: string | ((name: string) => boolean),
    isRecursive = true,
): XElement[] {
    return node.findAll(
        (typeof tagName === "function") ?
            node => isXElement(node) && tagName(node.tagName) :
            (tagName === "*") ?
                node => isXElement(node) :
                node => isXElement(node) && node.tagName === tagName,
        isRecursive,
    ) as XElement[];
}

/**
 * @param nodes Nodes to search through.
 * @param className Class name to search for.
 * @param isRecursive Also consider child nodes.
 * @returns All nodes with the supplied `className`.
 */
export function getElementsByClassName(
    node: XNode,
    className: string | ((name: string) => boolean),
    isRecursive = true,
): XElement[] {
    return node.findAll(
        getAttribCheck("class", className),
        isRecursive,
    ) as XElement[];
}

/**
 * @param nodes Nodes to search through.
 * @param type Element type to look for.
 * @param isRecursive Also consider child nodes.
 * @returns All nodes with the supplied `type`.
 */
export function getElementsByType(
    node: XNode,
    type: XNodeType | ((type: XNodeType) => boolean),
    isRecursive = true,
): XNode[] {
    return node.findAll(node => node.type === type, isRecursive);
}

/**
 * @param attr Attribute to check.
 * @param value Attribute value to look for.
 * @returns A function to check whether a node has an attribute with a particular value.
 */
function getAttribCheck(
    attr: string, 
    value: string | ((value: string) => boolean) | undefined
): TestType {
    if (typeof value === "function") {
        return (node: XNode) => isXElement(node) && value(node.attrs[attr]);
    }
    return (node: XNode) => isXElement(node) && node.attrs[attr] === value;
}
