import { AstNode, isSelfCloseTag } from "./astNode";

export function simplify(nodes: AstNode[]): AstNode[] {
    return collapse(removeEmpty(nodes));
}

function collapse(nodes: AstNode[]): AstNode[] {
    const children: AstNode[] = [];
    nodes.map(node => collapseNode(node))
        .forEach(child => appendChild(children, child));
    return children;
}

function collapseNode(node: AstNode): AstNode {
    switch (node.type) {
        case "element": return new AstNode("element", node.tag!, collapse(node.children || []));
        case "text": return node;
        case "forceWrite": return node;
    }
}

function appendChild(children: AstNode[], child: AstNode): void {
    const lastChild = children.at(-1);
    if (child.type === "element" && child.tag && !child.tag.fresh && lastChild && 
        lastChild.type === "element" && child.tag.matchesElement(lastChild.tag!)
    ) {
        if (child.tag.separator) {
            appendChild(lastChild.children || [], new AstNode("text", child.tag.separator));
        }
        (child.children || []).forEach(grandChild => {
            // Mutation is fine since simplifying elements create a copy of the children.
            appendChild(lastChild.children || [], grandChild);
        }); 
    } else {
        children.push(child);
    }
}

function removeEmpty(nodes: AstNode[]): AstNode[] {
    return nodes.map(node => {
        switch (node.type) {
            case "element": return removeEmptyElement(node);
            case "text": return removeEmptyText(node);
            case "forceWrite": return [node];
        }
    }).flat();
}

function removeEmptyElement(element: AstNode): AstNode[] {
    const children = removeEmpty(element.children || []);
    if (children.length === 0 && !isSelfCloseTag(element)) return [];
    return [new AstNode("element", element.tag!, children)];
}

function removeEmptyText(node: AstNode): AstNode[] {
    if (node.text!.length === 0) return [];
    return [node];
}