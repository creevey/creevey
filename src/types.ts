export interface Capabilities {
  browserName: string;
}

export interface Config {
  gridUrl: string;
  address: {
    host: string;
    port: number;
    path: string;
  };
  testDir: string;
  screenDir: string;
  reportDir: string;
  browsers: { [key: string]: Capabilities };
}
