import { ONode } from "../2-xmlParser/nodes.js";

export type Relationship = {
    relationshipId: string;
    target: string;
    type: string;
}

export class Relationships {
    private targetsByRelationshipId: Record<string, string> = {};
    private targetsByType: Record<string, string[]> = {};

    constructor(relships: Relationship[]) {
        relships.forEach((relship) => {
            this.targetsByRelationshipId[relship.relationshipId] = relship.target;
        });
        relships.forEach((relship) => {
            if (!this.targetsByType[relship.type]) {
                this.targetsByType[relship.type] = [];
            }
            this.targetsByType[relship.type].push(relship.target);
        });
    }

    findTargetByRelationshipId(relationshipId: string): string {
        return this.targetsByRelationshipId[relationshipId] || '';
    }

    findTargetsByType(type: string): string[] {
        return this.targetsByType[type] || [];
    }
}

export const defaultRelationships = new Relationships([]);

export function readRelationships(element: ONode): Relationships {
    const relships: Relationship[] = [];
    element.children.forEach(child => {
        if (child.name !== "relationships:Relationship") return;
        const relship: Relationship = {
            relationshipId: child.attributes.Id,
            target: child.attributes.Target,
            type: child.attributes.Type
        };
        relships.push(relship);
    });
    return new Relationships(relships);
}
