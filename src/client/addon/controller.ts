import { Addon_TypesEnum } from 'storybook/internal/types';
import { denormalizeStoryParameters } from '../../shared/index.js';
import {
  CreeveyStatus,
  CreeveyUpdate,
  isDefined,
  TestData,
  TestStatus,
  StoriesRaw,
  StorybookEvents,
} from '../../types.js';
import { initCreeveyClientApi, CreeveyClientApi } from '../shared/creeveyClientApi.js';
import { calcStatus } from '../shared/helpers.js';
import { getEmojiByTestStatus } from './utils.js';
import { API } from 'storybook/manager-api';

export const ADDON_ID = 'creevey';

// TODO Add `useController` hook
// TODO use `import { useGlobals, useStorybookApi } from 'storybook/manager-api';`
export class CreeveyController {
  storyId = '';
  activeBrowser = '';
  selectedTestId = '';
  status: CreeveyStatus = { isRunning: false, tests: {}, browsers: [], isUpdateMode: false };
  creeveyApi: CreeveyClientApi | null = null;
  stories: StoriesRaw = {};

  updateStatusListeners: ((update: CreeveyUpdate) => void)[] = [];
  changeTestListeners: ((testId: string) => void)[] = [];
  constructor(public storybookApi: API) {
    this.storybookApi = storybookApi;
  }
  initAll = async (): Promise<void> => {
    this.storybookApi.on(StorybookEvents.STORY_RENDERED, this.onStoryRendered);
    this.storybookApi.on(StorybookEvents.SET_STORIES, this.onSetStories);
    this.creeveyApi = await initCreeveyClientApi();
    this.creeveyApi.onUpdate(this.handleCreeveyUpdate);
    this.status = await this.creeveyApi.status;
  };

  onUpdateStatus(listener: (update: CreeveyUpdate) => void): () => void {
    this.updateStatusListeners.push(listener);
    return () => void (this.updateStatusListeners = this.updateStatusListeners.filter((x) => x != listener));
  }

  onChangeTest(listener: (testId: string) => void): () => void {
    this.changeTestListeners.push(listener);
    return () => void (this.changeTestListeners = this.changeTestListeners.filter((x) => x != listener));
  }

  handleCreeveyUpdate = (update: CreeveyUpdate): void => {
    const { tests, removedTests = [], isRunning } = update;
    if (isDefined(isRunning)) {
      this.status.isRunning = isRunning;
    }
    if (isDefined(tests)) {
      const prevTests = this.status.tests;
      const prevStories = this.stories;
      Object.values(tests)
        .filter(isDefined)
        .forEach((update) => {
          const { id, skip, status, results, approved, storyId } = update;
          const test = prevTests[id];
          if (!test) {
            return (prevTests[id] = update);
          }
          if (isDefined(skip)) test.skip = skip;
          if (isDefined(status)) {
            test.status = status;
            if (isDefined(storyId) && isDefined(prevStories[storyId])) {
              const story = prevStories[storyId];
              const storyStatus = this.getStoryTests(storyId);
              const oldStatus = storyStatus
                .map((x) => (x.id === id ? status : x.status))
                .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);

              story.name = this.addStatusToStoryName(story.name, calcStatus(oldStatus, status), skip ?? false);
            }
          }
          if (isDefined(results)) {
            if (test.results) test.results.push(...results);
            else test.results = results;
          }
          if (isDefined(approved)) {
            Object.entries(approved).forEach(
              ([image, retry]) => retry !== undefined && ((test.approved = test.approved ?? {})[image] = retry),
            );
          }
        });
      const nextTests: Partial<Record<string, TestData>> = {};
      const testsToRemove = new Set(removedTests.map(({ id }) => id));

      for (const id in prevTests) {
        if (testsToRemove.has(id)) continue;
        nextTests[id] = prevTests[id];
      }

      this.status.tests = nextTests;
      this.stories = prevStories;
      this.setPanelsTitle();
      // TODO Check setStories method in 6.x and migrate properly
      this.storybookApi.emit(StorybookEvents.SET_STORIES, this.stories);
    }
    this.updateStatusListeners.forEach((x) => {
      x(update);
    });
  };

  getCurrentTest = (): TestData | undefined => {
    return this.status.tests[this.selectedTestId];
  };

  onStoryRendered = (storyId: string): void => {
    if (this.storyId === '') this.addStatusesToSideBar();
    if (this.storyId !== storyId) {
      this.storyId = storyId;
      this.selectedTestId = this.getTestsByStoryIdAndBrowser(this.activeBrowser)[0]?.id ?? '';
      this.setPanelsTitle();
      this.changeTestListeners.forEach((x) => {
        x(this.selectedTestId);
      });
    }
  };

  onStart = (): void => {
    this.creeveyApi?.start([this.selectedTestId]);
  };

  onStop = (): void => {
    this.creeveyApi?.stop();
  };

  onImageApprove = (id: string, retry: number, image: string): void => this.creeveyApi?.approve(id, retry, image);

  onStartAllStoryTests = (): void => {
    const ids: string[] = Object.values(this.status.tests)
      .filter(isDefined)
      .filter((x) => x.storyId === this.storyId)
      .map((x) => x.id);
    this.creeveyApi?.start(ids);
  };

  onStartAllTests = (): void => {
    const ids = Object.values(this.status.tests)
      .filter(isDefined)
      .map((x) => x.id);
    this.creeveyApi?.start(ids);
  };
  onSetStories = (data: Parameters<typeof denormalizeStoryParameters>['0']): void => {
    const stories = data.v ? denormalizeStoryParameters(data) : data.stories;
    this.stories = stories;
  };

  setActiveBrowser = (browser: string): void => {
    this.activeBrowser = browser;
    this.selectedTestId = this.getTestsByStoryIdAndBrowser(this.activeBrowser)[0]?.id ?? '';
    this.changeTestListeners.forEach((x) => {
      x(this.selectedTestId);
    });
  };

  setSelectedTestId = (testId: string): void => {
    this.selectedTestId = testId;
    this.changeTestListeners.forEach((x) => {
      x(this.selectedTestId);
    });
  };

  getStoryTests = (storyId: string): TestData[] => {
    return Object.values(this.status.tests)
      .filter((result) => result?.storyId === storyId)
      .filter(isDefined);
  };

  getBrowsers = (): string[] => {
    return this.status.browsers;
  };

  getTestsByStoryIdAndBrowser = (browser: string): TestData[] => {
    return Object.values(this.status.tests)
      .filter((x) => x?.browser === browser && x.storyId === this.storyId)
      .filter(isDefined);
  };

  getTabTitle = (browser: string): string => {
    const tests = this.getTestsByStoryIdAndBrowser(browser);
    const browserStatus = tests
      .map((x) => x.status)
      .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);
    const browserSkip = tests.length > 0 ? tests.every((x) => x.skip) : false;
    const emojiStatus = getEmojiByTestStatus(browserStatus, browserSkip);
    return `${emojiStatus ? `${emojiStatus} ` : ''}Creevey/${browser}`;
  };

  setPanelsTitle = (): void => {
    const panels = this.storybookApi.getElements(Addon_TypesEnum.PANEL);
    let firstPanelBrowser = this.activeBrowser;
    for (const p in panels) {
      const panel = panels[p];
      if (panel.id?.indexOf(ADDON_ID) === 0 && panel.paramKey) {
        panel.title = this.getTabTitle(panel.paramKey);
        if (!firstPanelBrowser) firstPanelBrowser = panel.paramKey;
      }
    }
    this.storybookApi.setSelectedPanel(`${ADDON_ID}/panel/${firstPanelBrowser}`);
  };

  addStatusesToSideBar(): void {
    if (!Object.keys(this.stories).length) return;

    const stories = this.stories;
    Object.keys(this.stories).forEach((storyId) => {
      const storyStatus = this.getStoryTests(storyId);
      const status = storyStatus
        .map((x) => x.status)
        .reduce((oldStatus, newStatus) => calcStatus(oldStatus, newStatus), undefined);
      const skip = storyStatus.length > 0 ? storyStatus.every((x) => x.skip) : false;
      this.stories[storyId].name = this.addStatusToStoryName(stories[storyId].name, status, skip);
    });

    // TODO Check setStories method in 6.x and migrate properly
    this.storybookApi.emit(StorybookEvents.SET_STORIES, this.stories);
  }

  addStatusToStoryName(name: string, status: TestStatus | undefined, skip: string | boolean): string {
    name = name.replace(/^(❌|✔|🟡|🕗|⏸) /, '');
    const emojiStatus = getEmojiByTestStatus(status, skip);
    return `${emojiStatus ? `${emojiStatus} ` : ''} ${name}`;
  }
}
