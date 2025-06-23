import { XNode, XText } from "../2-lightParser/1-node/node";

export function prettyKipoXml(root: XNode): string {

    const docType = root.childNodes[0]
    docType.appendSibling(new XText('\n'));

    const KIPO = root.getElemByTag('<KIPO>');
    if (KIPO) {
        KIPO.prependChild(new XText('\n'));
        KIPO.appendChild(new XText('\n'));
    }

    const PatentCAFDOC = root.getElemByTag('<PatentCAFDOC>');
    if (PatentCAFDOC) {
        PatentCAFDOC.prependChild(new XText('\n'));
        PatentCAFDOC.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const description = root.getElemByTag('<description>');
    if (description) {
        description.prependChild(new XText('\n'));
        description.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const invTitle = root.getElemByTag('<invention-title>');
    if (invTitle) {
        invTitle.appendChild(new XText('\n'));
    }

    const techField = root.getElemByTag('<technical-field>');
    if (techField) {
        techField.prependChild(new XText('\n'));
        techField.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const backgArt = root.getElemByTag('<background-art>');
    if (backgArt) {
        backgArt.prependChild(new XText('\n'));
        backgArt.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const citationList = root.getElemByTag('<citation-list>');
    if (citationList) {
        citationList.prependChild(new XText('\n'));
        citationList.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });

        const pTags = citationList.getAllElemsByTag('<p>');
        pTags.forEach(child => {
            child.prependChild(new XText('\n'));
            child.childElems.forEach(child => {
                child.appendSibling(new XText('\n'));
            });
        });

        const patentLiterature = root.getElemByTag('<patent-literature>');
        if (patentLiterature) {
            patentLiterature.prependChild(new XText('\n'));
            patentLiterature.childElems.forEach(child => {
                child.appendSibling(new XText('\n'));
            });
        }

        const patcit = root.getElemByTag('<patcit>');
        if (patcit) {
            patcit.prependChild(new XText('\n'));
            patcit.childElems.forEach(child => {
                child.appendSibling(new XText('\n'));
            });
        }

        const nonPatentLiterature = root.getElemByTag('<non-patent-literature>');
        if (nonPatentLiterature) {
            nonPatentLiterature.prependChild(new XText('\n'));
            nonPatentLiterature.childElems.forEach(child => {
                child.appendSibling(new XText('\n'));
            });
        }

        const nplcit = root.getElemByTag('<nplcit>');
        if (nplcit) {
            nplcit.prependChild(new XText('\n'));
            nplcit.childElems.forEach(child => {
                child.appendSibling(new XText('\n'));
            });
        }
    }

    const invSummary = root.getElemByTag('<summary-of-invention>');
    if (invSummary) {
        invSummary.prependChild(new XText('\n'));
        invSummary.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    };

    const problem = root.getElemByTag('<tech-problem>');
    if (problem) {
        problem.prependChild(new XText('\n'));
        problem.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const solution = root.getElemByTag('<tech-solution>');
    if (solution) {
        solution.prependChild(new XText('\n'));
        solution.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const effects = root.getElemByTag('<advantageous-effects>');
    if (effects) {
        effects.prependChild(new XText('\n'));
        effects.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    } else {
        console.log('effects is not found');
    }

    const briefDrawings = root.getElemByTag('<description-of-drawings>');
    if (briefDrawings) {
        briefDrawings.prependChild(new XText('\n'));
        briefDrawings.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });

        const brTags = briefDrawings.getAllElemsByTag('<br>');
        brTags.forEach(br => {
            br.appendSibling(new XText('\n'));
        });
    } else {
        console.log('briefDrawings is not found');
    }

    const embodiments = root.getElemByTag('<description-of-embodiments>');
    if (embodiments) {
        embodiments.prependChild(new XText('\n'));
        embodiments.childElems.forEach(embodiment => {
            embodiment.appendSibling(new XText('\n'));
        });
    } else {
        console.log('embodiments is not found');
    }

    const tables = root.getAllElemsByTag('<tables>');
    if (tables.length > 0) {
        tables.forEach(tbl => {
            if (tbl.getChildNodeAt(0)?.tagName === 'img') {
                return;
            }
            tbl.appendChild(new XText('\n'));
            const table = tbl.getElemByTag('<table>');
            table?.appendChild(new XText('\n'));
            const tgroup = tbl.getElemByTag('<tgroup>');
            tgroup?.appendChild(new XText('\n'));

            const colspecs = tbl.getAllElemsByTag('<colspec>');
            colspecs[0]?.prependSibling(new XText('\n'));
            colspecs.forEach(colspec => {
                colspec.appendSibling(new XText('\n'));
            });

            const tbody = tbl.getElemByTag('<tbody>');
            tbody?.prependChild(new XText('\n'));
            tbody?.childElems.forEach(child => {
                child.appendSibling(new XText('\n'));
            });

            const rows = tbl.getAllElemsByTag('<row>');
            rows.forEach(row => {
                row.prependChild(new XText('\n'));
                row.appendChild(new XText('\n'));
            });

            const entries = tbl.getAllElemsByTag('<entry>');
            entries.forEach(entry => {
                if (entry.nextSibling?.tagName === 'entry') {
                    entry.appendSibling(new XText('\n'));
                }
            });
        });
    }

    const claims = root.getElemByTag('<claims>');
    if (claims) {
        claims.prependChild(new XText('\n'));
        claims.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    } else {
        console.log('claims is not found');
    }

    const eachClaims = root.getAllElemsByTag('claim');
    eachClaims.forEach(claim => {
        claim.prependChild(new XText('\n'));
        claim.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    });

    const abstract = root.getElemByTag('<abstract>');
    if (abstract) {
        abstract.prependChild(new XText('\n'));
        abstract.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    } else {
        console.log('abstract is not found');
    }

    const summary = root.getElemByTag('<summary>');
    if (summary) {
        summary.prependChild(new XText('\n'));
        summary.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const absfig = root.getElemByTag('<abstract-figure>');
    if (absfig) {
        absfig.prependChild(new XText('\n'));
        absfig.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const figref = root.getElemByTag('<figref>');
    if (figref) {
        figref.prependSibling(new XText('\n'));
        figref.appendSibling(new XText('\n'));
    }

    const drawings = root.getElemByTag('<drawings>');
    if (drawings) {
        drawings.prependChild(new XText('\n'));
        drawings.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    }

    const figs = root.getAllElemsByTag('<figure>');
    figs.forEach(fig => {
        fig.prependChild(new XText('\n'));
        fig.childElems.forEach(child => {
            child.appendSibling(new XText('\n'));
        });
    });

    return root.outerXML;
}