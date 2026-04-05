import EventEmitter from 'events';
export declare class CreeveyReporter {
    private logger;
    constructor(runner: EventEmitter);
    private getLogger;
    private getErrors;
}
