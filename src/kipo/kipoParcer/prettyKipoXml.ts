import { XElement, XNode, XText } from "../2-lightParser/1-node/node";

export function prettyKipoXml(root: XNode): string {

    const docType = root.children[0]
    docType.appendSibling(new XText('\n'));

    insertNewLinesInTag('<KIPO>', root);
    insertNewLinesInTag('<PatentCAFDOC>', root);
    insertNewLinesInTag('<description>', root);

    const invTitle = root.getElemByTag('<invention-title>');
    if (invTitle) invTitle.appendChild(new XText('\n'));

    insertNewLinesInTag('<technical-field>', root);
    insertNewLinesInTag('<background-art>', root);

    const citationList = root.getElemByTag('<citation-list>');
    if (citationList) {
        insertNewLines(citationList);
        citationList.getElemsByTag('<p>')
            .forEach(child => insertNewLines(child));

        insertNewLinesInTag('<patent-literature>', root);
        insertNewLinesInTag('<patcit>', root);
        insertNewLinesInTag('<non-patent-literature>', root);
        insertNewLinesInTag('<nplcit>', root);
    }

    insertNewLinesInTag('<summary-of-invention>', root);
    insertNewLinesInTag('<tech-problem>', root);
    insertNewLinesInTag('<tech-solution>', root);
    insertNewLinesInTag('<advantageous-effects>', root);

    const briefDrawings = root.getElemByTag('<description-of-drawings>');
    if (briefDrawings) {
        insertNewLines(briefDrawings);
        briefDrawings.getElemsByTag('<br>')
            .forEach(br => br.appendSibling(new XText('\n')));
    }

    insertNewLinesInTag('<description-of-embodiments>', root);

    const tables = root.getElemsByTag('<tables>');
    if (tables.length > 0) {
        tables.forEach(tbl => {
            if (tbl.getChildNodeAt(0)?.tagName === 'img') {
                return;
            }
            tbl.appendChild(new XText('\n'));
            tbl.getElemByTag('<table>')?.appendChild(new XText('\n'));
            tbl.getElemByTag('<tgroup>')?.appendChild(new XText('\n'));

            const colspecs = tbl.getElemsByTag('<colspec>');
            colspecs[0]?.prependSibling(new XText('\n'));
            colspecs.forEach(colspec => colspec.appendSibling(new XText('\n')));

            const tbody = tbl.getElemByTag('<tbody>');
            if (tbody) insertNewLines(tbody);

            tbl.getElemsByTag('<row>')
                .forEach(row => insertNewLines(row));

            const entries = tbl.getElemsByTag('<entry>');
            entries.forEach(entry => {
                if (entry.nextSibling?.tagName === 'entry') {
                    entry.appendSibling(new XText('\n'));
                }
            });
        });
    }

    insertNewLinesInTag('<claims>', root);
    root.getElemsByTag('claim')
        .forEach(claim => insertNewLines(claim));

    insertNewLinesInTag('<abstract>', root);
    insertNewLinesInTag('<summary>', root);
    insertNewLinesInTag('<abstract-figure>', root);

    const figref = root.getElemByTag('<figref>');
    if (figref) {
        figref.prependSibling(new XText('\n'));
        figref.appendSibling(new XText('\n'));
    }

    insertNewLinesInTag('<drawings>', root);
    root.getElemsByTag('<figure>')
        .forEach(fig => insertNewLines(fig));

    return root.outerXML;
}

function insertNewLinesInTag(tagName: string, root: XNode) {
    const elem = root.getElemByTag(tagName);
    if (!elem) return;

    insertNewLines(elem)
}

function insertNewLines(elem: XElement) {
    elem.prependChild(new XText('\n'));
    elem.childElems.forEach(child => {
        child.appendSibling(new XText('\n'));
    });
}