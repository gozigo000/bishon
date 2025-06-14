
export class Msgs {
    private static instance: Msgs;
    private messages: Message[] = [];

    private constructor() {}
    static getInstance(): Msgs {
        if (!Msgs.instance) {
            Msgs.instance = new Msgs();
        }
        return Msgs.instance;
    }

    static addWarning(message: string) {
        this.getInstance().messages.push({
            type: "warning",
            message: message
        });
    }

    static addError(error: Error) {
        this.getInstance().messages.push({
            type: "error",
            message: error.message,
            error: error
        });
    }

    static getMsgs() {
        return this.getInstance().messages;
    }

    static getCombinedMsgs() {
        const ret: Message[] = [];
        this.getInstance().messages.forEach(msg => {
            if (!ret.find(m => 
                m.type === msg.type && 
                m.message === msg.message)
            ) {
                ret.push(msg);
            }
        });
        return ret;
    }

    static clear() {
        this.getInstance().messages = [];
    }
}

