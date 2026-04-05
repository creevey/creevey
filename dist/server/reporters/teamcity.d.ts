import EventEmitter from 'events';
export declare class TeamcityReporter {
    constructor(runner: EventEmitter, options: {
        reportDir: string;
    });
    private escape;
}
