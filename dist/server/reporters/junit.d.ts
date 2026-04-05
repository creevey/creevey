import EventEmitter from 'events';
export declare class JUnitReporter {
    private reportFile;
    private fileFd?;
    private logger;
    private creeveyReporter;
    private suites;
    constructor(runner: EventEmitter, options: {
        reportDir: string;
        reporterOptions: {
            outputFile?: string;
        };
    });
    private writeElement;
    private writeTasks;
    private onFinished;
}
