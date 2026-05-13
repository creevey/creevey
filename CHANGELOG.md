# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.36](https://github.com/creevey/creevey/compare/v0.10.35...v0.10.36) (2026-05-12)


### ⚠ BREAKING CHANGES

* The Creevey Storybook addon has been removed. Remove Creevey addon preset/decorator usage from your Storybook config and migrate to the standalone web UI or the Playwright/Selenium workflows. See documentation for updated setup and migration guidance.

### Features

* 🎸 add `dockerImagePlatform` config option ([f52de6c](https://github.com/creevey/creevey/commit/f52de6c31ab41012ce127702d0967c8f40fb7c20))
* 🎸 add `failFast` CLI option. Terminates on first fail ([0023bbb](https://github.com/creevey/creevey/commit/0023bbb022e71b7b3cb60fd7cea9bdb89a7e87bc))
* 🎸 add `failFat` parameter to the config ([c4fe538](https://github.com/creevey/creevey/commit/c4fe538569311cc7ca3c0c9e8e93916cf4a3cb8b))
* 🎸 add ability to update story arguments from test cases ([18d8ecb](https://github.com/creevey/creevey/commit/18d8ecb909097b585282a04bfb0b0c721ad45e22))
* 🎸 add storiesProvider config option ([7cf7454](https://github.com/creevey/creevey/commit/7cf74542d527bcfd5b41b17026464a4f9298e1f5))
* 🎸 add support `play()` story method ([318ac62](https://github.com/creevey/creevey/commit/318ac628cb14fb0de7a89c088ae241df520df1e7))
* 🎸 add webdriver debug logging ([6124a43](https://github.com/creevey/creevey/commit/6124a43b79d2761c3f04f6f3f118599ecb517c27))
* 🎸 change format for `skip` parameter ([f244b7c](https://github.com/creevey/creevey/commit/f244b7cd344b276762408a1df841e5afc3853fad))
* 🎸 failFast doesn't disable maxRetries option ([c81c637](https://github.com/creevey/creevey/commit/c81c63784aecea890596647225ce8278d7383df5))
* 🎸 improve delay option to allow specify browsers ([4bec3b5](https://github.com/creevey/creevey/commit/4bec3b5a4ddca2e2610db4ecf79f0e859202da65))
* 🎸 Improve skip options ([2fcc624](https://github.com/creevey/creevey/commit/2fcc624a9b2ab1dcdce3927779c8f58bb0a0d02c))
* 🎸 run extract stories.json on storybook-build ([803a1d1](https://github.com/creevey/creevey/commit/803a1d1b9b774121e1a611dfbbe1a3ad041339af))
* add git-cliff changelog and automated release/publish workflows ([f69890b](https://github.com/creevey/creevey/commit/f69890b9ef8b65e267c8e3e2251527b976732660))
* add host param to config ([4d10422](https://github.com/creevey/creevey/commit/4d10422aa57e7dbc80c1f4a880f3472200abdf7b))
* devcontainer support ([75ccad0](https://github.com/creevey/creevey/commit/75ccad0079b6fe13af8b8a02fb4a476f48fd5bdc))
* devcontainer support ([5347af1](https://github.com/creevey/creevey/commit/5347af135ffe0dc70f4aa1484a60156e184773ed))
* drop support for storybook &lt; 6.4 ([fb8c0f5](https://github.com/creevey/creevey/commit/fb8c0f5158ab7c0495949eaa61ba52049c3d66cf))
* drop support of storybook &lt; 6.4 ([4ce669e](https://github.com/creevey/creevey/commit/4ce669e7cee58af3bfc8b8fe09d8b31559512b01))
* host option for creevey-server ([c9b4738](https://github.com/creevey/creevey/commit/c9b4738f2500299d5c96da4c791bcfb65caf7c91))
* host option for creevey-server ([c38eb4a](https://github.com/creevey/creevey/commit/c38eb4a5849195a0bbee5fcb999a11c26d71d31b))
* hybrid stories provider ([89d9c73](https://github.com/creevey/creevey/commit/89d9c7357369dffb320ea06fe158b4113f57034c))
* **junit:** add failure/error body text and separate errors count ([e702c4e](https://github.com/creevey/creevey/commit/e702c4ee3fec01cef2a9d1f1486554a0082af882))
* **junit:** add hostname and sequential id attributes to testsuite ([c4e69f7](https://github.com/creevey/creevey/commit/c4e69f75bf5955b1fb7af85cbeb3730abf370652))
* **junit:** add screenshot attachment properties to testcase elements ([693b375](https://github.com/creevey/creevey/commit/693b3753a1918a1d2bf8a46bafbcffbf9b5bf923))
* **junit:** extend writeElement with textContent parameter ([5334660](https://github.com/creevey/creevey/commit/53346607fd7781ff1323ddedbfa9cd6c4c351395))
* **junit:** fix suite keying for multi-browser runs ([0ea235a](https://github.com/creevey/creevey/commit/0ea235af51faa857cabcc2f390dfd4d7ef2afdc4))
* new creevey params: "global" and "kind" ([7d7c885](https://github.com/creevey/creevey/commit/7d7c88521a28c91586bfdd663500bea576845292))
* remove Creevey Storybook addon; unify webdriver plumbing; update web UI ([37f36e5](https://github.com/creevey/creevey/commit/37f36e5452daf7d43b560d26c3adaee71138cfca))
* support storybook 6.4 ([74010e5](https://github.com/creevey/creevey/commit/74010e53d93ff1815427cd7ee818481ce6e21288))
* support Storybook 6.4 ([b4baf97](https://github.com/creevey/creevey/commit/b4baf97a31208c74671b4d24141d6b19f0f7635c))


### Bug Fixes

* 🐛 icons layout ([6cca3bf](https://github.com/creevey/creevey/commit/6cca3bf0c789ab3b2cbfd3c757fc0a1e1520e50f))
* 🐛 improve `waitForStorybook` wait for `setStories` event ([8431918](https://github.com/creevey/creevey/commit/8431918656378b6760a60da8570fb18952de210c))
* 🐛 improve update to approve only failed images ([f0e5719](https://github.com/creevey/creevey/commit/f0e5719f1b8d1b0fb105bacb5619cd903eadced6))
* 🐛 make creevey work with vite ([0d576c6](https://github.com/creevey/creevey/commit/0d576c6e2660fd4f29ba4efd440d4af9ee590ac2))
* 🐛 report test as a failed for teamcity reporter ([0e58915](https://github.com/creevey/creevey/commit/0e58915b6d14441e14851c7c3bc888fe0759ddce))
* 🐛 resolve storybook preview config after babel/register ([cb3f46c](https://github.com/creevey/creevey/commit/cb3f46c0502264cdd5aefc2dc397da1892938eb5))
* 🐛 revert cross-env scripts, as they not work in unix ([92b04a5](https://github.com/creevey/creevey/commit/92b04a5bed56191b7ee6bd169f5327e30a1c2232))
* 🐛 save report data after each tests run ([86c6c2e](https://github.com/creevey/creevey/commit/86c6c2ee1261bdc38fc3b7c6ebb1753348339a0a))
* 🐛 selenium url path to '/' for webkit browsers ([748d896](https://github.com/creevey/creevey/commit/748d8968c645ee684cec5dcd899d2de749d5e2c6))
* 🐛 some issues for storybook 5.3 and create-react-preset ([c1e20b3](https://github.com/creevey/creevey/commit/c1e20b31234875d3ef961ce3804e3384d858f94d))
* 🐛 update didn't use report data to approve failed tests ([107d0fa](https://github.com/creevey/creevey/commit/107d0faf4c717bbb7a547422e9baf7105389d0bd))
* **addon:** make bundlers to load esm version of addon ([07a4c12](https://github.com/creevey/creevey/commit/07a4c12fc8311c96e33c92df595d2934d80a6410))
* **addon:** make bundlers to load esm version of addon ([f2937ca](https://github.com/creevey/creevey/commit/f2937caccca158e68c8be45d0882ec9b62eb05b2))
* **addon:** restore and move ie11 support to separate addon ([3ba2cc7](https://github.com/creevey/creevey/commit/3ba2cc7fde281037406f1705c0abc616c576e641))
* **addon:** restore and move ie11 support to separate preset ([2d65e94](https://github.com/creevey/creevey/commit/2d65e9417d366d956ee32f4f0c9acd57864fc820))
* **addon:** restore IE11 support ([3561391](https://github.com/creevey/creevey/commit/35613914618cb86911dfafad538576a95d57f84a))
* **addon:** restore IE11 support ([94f452f](https://github.com/creevey/creevey/commit/94f452fff4225e974c9efdff21f982d5155de4f8))
* allow setting timeouts via capabilities ([72de9e5](https://github.com/creevey/creevey/commit/72de9e50b818587309f665c782637ae43c3e4864))
* allow using "capture"  with nodejsStoriesProvider ([c4d8562](https://github.com/creevey/creevey/commit/c4d8562d5f5839cc27267e24127bbc42dcecd427))
* browser-node regexp parameters transfering ([737670e](https://github.com/creevey/creevey/commit/737670e18aa5d0ce416fe12b765406116b453e31))
* correct call of the test fn ([98c03ad](https://github.com/creevey/creevey/commit/98c03ad1700486bfd75170f4517970717250f6d8))
* default yarn verison to stable ([48bfaed](https://github.com/creevey/creevey/commit/48bfaed9ccadb3f804c68612084ed41409f8d970))
* deps issue with storybook@6.5 and yarn@1 ([f91990a](https://github.com/creevey/creevey/commit/f91990a594828766b212a657dcb4c7df895bf877))
* drop support of SkipOption on root skip level ([bfaae0b](https://github.com/creevey/creevey/commit/bfaae0b8c0190516cde02575e7e3140a6dcaf812))
* drop support of SkipOption on root skip level ([31be1bf](https://github.com/creevey/creevey/commit/31be1bf4d67f464ea6790e6e218ca75674366711))
* handle null from selectStory ([1895602](https://github.com/creevey/creevey/commit/1895602143b3236ab195e11fcfa162df2a01af03))
* ie11 support ([523e35b](https://github.com/creevey/creevey/commit/523e35b6950d978ca3aaa77dd4f072a835053687))
* infinite UI loading ([94d61aa](https://github.com/creevey/creevey/commit/94d61aa7bb92762c2fa84e385b39b98845f63f70))
* infinite UI loading ([4f7b47d](https://github.com/creevey/creevey/commit/4f7b47db3ff1274217b044ce608e34d22148fe32))
* **junit:** address code quality issues in test infrastructure ([c7351dd](https://github.com/creevey/creevey/commit/c7351ddaf62d20dee2279a6c13afdf37a15cacc9))
* **junit:** align failure/error counting with XML elements ([abfb9e2](https://github.com/creevey/creevey/commit/abfb9e26a3b926e03a1879490a0f325fc2987935))
* **junit:** fix multi-line textContent indentation and isImageMismatch guard ([bebbaac](https://github.com/creevey/creevey/commit/bebbaac2888dd95d9ae326269a5e581556f6131f))
* **junit:** hoist hostname call and tighten spec-attr test assertions ([ee83f41](https://github.com/creevey/creevey/commit/ee83f4130920688e7a78d07dffd208b74a00546a))
* **junit:** tighten attachment assertions and add multi-attachment test ([d9e1840](https://github.com/creevey/creevey/commit/d9e1840e7fbf057b234eb0f640fe4b1f571b73c8))
* move addon to the separate entry point ([f3fc59f](https://github.com/creevey/creevey/commit/f3fc59f980a56f87f882507c3a0367ed6a356d33))
* move the addon to a separate entry point ([7c23ee1](https://github.com/creevey/creevey/commit/7c23ee1323220bede4df5b4c26c6c4811f8652e5))
* prevent importing browser-specific code to node ([37706ef](https://github.com/creevey/creevey/commit/37706efbb49dd5bd1d6ec06821fac52480a0e132))
* **providers:** set creevey port for all providers ([79e8aae](https://github.com/creevey/creevey/commit/79e8aae629d79260f93a93057486bab659801a46))
* **release:** use manifest mode instead of release-type in workflow ([bbb78c0](https://github.com/creevey/creevey/commit/bbb78c03cc9033f67e8e107a95ff96623ade6e79))
* rename creevey config extensions from .mts to .ts ([fc8d7c4](https://github.com/creevey/creevey/commit/fc8d7c44ced881aa84b5ed043510e00569107e77))
* **selenium-webdriver:** bump [@types](https://github.com/types) package version ([fcc6a2c](https://github.com/creevey/creevey/commit/fcc6a2c056c116125f8d3162375ea8e6acd1de06))
* **selenium-webdriver:** bump [@types](https://github.com/types) package version ([ca4b369](https://github.com/creevey/creevey/commit/ca4b369046e2c56e0548f5cbb6f98c17b0125228))
* stabilize 0.8.0 ([15dfdda](https://github.com/creevey/creevey/commit/15dfddafe9c9a48f57fe86843f6f7981930214e7))


### Documentation

* ✏️ add maintaining note in readme ([2a1354d](https://github.com/creevey/creevey/commit/2a1354ddbb1de7fb5cce3d6349aa9f8335f6f7a7))
* ✏️ update todos ([57ddc97](https://github.com/creevey/creevey/commit/57ddc979555b0128a9a1e029e025400dfccea90b))
* add creevey logo ([b75d3f7](https://github.com/creevey/creevey/commit/b75d3f7231ca4dd4f268f88da220b4aa63dd2f46))
* add creevey logo ([acf7e78](https://github.com/creevey/creevey/commit/acf7e784e6cab0d5333f76236c3a754e198c2012))
* add junit reporter improvements design spec ([0c8be62](https://github.com/creevey/creevey/commit/0c8be62247f1cfa7fb908dc4844959f19ff0dd9e))
* doc global and kind parameters ([851ee45](https://github.com/creevey/creevey/commit/851ee45c4b4da6958f8cb78f6062d8fa8eb186e4))
* doc supported storybook versions ([1870ce8](https://github.com/creevey/creevey/commit/1870ce850f5098a39ed899ed02cded21dba17a3f))
* extend multiple skip example ([81d2f0e](https://github.com/creevey/creevey/commit/81d2f0eafa5bce841297e8ae3f8764b8bd5486e1))
* mark junit reporter improvements plan and design as completed ([c3a05c9](https://github.com/creevey/creevey/commit/c3a05c93ae3c43f90b7c973b79a5a6b318fadde5))
* update release process in memories ([b51c574](https://github.com/creevey/creevey/commit/b51c574cb444b87782ce53d72f8c060d8cb2d5a7))
* update skip examples ([08dc28e](https://github.com/creevey/creevey/commit/08dc28eb6dfb77e18fc33f4bbc0981c49ad8ce67))


### Code Refactoring

* 💡 cleanup some stuff ([d6ed892](https://github.com/creevey/creevey/commit/d6ed892f32ba3602d1fc3f2617b49f45389031fd))
* 💡 prepare to support svelte CSF stories ([7d9c2c6](https://github.com/creevey/creevey/commit/7d9c2c6887ca1de33b3abea9ca106bc3c46547bb))
* **junit:** extract suiteKey/getOrCreateSuite helpers, fix test assertions ([e43191c](https://github.com/creevey/creevey/commit/e43191cf9260dfaf9bf78b580a2fe16c3bc94800))


### Tests

* 💍 add more e2e tests for storybook building and extract ([1f6b559](https://github.com/creevey/creevey/commit/1f6b559d591e80c4cc2dc7a9b20803175c11d751))
* 💍 add one more test for skip options ([b6ff022](https://github.com/creevey/creevey/commit/b6ff02236da6b9d27fa15ddf2278c9bd012d6d85))
* 💍 approve tests ([fed22af](https://github.com/creevey/creevey/commit/fed22af34afe8070f90849114bc4d30f85132053))
* 💍 fix line endings for windows ([3a69def](https://github.com/creevey/creevey/commit/3a69def5f0f283cfe0ad6325f57d639185665dd8))
* 💍 fix loader test for windows ([14955b1](https://github.com/creevey/creevey/commit/14955b143585111562498387d498bb8d15c812e4))
* 💍 fix some e2e cases ([8cbe731](https://github.com/creevey/creevey/commit/8cbe731b4fceaaf7a854dc8532b34962033ce2dc))
* 💍 fix utils tests names ([e400c22](https://github.com/creevey/creevey/commit/e400c22f19264fd737415246aa2bf22dafa21847))
* 💍 remove e2e tests use jest instead for unit tests ([82339e8](https://github.com/creevey/creevey/commit/82339e8c852c22324fbf795fb9ea90489d3c17fd))
* 💍 update approval e2e tests ([c5d62d2](https://github.com/creevey/creevey/commit/c5d62d2712104d971ab159fe395223028bbf436a))
* 💍 update e2e tests ([9b72248](https://github.com/creevey/creevey/commit/9b7224849cc40d23836240c8397647c10b823c2d))
* 💍 Update screenshot images ([6effd5a](https://github.com/creevey/creevey/commit/6effd5a4904e85703091e83b174ce211e6431700))
* add e2e test for 6.4 ([946a257](https://github.com/creevey/creevey/commit/946a2575bbfcf2c0c51883d35e820b397a8f4fac))
* approve latest e2e changes ([75ba132](https://github.com/creevey/creevey/commit/75ba13246e5c96ad414fa8b7c83c4c6ccacfb281))
* approve minor changes ([419475d](https://github.com/creevey/creevey/commit/419475df54ced555079463b356be42d7e7a85071))
* stories serialization ([9446990](https://github.com/creevey/creevey/commit/94469909c75f70b956c1ab7159fc1a6b05e72a1b))
* update screenshots due browsers update ([ec85c0a](https://github.com/creevey/creevey/commit/ec85c0a60e79b94e69b97c4d31668d81292d2347))
* wip ([42c3535](https://github.com/creevey/creevey/commit/42c35356f78d756ed79cc0bd88dc06756940c31f))


### Miscellaneous

* release as 0.10.36 ([b4644cf](https://github.com/creevey/creevey/commit/b4644cf9fb6cb1ce47a79e1fa020b695ef7908fe))

## [Unreleased]

### Added

- 🎸 add support `play()` story method
- Hybrid stories provider
- Drop support for storybook < 6.4
- Host option for creevey-server
- Add host param to config
- Devcontainer support
- Remove Creevey Storybook addon; unify webdriver plumbing; update web UI
- **junit:** Extend writeElement with textContent parameter
- **junit:** Fix suite keying for multi-browser runs
- **junit:** Add failure/error body text and separate errors count
- **junit:** Add screenshot attachment properties to testcase elements
- **junit:** Add hostname and sequential id attributes to testsuite

### Changed

- **junit:** Extract suiteKey/getOrCreateSuite helpers, fix test assertions

### Documentation

- ✏️ add maintaining note in readme
- Doc supported storybook versions
- Update skip examples
- Extend multiple skip example
- Add creevey logo
- Add junit reporter improvements design spec
- Mark junit reporter improvements plan and design as completed

### Fixed

- **selenium-webdriver:** Bump @types package version
- **addon:** Restore and move ie11 support to separate addon
- Correct call of the test fn
- Prevent importing browser-specific code to node
- Ie11 support
- Allow setting timeouts via capabilities
- Browser-node regexp parameters transfering
- Handle null from selectStory
- Move addon to the separate entry point
- Infinite UI loading
- **addon:** Restore IE11 support
- Drop support of SkipOption on root skip level
- **addon:** Make bundlers to load esm version of addon
- **providers:** Set creevey port for all providers
- 🐛 icons layout
- Default yarn verison to stable
- **junit:** Address code quality issues in test infrastructure
- **junit:** Align failure/error counting with XML elements
- **junit:** Tighten attachment assertions and add multi-attachment test
- **junit:** Hoist hostname call and tighten spec-attr test assertions
- **junit:** Fix multi-line textContent indentation and isImageMismatch guard

### Miscellaneous

- 🤖 fix lint issues
- 🤖 disable storybook e2e test
- Move readDirRecursive to utils
- Merge params from tests correctly
- Use storybook's Id constructor
- Export new entities from index
- Add typescript support
- Move to testsFiles dir and renamve config options
- 🤖 update deps
- 🤖 update deps
- 🤖 change babel config to support unit tests
- Dont wait testFn call result
- Ignore testFn return value
- Move presets to common dir
- Add entry points for presets
- Prevent polyfills duplication
- Restore babel transformation of client code
- Fix exports field
- Complete ie11 preset
- Trying to remove webpack usage
- Export test parser types
- Temp fix for IgnoredException
- 0.8.1-sb7.1
- 0.8.1-sb7.4
- Support storybook 7
- Fix types
- 0.9.0-beta.6
- Wip
- 0.9.0-beta.8
- Clear preset
- 0.9.0-beta.9
- 0.9.0-beta.10
- 0.9.0-beta.11
- Try suppress the "document unloaded" error

### Testing

- 💍 update e2e tests
- 💍 remove e2e tests use jest instead for unit tests
- Stories serialization
- Update screenshots due browsers update
- Remove old screenshots

### Build

- Commit yarn.lock changes
- Setup package.json's exports field
- Use @storybook/core-client instead of @storybook/core

### Ci

- 🎡 updated circle ci images versions
- 🎡 update github actions script
- Run lint before build in CI workflow
- Downgrade node version from 22 to 20 in CI workflow

### Wip

- Test hybrid provider
## [0.8.0-beta.0] - 2022-03-17

### Added

- Support storybook 6.4
- New creevey params: "global" and "kind"
- 🎸 change format for `skip` parameter
- 🎸 Improve skip options

### Documentation

- Doc global and kind parameters

### Fixed

- 🐛 revert cross-env scripts, as they not work in unix

### Miscellaneous

- Update stories params

### Testing

- 💍 Update screenshot images
- Add e2e test for 6.4
- Approve latest e2e changes
- Approve minor changes
- Wip
- 💍 update approval e2e tests
- 💍 fix utils tests names
- 💍 add one more test for skip options

### Build

- Update storybook
## [0.7.39] - 2021-11-04

### Added

- 🎸 add ability to update story arguments from test cases

### Changed

- 💡 cleanup some stuff

### Miscellaneous

- 🤖 replace `jsdom-global` to `global-jsdom` to avoid errors in output

### Testing

- 💍 approve tests
- 💍 fix some e2e cases
## [0.7.38] - 2021-09-28

### Added

- 🎸 add storiesProvider config option

### Miscellaneous

- 🤖 update deps
- **deps:** Bump tar from 6.1.2 to 6.1.11
- **deps-dev:** Bump immer from 9.0.5 to 9.0.6
- **deps:** Bump nth-check from 2.0.0 to 2.0.1
- **deps:** Bump tmpl from 1.0.4 to 1.0.5
- 🤖 update deps

### Testing

- 💍 fix loader test for windows
- 💍 fix line endings for windows
## [0.7.37] - 2021-08-27

### Added

- 🎸 improve delay option to allow specify browsers
- 🎸 failFast doesn't disable maxRetries option

### Fixed

- 🐛 save report data after each tests run
- 🐛 selenium url path to '/' for webkit browsers
## [0.7.36] - 2021-07-30

### Documentation

- ✏️ update todos

### Fixed

- 🐛 report test as a failed for teamcity reporter

### Miscellaneous

- 🤖 update deps

### Ci

- 🎡 update teamcity config version to 2021.1
## [0.7.35] - 2021-07-28

### Added

- 🎸 add `dockerImagePlatform` config option

### Fixed

- 🐛 update didn't use report data to approve failed tests

### Ci

- 🎡 fix artifacts source path for client bundle
## [0.7.34] - 2021-07-12

### Added

- 🎸 add `failFat` parameter to the config
## [0.7.33] - 2021-07-12

### Added

- 🎸 add `failFast` CLI option. Terminates on first fail

### Changed

- 💡 prepare to support svelte CSF stories

### Fixed

- 🐛 improve `waitForStorybook` wait for `setStories` event
- 🐛 some issues for storybook 5.3 and create-react-preset
- 🐛 make creevey work with vite
## [0.7.32] - 2021-07-07

### Added

- 🎸 run extract stories.json on storybook-build
- 🎸 add webdriver debug logging
## [0.7.31] - 2021-06-26

### Added

- 🎸 add `until` selenium helpers to test context

### Fixed

- 🐛 ignore docsOnly stories for now
- 🐛 improve listen story render error with `waitForReady`
- 🐛 resolving storybook modules for version less than 6.2
- 🐛 resolve storybook preview config after babel/register
- 🐛 improve update to approve only failed images

### Miscellaneous

- 🤖 update todos
- **deps:** Bump postcss from 7.0.35 to 7.0.36
- 🤖 update deps

### Testing

- 💍 add more e2e tests for storybook building and extract
## [0.7.30] - 2021-06-10

### Fixed

- Package.json & yarn.lock to reduce vulnerabilities
- 🐛 resolving storybook modules
- 🐛 import the same webpack as used for storybook manager

### Miscellaneous

- **deps:** Bump dns-packet from 1.3.1 to 1.3.4
- 🤖 update deps
- 🤖 downgrade ts for issue storybook#15067
- 🤖 update deps

### Testing

- 💍 update some images
## [0.7.29] - 2021-05-30

### Added

- 🎸 improve `update` command allow to pass match pattern

### Fixed

- 🐛 allow pass boolean value to skip parameter

### Miscellaneous

- 🤖 update deps
## [0.7.28] - 2021-05-20

### Added

- 🎸 improve extract stories by using only babel
- 🎸 support for extract cjs and object.assign

### Changed

- 💡 simplify babel transformation helpers

### Fixed

- 🐛 improve process exiting with hooks, add ie11 tests
- 🐛 types after update to Storybook 6.2
- 🐛 improve babel-plugin to handle storiesOf in loops
- 🐛 creevey loader transforms csf funcs with props
- 🐛 csf template.bind extract correctly
- 🐛 remove some non-story and custom expressions

### Miscellaneous

- 🤖 update deps
- 🤖 update deps
- **deps:** Bump url-parse from 1.4.7 to 1.5.1
- **deps:** Bump handlebars from 4.7.6 to 4.7.7

### Testing

- 💍 fix absolute path in e2e tests
- 💍 update storybook official approvals
- 💍 update some firefox screenshots

### Ci

- 🎡 ignore ie for now
- 🎡 fix report view resources
## [0.7.27] - 2021-03-31

### Fixed

- 🐛 capturing screenshots in ie11
- 🐛 compose browsers with external grid and builtin selenoid

### Miscellaneous

- 🤖 update deps

### Testing

- 💍 ignore readdir error for tests
- 💍 fix absolute paths for storybook e2e tests
- 💍 another fix for absolute storybook path
- 💍 approve storybook official e2e test

### Ci

- 🎡 fix e2e test job steps
- 🎡 fix repository paramter for checkout action
## [0.7.26] - 2021-03-28

### Added

- 🎸 allow define custom selenoid images and skip pull step
- 🎸 add `waitForReady` story parameter
- 🎸 add `--extract` as faster alternative to `sb extract`

### Changed

- 💡 simplify configs
- 💡 move e2e test approvals to separate directory

### Fixed

- 🐛 don't show run button in a report

### Miscellaneous

- 🤖 update deps

### Testing

- 💍 fix e2e tests, make `npm i` before install creevey

### Ci

- 🎡 remove e2e tests from any CI except github
## [0.7.25] - 2021-03-18

### Added

- 🎸 add sidebar keyboard handlers
- 🎸 add support storybook 6.2
- 🎸 support capture mdx stories

### Changed

- 💡 move all webpack-relative code to separate dir

### Documentation

- ✏️ move examples to separate repo

### Fixed

- 🐛 hover shouldn't override focus styles
- 🐛 test status icons align
- 🐛 exclude all addons from nodejs storybook bundle

### Miscellaneous

- 🤖 fix eslint errors and warnings
- **deps:** Bump react-dev-utils from 11.0.3 to 11.0.4
- 🤖 update deps
- 🤖 update deps

### Testing

- 💍 fix e2e test after small refactor

### Ci

- 🎡 fix reports for gitlab
- 🎡 fix gitlab yaml config
- 🎡 gitlab fix report view bundle
- 🎡 fix gitlab report view
- 🎡 fix report view port and circle ci reports
- 🎡 fix circle ci attach workspace after checkout
- 🎡 make tests requires build
- 🎡 fix gitlab requirements for jobs
- 🎡 fix circle ci report view
## [0.7.24] - 2021-03-10

### Added

- 🎸 new panels in addon
- Allow to ignore elements in screenshot

### Changed

- 💡 delete unused code from old addon
- 💡 replace addon components, use ADDON_ID
- 💡 simplify addon manager method
- Use mocha beforeEach hook for cleaning
- Keep ignored elements interactable between screenshots
- Move dom manimulations to the decorator
- 💡 api: get browsers without status

### Documentation

- Add example for ignoreElements option
- Update TODO
- ✏️ update todos

### Fixed

- 🐛 websocket invalid frame error
- 🐛 some security issues
- Upgrade tslib from 2.0.3 to 2.1.0
- Upgrade zone.js from 0.11.3 to 0.11.4

### Miscellaneous

- 🤖 update deps
- 🤖 delete space if test status is unknown
- 🤖 review fixes
- 🤖 update deps
- 🤖 update creevey in examples
- 🤖 update deps
- Change method of ignoring elements
- Improve ignore styles
- Ensure ignore styles removal
- 🤖 update deps
- 🤖 update deps for examples
- **deps:** Bump ini from 1.3.5 to 1.3.8 in /examples/angular
- 🤖 update deps
- 🤖 update husky configs
- **deps:** Bump pug-code-gen from 3.0.1 to 3.0.2 in /examples/vue
- **deps:** Bump pug from 3.0.0 to 3.0.2 in /examples/vue
- 🤖 update deps
- **deps:** Bump elliptic from 6.5.3 to 6.5.4
- **deps:** Bump elliptic from 6.5.3 to 6.5.4 in /examples/vue
- **deps:** Bump elliptic from 6.5.3 to 6.5.4 in /examples/svelte
- **deps:** Bump elliptic from 6.5.3 to 6.5.4 in /examples/react
- **deps:** Bump elliptic from 6.5.3 to 6.5.4 in /examples/angular

### Styling

- Fix formatting

### Testing

- 💍 make e2e tests more presistent
- 💍 setup gitlab ui tests
- 💍 improve gitlab ui test config
- 💍 fix gitlab gridurls config
- 💍 update screenshots
- Add screenshots with ignored elements
- Update screenshots with ignored elements
- 💍 fix a couple of screenshot tests
- 💍 make e2e be less depended on env
## [0.7.23] - 2021-01-25

### Fixed

- 🐛 use shelljs to run selenoid binary
## [0.7.22] - 2021-01-25

### Fixed

- Run standalone browsers and selenoid
- Selenium url path for standalone run
## [0.7.21] - 2021-01-22

### Added

- 🎸 improve creevey-loader, cut-off side-effects
- 🎸 save webpack stats.json on debug

### Fixed

- 🐛 store stats.json into report dir
- 🐛 make report from static files works from creevey repo
- 🐛 create protocol relative image url
- 🐛 protocol relative resolving
- 🐛 encode only path tokens for url
- 🐛 get image url with empty port number

### Miscellaneous

- **deps-dev:** Bump immer from 8.0.0 to 8.0.1
- **deps:** Bump socket.io from 2.3.0 to 2.4.1 in /examples/angular
- 🤖 update deps

### Testing

- 💍 add e2e bundle compare
## [0.7.20] - 2021-01-15

### Fixed

- 🐛 apply iframe after custom resolver
## [0.7.19] - 2021-01-14

### Added

- Allow to set storybook's globals

### Changed

- Mark the feature as experimental

### Fixed

- 🐛 document unloaded while waiting for result
- 🐛 document unloaded error, again
- 🐛 properly output unnecessary images

### Miscellaneous

- Check storybook's version
## [0.7.18] - 2021-01-08

### Fixed

- 🐛 copy-paste missing function from storybook

### Miscellaneous

- Add funding.yml
## [0.7.17] - 2021-01-07

### Fixed

- 🐛 addon erases global parameters in storybook
## [0.7.16] - 2021-01-06

### Fixed

- 🐛 spinner position in sidebar
- 🐛 resolve url for ie11
## [0.7.15] - 2021-01-06

### Added

- 🎸 add run all buttons in addon

### Changed

- 💡 tune a little addon tabs
- Remove unused export
- 💡 addon

### Documentation

- ✏️ update authors

### Fixed

- 🐛 trim story kinds
- 🐛 addon show test name in tabs panel

### Miscellaneous

- 🤖 fixes after review
- 🤖 add disabled state to run buttons in addon
- 🤖 update deps

### Styling

- 💄 change a little some comments
## [0.7.14] - 2021-01-01

### Changed

- ⚡️ exclude fork ts checker plugin for webpack

### Fixed

- 🐛 disable debug logger for storybook 5.x
- 🐛 resolve storybook properly and wait for page load
## [0.7.13] - 2020-12-30

### Added

- 🎸 start creevey server early and wait for build

### Changed

- ⚡️ speedup resolving storybook url

### Fixed

- 🐛 images preview urls
## [0.7.12] - 2020-12-24

### Fixed

- 🐛 set timeout after open for ie11

### Miscellaneous

- **deps:** Bump node-notifier from 8.0.0 to 8.0.1 in /examples/react
## [0.7.11] - 2020-12-21

### Added

- 🎸 store tests view in browser history

### Fixed

- 🐛 webpack mdx rule
- 🐛 webpack mdx regexp, again
- 🐛 exclude docgen plugin for webpack bundle
- 🐛 addon result page scroll height

### Miscellaneous

- 🤖 update deps
## [0.7.10] - 2020-12-15

### Fixed

- 🐛 switch stories error
## [0.7.9] - 2020-12-14

### Added

- 🎸 add support docker auth config for private registry

### Ci

- 🎡 add chromatic for testing purpose
- 🎡 fix chromatic
- 🎡 fix chromatic lfs
- 🎡 fix chromatic checkout action
## [0.7.8] - 2020-12-14

### Fixed

- 🐛 resolve url with docker
## [0.7.7] - 2020-12-14

### Fixed

- 🐛 handle getaddrinfo error
## [0.7.6] - 2020-12-14

### Documentation

- ✏️ update todos

### Fixed

- 🐛 don't check `isInDocker` for docker internal host
## [0.7.5] - 2020-12-14

### Added

- 🎸 link to current story

### Changed

- 💡 fix warn

### Documentation

- ✏️ install storybook and creevey into svelte example
- ✏️ split docs in a few files

### Fixed

- 🐛 download selenoid binary
- 🐛 webpack and update options
- 🐛 creevey-loader support private class members

### Miscellaneous

- **deps:** Bump ini from 1.3.5 to 1.3.7 in /examples/vue
- **deps:** Bump ini from 1.3.5 to 1.3.7 in /examples/react
- 🤖 update deps
- 🤖 update react to 17.0
- 🤖 update deps for angular example
- 🤖 update storybook in angular example
- 🤖 update deps for vue example

### Testing

- 💍 add more image views tests
## [0.7.4] - 2020-12-11

### Added

- 🎸 add mvp to allow run selenoid without docker

### Changed

- 💡 fix promise types

### Documentation

- ✏️ added svelte example app

### Fixed

- 🐛 merge skip options properly
- 🐛 change cache dir, some issues on windows
- 🐛 resolve grid url without docker

### Miscellaneous

- **deps:** Bump highlight.js from 10.4.0 to 10.4.1 in /examples/react
- **deps:** Bump highlight.js in /examples/angular
- 🤖 bump selfsigned to 1.10.8
- 🤖 bump node-forge to 0.10.0
- **deps:** Bump highlight.js from 10.4.0 to 10.4.1
- **deps:** Bump ini from 1.3.5 to 1.3.7

### Ci

- 🎡 update circleci and gitlab configs
## [0.7.3] - 2020-12-02

### Added

- 🎸 remove skbkontur ip address resolver
- 🎸 apply disable animation styles in storybook decorator

### Documentation

- ✏️ rewrite readme a little
- ✏️ update readme
- ✏️ update readme
- ✏️ add emoji

### Miscellaneous

- Update creevey demo video
## [0.7.2] - 2020-11-28

### Added

- 🎸 improve scale handling for image views

### Fixed

- 🐛 invalid websocket frame

### Miscellaneous

- 🤖 update deps

### Testing

- 💍 add BlendView tests
- 💍 improve e2e tests
## [0.7.1] - 2020-11-24

### Added

- 🎸 improve side-by-side view for wide images
- 🎸 side-by-side view supports layout resizing

### Documentation

- ✏️ update readme
- ✏️ add abbyy logo
- ✏️ fix logo images

### Fixed

- 🐛 don't cutoff named exports

### Miscellaneous

- 🤖 update deps
- 🤖 update deps and storybook to 6.1
- 🤖 fix types

### Styling

- 💄 hotfix prettier write glob pattern

### Testing

- 💍 start adding creevey-storybook e2e tests
- 💍 add tests for 6.1, 5.3 and 5.2 versions of storybook
- 💍 add tests for 5.1 and 5.0 versions of storybook
- 💍 improve performance for e2e tests

### Ci

- 🎡 improve github actions
- 🎡 improve github actions
## [0.7.0] - 2020-11-09

### Added

- 🎸 Dark theme in client

### Changed

- Remove comments
- 💡 fix linter

### Documentation

- ✏️ update readme
- ✏️ fix whisk logo

### Fixed

- 🐛 get channel before it created
- 🐛 toggle theme sticky z-index

### Miscellaneous

- 🤖 add global decorator with theme
- 🤖 main loader in dark theme
- 🤖 use custom storybook scroll
- 🤖 allow change theme from client
- Fix scroll
- Theme switcher with icons
- Fix scroll with big image

### Styling

- 💄 fix prettier

### Testing

- Approve images with storybook colors
## [0.7.0-beta.21] - 2020-11-02

### Fixed

- 🐛 wait for fonts loaded
## [0.7.0-beta.20] - 2020-10-30

### Fixed

- 🐛 don't cutoff `name` prop from stories params
## [0.7.0-beta.19] - 2020-10-30

### Fixed

- 🐛 macos docker netwrok internal host address
## [0.7.0-beta.18] - 2020-10-29

### Added

- 🎸 change default capture element to `#root`

### Documentation

- ✏️ update todos
- ✏️ update angular example
- ✏️ update react example
- ✏️ update vue example

### Fixed

- 🐛 improve creevey loader cutoff stories meta data
- 🐛 cutoff parameters in new declarative preview config
- 🐛 storybook framework detection
- 🐛 reset body margin for client ui

### Miscellaneous

- 🤖 update deps
## [0.7.0-beta.17] - 2020-10-16

### Fixed

- 🐛 filter tests without statuses
## [0.7.0-beta.16] - 2020-10-16

### Changed

- 💡 remove unused @skbkontur libraries
- 💡 remove unused @emotion libraries
- 💡 remove unused @skbkontur libraries
- 💡 use data-tid, simplify story
- 💡 move CreeveyContext from shared to web

### Fixed

- 🐛 watch stories in windows
- 🐛 make sidebar a little narrower

### Miscellaneous

- 🤖 update todos
- 🤖 main loader from storybook components
- Remove client ResultPage
- Remove @emotion/core using
- 🤖 main loader from storybook components
- Remove comments
- 🤖 remove unused loaders
- 🤖 fix deps of storybook/core

### Testing

- 💍 add sideBar active and hover test

### Ci

- 🎡 disable tests for gitlab
## [0.7.0-beta.15] - 2020-10-13

### Added

- 🎸 sideBar on storybook components

### Fixed

- 🐛 small ui issues in SideBar
- 🐛 don't output message about unnecessary image
- 🐛 improve `getImageUrl` for circle ci at least

### Miscellaneous

- 🤖 sideBar header on storybook components
- 🤖 pageFooter on storybook components

### Styling

- 💄 flatten checkbox and bold icons
## [0.7.0-beta.14] - 2020-10-13

### Added

- 🎸 remove `useDocker`. Creevey run docker by default
- 🎸 output unnecessary images on full run

### Fixed

- 🐛 fallback report if api don't available

### Ci

- 🎡 add gitlab integration
## [0.7.0-beta.13] - 2020-10-09

### Fixed

- 🐛 add stories in addon
- 🐛 don't fail on mdx stories, just ignore it for now
- 🐛 re-disable animation
- 🐛 don't crash on storybook reload error

### Miscellaneous

- 🤖 move addon/PageHeader to shared and use it
- 🤖 update deps

### Testing

- 💍 add page header tests
- 💍 approve pageHeader screenshots

### Ci

- Add codeql action
## [0.7.0-beta.12] - 2020-10-05

### Fixed

- 🐛 hmr tests on windows
- 🐛 report static bundle, add polyfiils

### Miscellaneous

- 🤖 update deps
## [0.7.0-beta.11] - 2020-10-05

### Fixed

- 🐛 build addon to support ie11
- 🐛 output readable error message on switch story
- 🐛 run tests on circle ci

### Miscellaneous

- 🤖 remove unused define plugin variable
- 🤖 update deps

### Ci

- 🎡 setup screenshot tests for circle
- 🎡 fix build artifacts
- 🎡 add build job for github actions
## [0.7.0-beta.10] - 2020-10-02

### Fixed

- 🐛 some generated modules are excluded as external
## [0.7.0-beta.9] - 2020-10-02

### Fixed

- 🐛 some ui markup, change placeholder message

### Miscellaneous

- 🤖 show placeholder when server is not running
- 🤖 addon in panel instead of tab
- 🤖 update todos
## [0.7.0-beta.8] - 2020-10-02

### Fixed

- 🐛 storybook override creevey story parameters

### Miscellaneous

- 🤖 add storybook essential addon
## [0.7.0-beta.7] - 2020-10-01

### Added

- 🎸 support declarative decorators format

### Changed

- 💡 rename src/utils => src/shared
- 💡 move addon/ImagesView to shared
- 💡 in client use imagesView from shared

### Miscellaneous

- 🤖 update todos
- 🤖 update deps
- 🤖 update todos
- 🤖 Uppdate todo
- Remove todos

### Testing

- 💍 use components from addon in tests
## [0.7.0-beta.6] - 2020-09-29

### Fixed

- 🐛 loader handle `export default {} as Meta`

### Ci

- 🎡 publish artifacts
## [0.7.0-beta.5] - 2020-09-28

### Changed

- 💡 rename creevey port variable

### Fixed

- 🐛 remove old selenoid container on start
## [0.7.0-beta.4] - 2020-09-26

### Fixed

- 🐛 small addon ui issues
- 🐛 small layout fixes in addon
- 🐛 correctly load report from previous run

### Miscellaneous

- **deps:** Bump bl from 4.0.2 to 4.0.3

### Ci

- 🎡 add screenshot tests
## [0.7.0-beta.3] - 2020-09-25

### Added

- 🎸 Storybook addon
- 🎸 Add run button in addon
- 🎸 show status in sidebar
- 🎸 add support docker

### Changed

- 💡 extract code that used in client and addon
- 💡 simplify docker initialization code

### Fixed

- 🐛 eslint errors
- 🐛 use `find-dir-cache` to store cache in right place
- 🐛 use selenoid instead of browser images
- Docker network for windows/wsl
- 🐛 resolve storybook url on windows with multiple networks

### Miscellaneous

- **deps:** Bump http-proxy from 1.17.0 to 1.18.1
- **deps:** Bump http-proxy from 1.18.0 to 1.18.1 in /examples/react
- **deps:** Bump http-proxy from 1.18.0 to 1.18.1 in /examples/angular
- **deps:** Bump node-fetch from 2.6.0 to 2.6.1
- **deps:** Bump node-fetch from 2.6.0 to 2.6.1 in /examples/angular
- **deps:** Bump node-fetch from 2.6.0 to 2.6.1 in /examples/react
- **deps:** Bump node-fetch from 2.6.0 to 2.6.1 in /examples/vue
- **deps:** Add @storybook/theming and @storybook/components
- 🤖 add storyId in Test
- 🤖 update todos
## [0.7.0-beta.2] - 2020-09-10

### Fixed

- 🐛 exit master process with after hook
## [0.7.0-beta.1] - 2020-09-08

### Added

- 🎸 add before/after hooks
- 🎸 show error images in imagePreview

### Changed

- 💡 output only error message for image assert
- 💡 move some server files into directory
- 💡 add IPC message handlers

### Fixed

- 🐛 collect all errors
- 🐛 don't show error if image has been approved

### Miscellaneous

- **deps:** Bump markdown-to-jsx in /examples/react
- **deps:** Bump markdown-to-jsx in /examples/angular
- 🤖 update storybook to stable version
## [0.7.0-beta.0] - 2020-08-04

### Added

- 🎸 support storybook v6.x

### Fixed

- 🐛 remove scroll when change image in swap mode
- 🐛 tests hot reloading
- 🐛 image preview height
- 🐛 gracefully end worker processes

### Miscellaneous

- 🤖 update deps
- 🤖 update deps
- 🤖 update deps
- **deps:** Bump elliptic from 6.4.1 to 6.5.3
- 🤖 fix `dot-prop` vulnerability
- **deps:** Bump elliptic from 6.5.2 to 6.5.3 in /examples/angular
- **deps:** Bump elliptic from 6.5.2 to 6.5.3 in /examples/vue
- **deps:** Bump elliptic from 6.5.2 to 6.5.3 in /examples/react

### Testing

- 💍 update test images
## [0.6.4] - 2020-07-27

### Added

- 🎸 add disabled state to start button
- 🎸 Save view mode

### Fixed

- 🐛 storybook bundle depends on core-js, regenerator-runtime
- 🐛 react example loadash vulnerability
- 🐛 watch stories on windows
- 🐛 hot-reloading issue, add readme notes

### Miscellaneous

- **deps:** Bump npm-registry-fetch in /examples/angular
- **deps:** Bump lodash from 4.17.15 to 4.17.19
- **deps:** Bump lodash from 4.17.15 to 4.17.19 in /examples/angular
- **deps:** Bump lodash from 4.17.15 to 4.17.19 in /examples/vue
## [0.6.3] - 2020-06-16

### Fixed

- 🐛 test reloading dont work well
## [0.6.2] - 2020-06-10

### Fixed

- 🐛 disable hot-reloading without `--ui` option
## [0.6.1] - 2020-06-10

### Fixed

- 🐛 ERR_IPC_CHANNEL_CLOSED finally
- 🐛 mocha 7.2 multiple runs, remove old hacks

### Miscellaneous

- 🤖 update minor/patch deps versions
- 🤖 update eslint to 7.x, update eslint-plugins
## [0.6.0] - 2020-06-09

### Changed

- 💡 disable perfomance hints for webpack build

### Documentation

- ✏️ update readme
- ✏️ fix links in readme
- ✏️ update framework examples
- ✏️ update authors and todos

### Fixed

- 🐛 kind-of@6.0.2 vulnerability
- 🐛 loader: remove vars in desctructuring

### Miscellaneous

- **deps:** Bump websocket-extensions from 0.1.3 to 0.1.4

### Vue

- Add readme
- Create app && add 'eslint-plugin-vue' 4 pre-commit
- Add storybook
- Add creevey
## [0.6.0-beta.8] - 2020-06-04

### Fixed

- 🐛 output warning `Did you call 'load' twice` on reload
## [0.6.0-beta.7] - 2020-06-02

### Fixed

- 🐛 webpack recursion IPC, again
## [0.6.0-beta.6] - 2020-06-02

### Fixed

- 🐛 IPC messages recursion, again
## [0.6.0-beta.5] - 2020-06-02

### Fixed

- 🐛 webpack compiler process send messages recursion
## [0.6.0-beta.4] - 2020-06-02

### Added

- 🎸 allow use `delay` with custom tests

### Fixed

- 🐛 another fix to gracefully exit
- 🐛 check element before capturing screenshot
- 🐛 some small init/exit issues
## [0.6.0-beta.3] - 2020-05-27

### Fixed

- 🐛 make loader be more aggressive
- 🐛 EPIPE message on exit again
- 🐛 soft-freeze mocha version on 7.1
## [0.6.0-beta.2] - 2020-05-18

### Fixed

- 🐛 correctly close browser session on SIGINT
- 🐛 correct shutdown workers
- 🐛 ignore removing bundle cache directory
## [0.6.0-beta.1] - 2020-05-15

### Fixed

- 🐛 storybook framework detection on windows
## [0.6.0-beta.0] - 2020-05-14

### Added

- 🎸 rework load stories process
- 🎸 add creevey-loader for webpack

### Changed

- 💡 remove unused `require.context` and `pirates` hooks
- 💡 fix worker message issue after rebase

### Fixed

- 🐛 support latest selenium browser drivers

### Miscellaneous

- 🤖 update deps
- 🤖 update deps

### Testing

- 💍 update screenshot images
## [0.5.6] - 2020-05-04

### Fixed

- 🐛 handle worker initiating error
## [0.5.5] - 2020-04-21

### Added

- 🎸 support .creevey config dir
- 🎸 add `saveReport` cli option, enabled by default

### Documentation

- ✏️ add example and guide for angular project
- ✏️ small update for angular and chore fixes
- ✏️ add example and guide for react project

### Miscellaneous

- 🤖 clean-up npm scripts

### Ci

- 🎡 skip examples from type-checking process
## [0.5.4] - 2020-04-04

### Fixed

- 🐛 remove new code that added by mistake
## [0.5.3] - 2020-04-04

### Changed

- 💡 move selenium helpers in separate module

### Fixed

- 🐛 precompile decorator file for ie11 target

### Miscellaneous

- 🤖 update AUTHORS
- 🤖 update deps
## [0.5.2] - 2020-03-30

### Documentation

- ✏️ add authors and changelog files

### Fixed

- 🐛 use selenium as deps, rename storybook peerDeps package
- Ignore *.scss modules while loading stories

### Miscellaneous

- 🤖 small changes in todos

### Styling

- 💄 reformat, fix lint issues
## [0.5.1] - 2020-03-26

### Added

- 🎸 output story render error

### Miscellaneous

- 🤖 update react-ui to pre-2.0 unstable version
- 🤖 update react-ui to next major version
- 🤖 update deps
## [0.5.0] - 2020-03-25

### Added

- 🎸 support safari for composite images
- 🎸 rewrite storybook decorator to be framework agnostic

### Fixed

- 🐛 take composite images without hiding scrollbar
- 🐛 improve blend view css filters
- 🐛 gracefully close selenium session
- 🐛 jsdom localStorage warning

### Miscellaneous

- **deps:** Bump acorn from 6.3.0 to 6.4.1
- 🤖 update deps
## [0.4.11] - 2020-03-13

### Fixed

- 🐛 hide scroll only for composite screenshots
## [0.4.10] - 2020-03-13

### Fixed

- 🐛 skip by test name with multiple skip options
## [0.4.9] - 2020-03-13

### Changed

- 💡 simplify `storyTestFabric`, use test context

### Fixed

- 🐛 exclude `@babel/*` modules from skiping while fastload
## [0.4.8] - 2020-03-13

### Fixed

- 🐛 broken skip by test names
## [0.4.7] - 2020-03-13

### Fixed

- 🐛 register require.context before all other modules
## [0.4.6] - 2020-03-13

### Added

- 🎸 allow take composite screenshots in custom tests
## [0.4.5] - 2020-03-12

### Added

- 🎸 add `delay` creevey story parameter

### Miscellaneous

- 🤖 add to npmignore some stuff
## [0.4.4] - 2020-03-12

### Added

- 🎸 add `debug` cli option
- 🎸 improve creevey story params typings, simplify tests
## [0.4.3] - 2020-03-11

### Added

- 🎸 improve fastloading, to allow use side effects
## [0.4.2] - 2020-03-11

### Fixed

- 🐛 patch babel-register hook to support all extensions

### Miscellaneous

- 🤖 add end gap in sidebar
## [0.4.1] - 2020-03-10

### Fixed

- 🐛 some minor issues
## [0.4.0] - 2020-03-04

### Added

- 🎸 add test hot reloading, support new storybook configs

### Changed

- 💡 make `retries` optional property in Test
- 💡 update screenshots, fix some minor issues
## [0.3.8] - 2020-03-03

### Documentation

- ✏️ add type descriptions and update readme

### Fixed

- 🐛 ie11 don't work due async fn in types.ts file
- 🐛 register pirates hook before any compiler

### Miscellaneous

- 🤖 update deps, fix typos

### Ci

- 🎡 add github actions lint workflow
## [0.3.7] - 2020-02-20

### Added

- 🎸 add onClick on teststatus for filter

### Changed

- 💡 mv parcing in sidebarheader, add functionfor click
- 💡 simplify status filter handling

### Fixed

- 🐛 fix bug with sync call onCompare

### Miscellaneous

- 🤖 remove underline of test status button
- 🤖 update deps

### Testing

- 💍 fix screenshot tests, and approve chrome diff color
## [0.3.6] - 2020-02-17

### Fixed

- 🐛 output error message while init for master process
- Ignore various non-js extensions on story load

### Miscellaneous

- 🤖 update todos
## [0.3.5] - 2020-02-11

### Changed

- 💡 chai-images to be more reusable

### Fixed

- 🐛 remove mkdirp dependency
- 🐛 don't mutate test scope on image assertion
- 🐛 don't show tests without status by status filter
- 🐛 improve configs load process
- 🐛 support windows paths to load storybook, disable debug
- 🐛 support renamed stories
- Correct handle process errors for worker

### Miscellaneous

- 🤖 update deps
- 🤖 update deps
- 🤖 update deps
## [0.3.4] - 2020-01-17

### Added

- 🎸 improve stories initialization speed
- 🎸 allow pass diff options to pixelmatch

### Fixed

- 🐛 improve fast-loading, throw non-syntax errors on require
## [0.3.3] - 2020-01-16

### Fixed

- 🐛 add hint for images preview
- 🐛 move mocha typing to devDeps

### Miscellaneous

- 🤖 update immer to 5.3.2
## [0.3.2] - 2020-01-15

### Fixed

- 🐛 initiate browser after all stories has been loaded

### Miscellaneous

- 🤖 update some deps
## [0.3.1] - 2020-01-13

### Fixed

- 🐛 require config when path don't have extension
- 🐛 capture screenshot of element with non-integer size
## [0.3.0] - 2020-01-10

### Added

- 🎸 remove support explicit test cases

### Documentation

- ✏️ update TODO.md
## [0.2.6] - 2020-01-10

### Added

- 🎸 add `tests` story parameter for public usage
- 🎸 add `toMatchImages` assertion for chai
## [0.2.5] - 2020-01-10

### Added

- 🎸 add `reportDir/screenDir` cli options
- 🎸 load stories in nodejs and generate tests in runtime

### Fixed

- 🐛 correct work update with new report structure

### Miscellaneous

- 🤖 update deps
- 🤖 downgrade @types/node
## [0.2.4] - 2019-12-23

### Fixed

- 🐛 don't use webdriver object serialization
- 🐛 convert export story names to storybook format
## [0.2.3] - 2019-12-19

### Fixed

- 🐛 wrap long suite/test titles
- 🐛 allow skip tests by kinds

### Miscellaneous

- 🤖 update deps
## [0.2.2] - 2019-12-11

### Fixed

- 🐛 correct publish artifacts for TeamCity reporter
## [0.2.1] - 2019-12-11

### Documentation

- ✏️ update todos

### Fixed

- 🐛 correct report teamcity artifacts
- 🐛 allow click on checkbox in sidebar
- 🐛 firefox SlideView

### Miscellaneous

- 🤖 update deps

### Testing

- 💍 add SideBar screenshot tests
## [0.2.0] - 2019-12-05

### Added

- 🎸 update SideBar markup by prototype
- 🎸 improve markup for ResultPage by prototypes
- View tests results count in sidebar
- 🎸 sticky SideBar with sitcky header
- 🎸 output penging tests count
- Swap images buttons by prototype

### Changed

- 💡 split views, rename some types, update typescript
- 💡 creevey app on hooks
- 💡 eslint fix all errors
- 💡 improve ImagePreview, simplify ResultsPage

### Fixed

- 🐛 improve SideBar tests view
- 🐛 switch between tests
- 🐛 a lot of bugs with views, approve and more
- Tests status move down, when scroll is shown
- 🐛 ImagesView correctly resize image in most cases

### Miscellaneous

- 🤖 add prettier and lint-staged
- 🤖 add eslint config
- 🤖 update deps
- 🤖 update eslint config
- 🤖 add md/json files to lint-staged
- 🤖 update deps
- 🤖 update todos, use immer as devDeps

### Styling

- 💄 apply prettier formatting
- 💄 reformat root files
## [0.1.7] - 2019-11-22

### Added

- 🎸 allow skip test stories by kinds
## [0.1.6] - 2019-11-22

### Fixed

- 🐛 significantly improve perfomance
- 🐛 output correct reported screenshot path for teamcity
- 🐛 handle regexp skip options
## [0.1.5] - 2019-11-20

### Added

- 🎸 support write tests inside stories

### Fixed

- 🐛 require stories in nodejs env

### Miscellaneous

- 🤖 rename .babelrc
## [0.1.4] - 2019-11-18

### Fixed

- **utils:** Try resolve ip only if address is localhost
- **utils:** Improve error message when storybook page not available
- **worker:** Exit master process if worker couldn't start
- **master:** Dont output skipped tests

### Miscellaneous

- 🤖 add commitizen cli, setup git pre-commit hook

### Build

- Update deps
## [0.1.3] - 2019-11-07

### Fixed

- **storybook:** Correct fill params for old storybook
## [0.1.2] - 2019-11-07

### Fixed

- **storybook:** Read prop of undefined
## [0.1.1] - 2019-11-07

### Fixed

- **utils:** Replace ip resolver back
## [0.1.0] - 2019-11-07

### Added

- Simplify images directory

### Build

- Update deps
## [0.0.30] - 2019-11-05

### Added

- **storybook:** Disable animations for webdriver

### Changed

- **storybook:** Prepare story params for serialization

### Build

- Update deps
- Update deps
- Update .npmignore
## [0.0.29] - 2019-10-11

### Documentation

- Rewrite TODO.md

### Fixed

- **storybook:** Ie11 hot-reload
## [0.0.28] - 2019-10-09

### Fixed

- **storybook:** Dont consider scroll while capture element

### Build

- Update deps
## [0.0.27] - 2019-10-07

### Fixed

- **storybook:** Chrome serialization stories error
## [0.0.26] - 2019-10-07

### Fixed

- **storybook:** Chrome serialization stories error
## [0.0.25] - 2019-10-04

### Added

- Output removed tests status
- Generate tests from stories in runtime
- **storybook:** Pass creevey story parameters
- Make testDir optional
- **worker:** Support creevey skip story option
- Support composite images

### Changed

- Rename address to storybookUrl
- Rename global storybook hooks

### Documentation

- Update README.md
- Simplify readme
- Update TODO.md

### Fixed

- Few types issues
- **storybook:** Make parameters optional
- Correct convert kind/story into storyId
- **runner:** Mark removed tests as skiped
- **runner:** Support skip story option
- **storybook:** Hide scroll while screenshot, few issues

### Miscellaneous

- Up peer deps selenium-webdriver version

### Testing

- Update stories format
- Approve images
- Fix broken unit tests

### Build

- Update package.json
- Update deps
- Update deps
## [0.0.24] - 2019-09-16

### Added

- More improvments
- Support storybook kind depth levels

### Changed

- Fix few types issues
- Remove some unnecessary code

### Build

- Update deps
## [0.0.23] - 2019-09-12

### Documentation

- Update README.md

### Fixed

- Export mocha/chai typings

### Build

- SkipLibCheck for storybook<=5.1.x
## [0.0.22] - 2019-09-11

### Added

- **cli:** Add `update` option for batch approve
- Add storybook decorator
- Remove mocha-ui

### Changed

- **ImagesView:** Reexport, build url on parent component
- Move unit tests into separate dir
- Rename stories
- Optimize building

### Documentation

- Update TODO.md

### Fixed

- Optional hooks, fix default testRegex
- **server:** Pass args to parser, skip folders while copy static
- **storybook:** Improve export and types
- **storybook:** Support storybook@3.x
- Set-value vulnerability CVE-2019-10747

### Testing

- Fix broken typings
- Use creevey to test by youself

### Build

- Add storybook
- Update git/npm ignore files
- Update deps
## [0.0.21] - 2019-08-30

### Fixed

- **ImagesView:** Improve view for side-by-side view component
- **pool:** Improve restart workers process

### Build

- **deps:** Bump mixin-deep from 1.3.1 to 1.3.2
## [0.0.20] - 2019-08-27

### Added

- **client:** Fit large images into sidepage

### Fixed

- **client:** Better output error message
- **pool:** Correct retry tests by timeout

### Miscellaneous

- Update TODO.md
## [0.0.19] - 2019-08-21

### Fixed

- **reporter:** Try to fix parallel output on teamcity
## [0.0.18] - 2019-08-21

### Fixed

- **reporter:** Try to fix parallel output on teamcity
## [0.0.17] - 2019-08-21

### Fixed

- **reporter:** Try to fix parallel output on teamcity
## [0.0.16] - 2019-08-21

### Fixed

- **reporter:** Output full filepath in metadata
## [0.0.15] - 2019-08-21

### Added

- **runner:** Allow setup browser resolution
- **reporter:** Output image as test metadata

### Fixed

- **reporter:** Output correct test name in teamcity
## [0.0.14] - 2019-08-21

### Changed

- **chai-image:** Update types for chai

### Build

- **deps:** Bump lodash from 4.17.11 to 4.17.14
- Update deps
## [0.0.13] - 2019-07-01

### Fixed

- **worker:** Correct `retries` prop name
## [0.0.12] - 2019-07-01

### Fixed

- **server:** Pass TC version to envs worker
## [0.0.11] - 2019-07-01

### Fixed

- **reporter:** Output retry test as passed for tc
## [0.0.10] - 2019-06-26

### Fixed

- **runner:** Send stop event
## [0.0.9] - 2019-06-26

### Added

- **chai-image:** Allow pass `threshold` option
- **reporter:** Add `chalk` to color output
## [0.0.8] - 2019-06-25

### Changed

- **client:** Update pending icon

### Fixed

- **worker:** Send error message on fail, restart on timeout
## [0.0.7] - 2019-06-24

### Added

- **client:** Output disabled skiped tests

### Fixed

- **server:** Set `skip` flag require
- **parser:** Don't include ignored tests
- **chai-image:** Enable anti-aliasing for pixelmatch
- **worker:** Patch mocha to support skip tests for browser
## [0.0.6] - 2019-06-20

### Added

- **client:** Improve switcher, move start button
- **server:** Allow define uniq options for each browser

### Changed

- **TestTree:** Open root suite by default

### Fixed

- **worker:** Escape test path string
- **client:** Don't output skipped tests

### Miscellaneous

- **client:** Add open sans font

### Build

- Update to unstable react-ui
## [0.0.5] - 2019-06-17

### Fixed

- Better handle reset mouse position
- **client:** Output new images
- **utils:** Better handle reset mouse position
## [0.0.4] - 2019-06-14

### Added

- **client:** Update suites statues

### Fixed

- **utils:** Reset mouse position
- **client:** Encode image url path

### Testing

- Fix broken typings

### Build

- Update deps
## [0.0.3] - 2019-06-03

### Added

- **client:** Output test error message
- **server:** Better handle ws messages
- Render approved images
- **client:** Use `emotion` for styles
- **client:** Add different image views
- **client:** Add `SlideView` component
- **client:** Add `BlendView` component

### Changed

- **client:** Rename `TogetherView` -> `SideBySideView`

### Fixed

- **server:** Browser config merge
- **runner:** Parallel test running
- **worker:** Improve test reporter
- **server:** Restart worker on error

### Miscellaneous

- Update TODO.md

### Build

- Fix deps and npmignore
- Update deps
## [0.0.2] - 2019-05-29

### Added

- **worker:** Add reporter mvp
## [0.0.1] - 2019-05-21

### Added

- Initial version
- **chai-image:** Save images in multiple runs
- **server:** Send status with images
- **client:** Add results view component
- **TestResultView:** Render result images
- **server:** Serve static images from report dir
- Allow approve images from ui
- **server:** Save/load test report
- **server:** Use cluster fork instead preprocessors
- **server:** Offline mode mvp, copy static
- **server:** Add `ui` flag, wait workers ready event
- **server:** Allow to use custom reporter

### Changed

- Send on client flat tests structure
- Rename test results field
- Use Partial generic
- Simplify something

### Documentation

- Updare README.md

### Fixed

- Export types
- **runner:** Retries condition
- **client:** Handle start/stop messages
- **worker:** Clean images, strong regexp for grep
- **utils:** Change test scope path. Move browser to the last
- **worker:** Increase mocha timeout
- **TestRestultView:** Improve images output
- **TestRestultView:** Always open last image
- **server:** Served static path

### Miscellaneous

- Move react-ui to devDeps
- Update TODO.md
- Update TODO.md and npmignore

### Build

- Fix babel-preset-env options
- Prepare for publish

[unreleased]: https://github.com/wKich/creevey/compare/v0.8.0-beta.0...HEAD
[0.8.0-beta.0]: https://github.com/wKich/creevey/compare/v0.7.39...v0.8.0-beta.0
[0.7.39]: https://github.com/wKich/creevey/compare/v0.7.38...v0.7.39
[0.7.38]: https://github.com/wKich/creevey/compare/v0.7.37...v0.7.38
[0.7.37]: https://github.com/wKich/creevey/compare/v0.7.36...v0.7.37
[0.7.36]: https://github.com/wKich/creevey/compare/v0.7.35...v0.7.36
[0.7.35]: https://github.com/wKich/creevey/compare/v0.7.34...v0.7.35
[0.7.34]: https://github.com/wKich/creevey/compare/v0.7.33...v0.7.34
[0.7.33]: https://github.com/wKich/creevey/compare/v0.7.32...v0.7.33
[0.7.32]: https://github.com/wKich/creevey/compare/v0.7.31...v0.7.32
[0.7.31]: https://github.com/wKich/creevey/compare/v0.7.30...v0.7.31
[0.7.30]: https://github.com/wKich/creevey/compare/v0.7.29...v0.7.30
[0.7.29]: https://github.com/wKich/creevey/compare/v0.7.28...v0.7.29
[0.7.28]: https://github.com/wKich/creevey/compare/v0.7.27...v0.7.28
[0.7.27]: https://github.com/wKich/creevey/compare/v0.7.26...v0.7.27
[0.7.26]: https://github.com/wKich/creevey/compare/v0.7.25...v0.7.26
[0.7.25]: https://github.com/wKich/creevey/compare/v0.7.24...v0.7.25
[0.7.24]: https://github.com/wKich/creevey/compare/v0.7.23...v0.7.24
[0.7.23]: https://github.com/wKich/creevey/compare/v0.7.22...v0.7.23
[0.7.22]: https://github.com/wKich/creevey/compare/v0.7.21...v0.7.22
[0.7.21]: https://github.com/wKich/creevey/compare/v0.7.20...v0.7.21
[0.7.20]: https://github.com/wKich/creevey/compare/v0.7.19...v0.7.20
[0.7.19]: https://github.com/wKich/creevey/compare/v0.7.18...v0.7.19
[0.7.18]: https://github.com/wKich/creevey/compare/v0.7.17...v0.7.18
[0.7.17]: https://github.com/wKich/creevey/compare/v0.7.16...v0.7.17
[0.7.16]: https://github.com/wKich/creevey/compare/v0.7.15...v0.7.16
[0.7.15]: https://github.com/wKich/creevey/compare/v0.7.14...v0.7.15
[0.7.14]: https://github.com/wKich/creevey/compare/v0.7.13...v0.7.14
[0.7.13]: https://github.com/wKich/creevey/compare/v0.7.12...v0.7.13
[0.7.12]: https://github.com/wKich/creevey/compare/v0.7.11...v0.7.12
[0.7.11]: https://github.com/wKich/creevey/compare/v0.7.10...v0.7.11
[0.7.10]: https://github.com/wKich/creevey/compare/v0.7.9...v0.7.10
[0.7.9]: https://github.com/wKich/creevey/compare/v0.7.8...v0.7.9
[0.7.8]: https://github.com/wKich/creevey/compare/v0.7.7...v0.7.8
[0.7.7]: https://github.com/wKich/creevey/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/wKich/creevey/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/wKich/creevey/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/wKich/creevey/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/wKich/creevey/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/wKich/creevey/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/wKich/creevey/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/wKich/creevey/compare/v0.7.0-beta.21...v0.7.0
[0.7.0-beta.21]: https://github.com/wKich/creevey/compare/v0.7.0-beta.20...v0.7.0-beta.21
[0.7.0-beta.20]: https://github.com/wKich/creevey/compare/v0.7.0-beta.19...v0.7.0-beta.20
[0.7.0-beta.19]: https://github.com/wKich/creevey/compare/v0.7.0-beta.18...v0.7.0-beta.19
[0.7.0-beta.18]: https://github.com/wKich/creevey/compare/v0.7.0-beta.17...v0.7.0-beta.18
[0.7.0-beta.17]: https://github.com/wKich/creevey/compare/v0.7.0-beta.16...v0.7.0-beta.17
[0.7.0-beta.16]: https://github.com/wKich/creevey/compare/v0.7.0-beta.15...v0.7.0-beta.16
[0.7.0-beta.15]: https://github.com/wKich/creevey/compare/v0.7.0-beta.14...v0.7.0-beta.15
[0.7.0-beta.14]: https://github.com/wKich/creevey/compare/v0.7.0-beta.13...v0.7.0-beta.14
[0.7.0-beta.13]: https://github.com/wKich/creevey/compare/v0.7.0-beta.12...v0.7.0-beta.13
[0.7.0-beta.12]: https://github.com/wKich/creevey/compare/v0.7.0-beta.11...v0.7.0-beta.12
[0.7.0-beta.11]: https://github.com/wKich/creevey/compare/v0.7.0-beta.10...v0.7.0-beta.11
[0.7.0-beta.10]: https://github.com/wKich/creevey/compare/v0.7.0-beta.9...v0.7.0-beta.10
[0.7.0-beta.9]: https://github.com/wKich/creevey/compare/v0.7.0-beta.8...v0.7.0-beta.9
[0.7.0-beta.8]: https://github.com/wKich/creevey/compare/v0.7.0-beta.7...v0.7.0-beta.8
[0.7.0-beta.7]: https://github.com/wKich/creevey/compare/v0.7.0-beta.6...v0.7.0-beta.7
[0.7.0-beta.6]: https://github.com/wKich/creevey/compare/v0.7.0-beta.5...v0.7.0-beta.6
[0.7.0-beta.5]: https://github.com/wKich/creevey/compare/v0.7.0-beta.4...v0.7.0-beta.5
[0.7.0-beta.4]: https://github.com/wKich/creevey/compare/v0.7.0-beta.3...v0.7.0-beta.4
[0.7.0-beta.3]: https://github.com/wKich/creevey/compare/v0.7.0-beta.2...v0.7.0-beta.3
[0.7.0-beta.2]: https://github.com/wKich/creevey/compare/v0.7.0-beta.1...v0.7.0-beta.2
[0.7.0-beta.1]: https://github.com/wKich/creevey/compare/v0.7.0-beta.0...v0.7.0-beta.1
[0.7.0-beta.0]: https://github.com/wKich/creevey/compare/v0.6.4...v0.7.0-beta.0
[0.6.4]: https://github.com/wKich/creevey/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/wKich/creevey/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/wKich/creevey/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/wKich/creevey/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/wKich/creevey/compare/v0.6.0-beta.8...v0.6.0
[0.6.0-beta.8]: https://github.com/wKich/creevey/compare/v0.6.0-beta.7...v0.6.0-beta.8
[0.6.0-beta.7]: https://github.com/wKich/creevey/compare/v0.6.0-beta.6...v0.6.0-beta.7
[0.6.0-beta.6]: https://github.com/wKich/creevey/compare/v0.6.0-beta.5...v0.6.0-beta.6
[0.6.0-beta.5]: https://github.com/wKich/creevey/compare/v0.6.0-beta.4...v0.6.0-beta.5
[0.6.0-beta.4]: https://github.com/wKich/creevey/compare/v0.6.0-beta.3...v0.6.0-beta.4
[0.6.0-beta.3]: https://github.com/wKich/creevey/compare/v0.6.0-beta.2...v0.6.0-beta.3
[0.6.0-beta.2]: https://github.com/wKich/creevey/compare/v0.6.0-beta.1...v0.6.0-beta.2
[0.6.0-beta.1]: https://github.com/wKich/creevey/compare/v0.6.0-beta.0...v0.6.0-beta.1
[0.6.0-beta.0]: https://github.com/wKich/creevey/compare/v0.5.6...v0.6.0-beta.0
[0.5.6]: https://github.com/wKich/creevey/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/wKich/creevey/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/wKich/creevey/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/wKich/creevey/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/wKich/creevey/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/wKich/creevey/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/wKich/creevey/compare/v0.4.11...v0.5.0
[0.4.11]: https://github.com/wKich/creevey/compare/v0.4.10...v0.4.11
[0.4.10]: https://github.com/wKich/creevey/compare/v0.4.9...v0.4.10
[0.4.9]: https://github.com/wKich/creevey/compare/v0.4.8...v0.4.9
[0.4.8]: https://github.com/wKich/creevey/compare/v0.4.7...v0.4.8
[0.4.7]: https://github.com/wKich/creevey/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/wKich/creevey/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/wKich/creevey/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/wKich/creevey/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/wKich/creevey/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/wKich/creevey/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/wKich/creevey/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/wKich/creevey/compare/v0.3.8...v0.4.0
[0.3.8]: https://github.com/wKich/creevey/compare/v0.3.7...v0.3.8
[0.3.7]: https://github.com/wKich/creevey/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/wKich/creevey/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/wKich/creevey/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/wKich/creevey/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/wKich/creevey/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/wKich/creevey/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/wKich/creevey/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/wKich/creevey/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/wKich/creevey/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/wKich/creevey/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/wKich/creevey/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/wKich/creevey/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/wKich/creevey/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/wKich/creevey/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/wKich/creevey/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/wKich/creevey/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/wKich/creevey/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/wKich/creevey/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/wKich/creevey/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/wKich/creevey/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/wKich/creevey/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/wKich/creevey/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/wKich/creevey/compare/v0.0.30...v0.1.0
[0.0.30]: https://github.com/wKich/creevey/compare/v0.0.29...v0.0.30
[0.0.29]: https://github.com/wKich/creevey/compare/v0.0.28...v0.0.29
[0.0.28]: https://github.com/wKich/creevey/compare/v0.0.27...v0.0.28
[0.0.27]: https://github.com/wKich/creevey/compare/v0.0.26...v0.0.27
[0.0.26]: https://github.com/wKich/creevey/compare/v0.0.25...v0.0.26
[0.0.25]: https://github.com/wKich/creevey/compare/v0.0.24...v0.0.25
[0.0.24]: https://github.com/wKich/creevey/compare/v0.0.23...v0.0.24
[0.0.23]: https://github.com/wKich/creevey/compare/v0.0.22...v0.0.23
[0.0.22]: https://github.com/wKich/creevey/compare/v0.0.21...v0.0.22
[0.0.21]: https://github.com/wKich/creevey/compare/v0.0.20...v0.0.21
[0.0.20]: https://github.com/wKich/creevey/compare/v0.0.19...v0.0.20
[0.0.19]: https://github.com/wKich/creevey/compare/v0.0.18...v0.0.19
[0.0.18]: https://github.com/wKich/creevey/compare/v0.0.17...v0.0.18
[0.0.17]: https://github.com/wKich/creevey/compare/v0.0.16...v0.0.17
[0.0.16]: https://github.com/wKich/creevey/compare/v0.0.15...v0.0.16
[0.0.15]: https://github.com/wKich/creevey/compare/v0.0.14...v0.0.15
[0.0.14]: https://github.com/wKich/creevey/compare/v0.0.13...v0.0.14
[0.0.13]: https://github.com/wKich/creevey/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/wKich/creevey/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/wKich/creevey/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/wKich/creevey/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/wKich/creevey/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/wKich/creevey/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/wKich/creevey/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/wKich/creevey/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/wKich/creevey/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/wKich/creevey/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/wKich/creevey/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/wKich/creevey/compare/v0.0.1...v0.0.2
