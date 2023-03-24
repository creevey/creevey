# [0.9.0-beta.3](https://github.com/wKich/creevey/compare/v0.8.0...v0.9.0-beta.3) (2023-03-24)

### Features

- hybrid stories provider ([89d9c73](https://github.com/wKich/creevey/commit/89d9c7357369dffb320ea06fe158b4113f57034c))

# [0.8.0](https://github.com/wKich/creevey/compare/v0.8.0-beta.1...v0.8.0) (2023-03-07)

### Bug Fixes

- drop support of SkipOption on root skip level ([31be1bf](https://github.com/wKich/creevey/commit/31be1bf4d67f464ea6790e6e218ca75674366711))

# [0.8.0-beta.1](https://github.com/wKich/creevey/compare/v0.8.0-beta.0...v0.8.0-beta.1) (2023-01-18)

### Bug Fixes

- **addon:** restore IE11 support ([94f452f](https://github.com/wKich/creevey/commit/94f452fff4225e974c9efdff21f982d5155de4f8))
- allow setting timeouts via capabilities ([72de9e5](https://github.com/wKich/creevey/commit/72de9e50b818587309f665c782637ae43c3e4864))
- infinite UI loading ([4f7b47d](https://github.com/wKich/creevey/commit/4f7b47db3ff1274217b044ce608e34d22148fe32))
- **addon:** restore and move ie11 support to separate addon ([3ba2cc7](https://github.com/wKich/creevey/commit/3ba2cc7fde281037406f1705c0abc616c576e641))
- browser-node regexp parameters transfering ([737670e](https://github.com/wKich/creevey/commit/737670e18aa5d0ce416fe12b765406116b453e31))
- correct call of the test fn ([98c03ad](https://github.com/wKich/creevey/commit/98c03ad1700486bfd75170f4517970717250f6d8))
- handle null from selectStory ([1895602](https://github.com/wKich/creevey/commit/1895602143b3236ab195e11fcfa162df2a01af03))
- ie11 support ([523e35b](https://github.com/wKich/creevey/commit/523e35b6950d978ca3aaa77dd4f072a835053687))
- move addon to the separate entry point ([f3fc59f](https://github.com/wKich/creevey/commit/f3fc59f980a56f87f882507c3a0367ed6a356d33))
- prevent importing browser-specific code to node ([37706ef](https://github.com/wKich/creevey/commit/37706efbb49dd5bd1d6ec06821fac52480a0e132))
- **selenium-webdriver:** bump [@types](https://github.com/types) package version ([ca4b369](https://github.com/wKich/creevey/commit/ca4b369046e2c56e0548f5cbb6f98c17b0125228))

### Features

- 🎸 add support `play()` story method ([318ac62](https://github.com/wKich/creevey/commit/318ac628cb14fb0de7a89c088ae241df520df1e7))
- drop support for storybook < 6.4 ([fb8c0f5](https://github.com/wKich/creevey/commit/fb8c0f5158ab7c0495949eaa61ba52049c3d66cf))

# [0.8.0-beta.0](https://github.com/wKich/creevey/compare/v0.7.39...v0.8.0-beta.0) (2022-03-17)

### Bug Fixes

- 🐛 revert cross-env scripts, as they not work in unix ([92b04a5](https://github.com/wKich/creevey/commit/92b04a5bed56191b7ee6bd169f5327e30a1c2232))

### Features

- 🎸 change format for `skip` parameter ([f244b7c](https://github.com/wKich/creevey/commit/f244b7cd344b276762408a1df841e5afc3853fad))
- 🎸 Improve skip options ([2fcc624](https://github.com/wKich/creevey/commit/2fcc624a9b2ab1dcdce3927779c8f58bb0a0d02c))
- new creevey params: "global" and "kind" ([7d7c885](https://github.com/wKich/creevey/commit/7d7c88521a28c91586bfdd663500bea576845292))
- support storybook 6.4 ([74010e5](https://github.com/wKich/creevey/commit/74010e53d93ff1815427cd7ee818481ce6e21288))

## [0.7.39](https://github.com/wKich/creevey/compare/v0.7.38...v0.7.39) (2021-11-04)

### Features

- 🎸 add ability to update story arguments from test cases ([18d8ecb](https://github.com/wKich/creevey/commit/18d8ecb909097b585282a04bfb0b0c721ad45e22))

## [0.7.38](https://github.com/wKich/creevey/compare/v0.7.37...v0.7.38) (2021-09-28)

### Features

- 🎸 add storiesProvider config option ([7cf7454](https://github.com/wKich/creevey/commit/7cf74542d527bcfd5b41b17026464a4f9298e1f5))

## [0.7.37](https://github.com/wKich/creevey/compare/v0.7.36...v0.7.37) (2021-08-27)

### Bug Fixes

- 🐛 save report data after each tests run ([86c6c2e](https://github.com/wKich/creevey/commit/86c6c2ee1261bdc38fc3b7c6ebb1753348339a0a))
- 🐛 selenium url path to '/' for webkit browsers ([748d896](https://github.com/wKich/creevey/commit/748d8968c645ee684cec5dcd899d2de749d5e2c6)), closes [#176](https://github.com/wKich/creevey/issues/176)

### Features

- 🎸 failFast doesn't disable maxRetries option ([c81c637](https://github.com/wKich/creevey/commit/c81c63784aecea890596647225ce8278d7383df5)), closes [#175](https://github.com/wKich/creevey/issues/175)
- 🎸 improve delay option to allow specify browsers ([4bec3b5](https://github.com/wKich/creevey/commit/4bec3b5a4ddca2e2610db4ecf79f0e859202da65)), closes [#174](https://github.com/wKich/creevey/issues/174)

## [0.7.36](https://github.com/wKich/creevey/compare/v0.7.35...v0.7.36) (2021-07-30)

### Bug Fixes

- 🐛 report test as a failed for teamcity reporter ([0e58915](https://github.com/wKich/creevey/commit/0e58915b6d14441e14851c7c3bc888fe0759ddce))

## [0.7.35](https://github.com/wKich/creevey/compare/v0.7.34...v0.7.35) (2021-07-28)

### Bug Fixes

- 🐛 update didn't use report data to approve failed tests ([107d0fa](https://github.com/wKich/creevey/commit/107d0faf4c717bbb7a547422e9baf7105389d0bd))

### Features

- 🎸 add `dockerImagePlatform` config option ([f52de6c](https://github.com/wKich/creevey/commit/f52de6c31ab41012ce127702d0967c8f40fb7c20))

## [0.7.34](https://github.com/wKich/creevey/compare/v0.7.33...v0.7.34) (2021-07-12)

### Features

- 🎸 add `failFat` parameter to the config ([c4fe538](https://github.com/wKich/creevey/commit/c4fe538569311cc7ca3c0c9e8e93916cf4a3cb8b))

## [0.7.33](https://github.com/wKich/creevey/compare/v0.7.32...v0.7.33) (2021-07-12)

### Bug Fixes

- 🐛 improve `waitForStorybook` wait for `setStories` event ([8431918](https://github.com/wKich/creevey/commit/8431918656378b6760a60da8570fb18952de210c))
- 🐛 make creevey work with vite ([0d576c6](https://github.com/wKich/creevey/commit/0d576c6e2660fd4f29ba4efd440d4af9ee590ac2))
- 🐛 some issues for storybook 5.3 and create-react-preset ([c1e20b3](https://github.com/wKich/creevey/commit/c1e20b31234875d3ef961ce3804e3384d858f94d))

### Features

- 🎸 add `failFast` CLI option. Terminates on first fail ([0023bbb](https://github.com/wKich/creevey/commit/0023bbb022e71b7b3cb60fd7cea9bdb89a7e87bc))

## [0.7.32](https://github.com/wKich/creevey/compare/v0.7.31...v0.7.32) (2021-07-07)

### Features

- 🎸 add webdriver debug logging ([6124a43](https://github.com/wKich/creevey/commit/6124a43b79d2761c3f04f6f3f118599ecb517c27))
- 🎸 run extract stories.json on storybook-build ([803a1d1](https://github.com/wKich/creevey/commit/803a1d1b9b774121e1a611dfbbe1a3ad041339af))

## [0.7.31](https://github.com/wKich/creevey/compare/v0.7.30...v0.7.31) (2021-06-26)

### Bug Fixes

- 🐛 ignore docsOnly stories for now ([2fda22b](https://github.com/wKich/creevey/commit/2fda22b333929306c2ad31243f1a0fd1900bbd7f))
- 🐛 improve listen story render error with `waitForReady` ([dda7948](https://github.com/wKich/creevey/commit/dda7948c3496a7ef7a8e9fc4ce50d774b470bd94))
- 🐛 improve update to approve only failed images ([f0e5719](https://github.com/wKich/creevey/commit/f0e5719f1b8d1b0fb105bacb5619cd903eadced6))
- 🐛 resolve storybook preview config after babel/register ([cb3f46c](https://github.com/wKich/creevey/commit/cb3f46c0502264cdd5aefc2dc397da1892938eb5))
- 🐛 resolving storybook modules for version less than 6.2 ([bd84c5f](https://github.com/wKich/creevey/commit/bd84c5f87a3c271665c3fd283ae09cabc2851120))

### Features

- 🎸 add `until` selenium helpers to test context ([4f29eca](https://github.com/wKich/creevey/commit/4f29eca9e829c68d765da88fbb3ab327278fefe3))

## [0.7.30](https://github.com/wKich/creevey/compare/v0.7.29...v0.7.30) (2021-06-10)

### Bug Fixes

- 🐛 import the same webpack as used for storybook manager ([ae3c6b7](https://github.com/wKich/creevey/commit/ae3c6b712a8e41a7d3f4396b269d471c578d9408))
- 🐛 resolving storybook modules ([d30274d](https://github.com/wKich/creevey/commit/d30274d3dc12e77cea21ea170a9e03fc35892671))
- package.json & yarn.lock to reduce vulnerabilities ([b1f8697](https://github.com/wKich/creevey/commit/b1f869758bb6b41165748de15f897a4bee22545b))

## [0.7.29](https://github.com/wKich/creevey/compare/v0.7.28...v0.7.29) (2021-05-30)

### Bug Fixes

- 🐛 allow pass boolean value to skip parameter ([9e36eec](https://github.com/wKich/creevey/commit/9e36eecce9d7df352ced159c1ec5b0de86fa7257)), closes [#147](https://github.com/wKich/creevey/issues/147)

### Features

- 🎸 improve `update` command allow to pass match pattern ([4cf79f4](https://github.com/wKich/creevey/commit/4cf79f4d7693686be86c4bec5ae7e5736f900615))

## [0.7.28](https://github.com/wKich/creevey/compare/v0.7.27...v0.7.28) (2021-05-20)

### Bug Fixes

- 🐛 creevey loader transforms csf funcs with props ([11bbc96](https://github.com/wKich/creevey/commit/11bbc96133edbce3c578a240a0a69c45d2b7a508))
- 🐛 csf template.bind extract correctly ([ba27817](https://github.com/wKich/creevey/commit/ba27817e9fd91a0515edb3896414c7ac04bfa65d))
- 🐛 improve babel-plugin to handle storiesOf in loops ([ec6ad03](https://github.com/wKich/creevey/commit/ec6ad03a796c6d25647f30aff75c41c1ec630704))
- 🐛 improve process exiting with hooks, add ie11 tests ([effa16f](https://github.com/wKich/creevey/commit/effa16f434ac82bbc740be4f2b4ecc67557cba7b))
- 🐛 remove some non-story and custom expressions ([9fd55dc](https://github.com/wKich/creevey/commit/9fd55dcee25c7cd5ca965629861bd324bdc95612))
- 🐛 types after update to Storybook 6.2 ([dcf433e](https://github.com/wKich/creevey/commit/dcf433e52ca9a4e595968365061f73708fcc9ab4))

### Features

- 🎸 improve extract stories by using only babel ([6e43452](https://github.com/wKich/creevey/commit/6e43452e8607ce62f8e73387245557812e051160))
- 🎸 support for extract cjs and object.assign ([1978669](https://github.com/wKich/creevey/commit/1978669c1fcf9f5a9866d9399793d7388bab1680))

## [0.7.27](https://github.com/wKich/creevey/compare/v0.7.26...v0.7.27) (2021-03-31)

### Bug Fixes

- 🐛 capturing screenshots in ie11 ([2e47b2f](https://github.com/wKich/creevey/commit/2e47b2fe77a5af88673c369f297b5a373d3a2eba))
- 🐛 compose browsers with external grid and builtin selenoid ([c429bec](https://github.com/wKich/creevey/commit/c429becc3827764c8349ed428bae5a7f4288bd5a))

## [0.7.26](https://github.com/wKich/creevey/compare/v0.7.25...v0.7.26) (2021-03-28)

### Bug Fixes

- 🐛 don't show run button in a report ([958c8ad](https://github.com/wKich/creevey/commit/958c8ad742121dd57adb841939fb5f27134132c5))

### Features

- 🎸 add `--extract` as faster alternative to `sb extract` ([5f5de2d](https://github.com/wKich/creevey/commit/5f5de2d44ba49c0f9868cb843a522745308fa055))
- 🎸 add `waitForReady` story parameter ([8517883](https://github.com/wKich/creevey/commit/8517883019dc371141a0b7308b37bde8b17577b6))
- 🎸 allow define custom selenoid images and skip pull step ([e508eec](https://github.com/wKich/creevey/commit/e508eec9918cb63194a74c2ebd44aa1f62c9930d))

## [0.7.25](https://github.com/wKich/creevey/compare/v0.7.24...v0.7.25) (2021-03-18)

### Bug Fixes

- 🐛 exclude all addons from nodejs storybook bundle ([1194400](https://github.com/wKich/creevey/commit/1194400d441fe22a0b60718c67e083c76bf7e2c2))
- 🐛 hover shouldn't override focus styles ([6762af9](https://github.com/wKich/creevey/commit/6762af942600dbb9f5d100539dcbe1fdee016a4c))
- 🐛 test status icons align ([c3e5c7e](https://github.com/wKich/creevey/commit/c3e5c7ea14eb46e218a0d1dcbcec9374989b364d))

### Features

- 🎸 add sidebar keyboard handlers ([bf160b6](https://github.com/wKich/creevey/commit/bf160b61ecdd49417135f0b7b9c316efddb6e898))
- 🎸 add support storybook 6.2 ([e4cc662](https://github.com/wKich/creevey/commit/e4cc66245b0f2aea8cfba0e849f1e9e4f80d1442))
- 🎸 support capture mdx stories ([6fc9185](https://github.com/wKich/creevey/commit/6fc918505718393ccbc424a794159eecf66a456d))

## [0.7.24](https://github.com/wKich/creevey/compare/v0.7.23...v0.7.24) (2021-03-10)

### Bug Fixes

- 🐛 some security issues ([d3eed3c](https://github.com/wKich/creevey/commit/d3eed3c8970f097309e9ec2e3926a2e6a881fd9c))
- 🐛 websocket invalid frame error ([aafda92](https://github.com/wKich/creevey/commit/aafda92ff3d45cf20005872ea344831b53c2f5af))
- upgrade tslib from 2.0.3 to 2.1.0 ([f047cae](https://github.com/wKich/creevey/commit/f047cae1c0a6b072b30b91be9f7bceef1a776917))
- upgrade zone.js from 0.11.3 to 0.11.4 ([f1a911a](https://github.com/wKich/creevey/commit/f1a911a070658f8b2488f1d596a53e3cd2d3e001))

### Features

- 🎸 new panels in addon ([02232eb](https://github.com/wKich/creevey/commit/02232ebbeb3fe0eb0878743ccc9ad1a83277de64))
- allow to ignore elements in screenshot ([19a38e0](https://github.com/wKich/creevey/commit/19a38e0379ad0b1cbbe6254f197888d2ebfb1a22))

## [0.7.23](https://github.com/wKich/creevey/compare/v0.7.22...v0.7.23) (2021-01-25)

### Bug Fixes

- 🐛 use shelljs to run selenoid binary ([3306071](https://github.com/wKich/creevey/commit/3306071d2840b6f8fde442880457085f6992915a))

## [0.7.22](https://github.com/wKich/creevey/compare/v0.7.21...v0.7.22) (2021-01-25)

### Bug Fixes

- run standalone browsers and selenoid ([ba85fdc](https://github.com/wKich/creevey/commit/ba85fdcd7f5e2ad0e6139cb3fe84e969dacb2b4c))
- selenium url path for standalone run ([da45662](https://github.com/wKich/creevey/commit/da45662aff604bacb02bd949ece5e406888cbd4d))

## [0.7.21](https://github.com/wKich/creevey/compare/v0.7.20...v0.7.21) (2021-01-22)

### Bug Fixes

- 🐛 create protocol relative image url ([5c574dc](https://github.com/wKich/creevey/commit/5c574dc3025eacf1c9d4402880a9893193c0180f))
- 🐛 encode only path tokens for url ([28751c9](https://github.com/wKich/creevey/commit/28751c968cb4a3a8afcb606096a0a0bc2fc3bccf))
- 🐛 get image url with empty port number ([43a8226](https://github.com/wKich/creevey/commit/43a822653001ecbb31534c40f688814e14bb52db))
- 🐛 make report from static files works from creevey repo ([4b49df7](https://github.com/wKich/creevey/commit/4b49df72f21cee725848187c267f6b87b9e988e3))
- 🐛 protocol relative resolving ([fc2559e](https://github.com/wKich/creevey/commit/fc2559e60091ef96af48fbbac92e7f06b7f57dbc))
- 🐛 store stats.json into report dir ([9b0586d](https://github.com/wKich/creevey/commit/9b0586db49681b654045ad54dece4c195e490605))

### Features

- 🎸 improve creevey-loader, cut-off side-effects ([a302708](https://github.com/wKich/creevey/commit/a30270808275fa5dbe83ddb33d0e5490995e9b37))
- 🎸 save webpack stats.json on debug ([248e271](https://github.com/wKich/creevey/commit/248e2713bc97a601877eaa20f3c6e16ecc1e2aa5))

## [0.7.20](https://github.com/wKich/creevey/compare/v0.7.19...v0.7.20) (2021-01-15)

### Bug Fixes

- 🐛 apply iframe after custom resolver ([e77bf33](https://github.com/wKich/creevey/commit/e77bf33048673e733ad2acd4799277b336e27fe5))

## [0.7.19](https://github.com/wKich/creevey/compare/v0.7.18...v0.7.19) (2021-01-14)

### Bug Fixes

- 🐛 document unloaded error, again ([171b8bb](https://github.com/wKich/creevey/commit/171b8bb633f55616d58bc46655981e986cf9db95))
- 🐛 document unloaded while waiting for result ([dd31445](https://github.com/wKich/creevey/commit/dd3144558de74349f41108e29aed97814a48eeb7))
- 🐛 properly output unnecessary images ([40e791e](https://github.com/wKich/creevey/commit/40e791edd5eddce838ccc62902430ca00422bb8b))

### Features

- allow to set storybook's globals ([7500245](https://github.com/wKich/creevey/commit/75002458b38d5f7ac3d47cc32516ec9b55091db2))

## [0.7.18](https://github.com/wKich/creevey/compare/v0.7.17...v0.7.18) (2021-01-08)

### Bug Fixes

- 🐛 copy-paste missing function from storybook ([29144a4](https://github.com/wKich/creevey/commit/29144a41afe013874b082ca29eecc74b5b56a017))

## [0.7.17](https://github.com/wKich/creevey/compare/v0.7.16...v0.7.17) (2021-01-07)

### Bug Fixes

- 🐛 addon erases global parameters in storybook ([2ed4700](https://github.com/wKich/creevey/commit/2ed47000f00e30890656872d1daae420e47db2d9))

## [0.7.16](https://github.com/wKich/creevey/compare/v0.7.15...v0.7.16) (2021-01-06)

### Bug Fixes

- 🐛 resolve url for ie11 ([562a982](https://github.com/wKich/creevey/commit/562a9821135f42e428da7f64fe29f2473565eb6d))
- 🐛 spinner position in sidebar ([5d2d34a](https://github.com/wKich/creevey/commit/5d2d34a7229d7fef8fd4f6731df6b807dce00d7f))

## [0.7.15](https://github.com/wKich/creevey/compare/v0.7.14...v0.7.15) (2021-01-06)

### Bug Fixes

- 🐛 addon show test name in tabs panel ([3393474](https://github.com/wKich/creevey/commit/339347498e87d5e43d1a5e89b611aeaf896e81f3))
- 🐛 trim story kinds ([6ff25b0](https://github.com/wKich/creevey/commit/6ff25b0b87558d2ce0c11ecd5130480003f41988))

### Features

- 🎸 add run all buttons in addon ([94ac2d3](https://github.com/wKich/creevey/commit/94ac2d3c6c72ec9a537b974294235f4bfdbf5a69))

## [0.7.14](https://github.com/wKich/creevey/compare/v0.7.13...v0.7.14) (2021-01-01)

### Bug Fixes

- 🐛 disable debug logger for storybook 5.x ([a758bab](https://github.com/wKich/creevey/commit/a758bab23ebff4d357f46087ad21a9a8005dd130))
- 🐛 resolve storybook properly and wait for page load ([6888178](https://github.com/wKich/creevey/commit/6888178a3ca2ee2c22ef69fc633564154a256e55))

### Performance Improvements

- ⚡️ exclude fork ts checker plugin for webpack ([cebc0be](https://github.com/wKich/creevey/commit/cebc0be6d42148fe9be859ef49364f0abe8f883f))

## [0.7.13](https://github.com/wKich/creevey/compare/v0.7.12...v0.7.13) (2020-12-30)

### Bug Fixes

- 🐛 images preview urls ([d2a7853](https://github.com/wKich/creevey/commit/d2a7853b2761a3c52a05aee2401b0f54b0e97832))

### Features

- 🎸 start creevey server early and wait for build ([e325d59](https://github.com/wKich/creevey/commit/e325d59b651ef3a52a2284aeb6b9de4eca4a3366))

### Performance Improvements

- ⚡️ speedup resolving storybook url ([4c24c88](https://github.com/wKich/creevey/commit/4c24c88646d1f4711fe24e9e8445ead06238756f))

## [0.7.12](https://github.com/wKich/creevey/compare/v0.7.11...v0.7.12) (2020-12-24)

### Bug Fixes

- 🐛 set timeout after open for ie11 ([6fda74d](https://github.com/wKich/creevey/commit/6fda74d9fcf7cc1e6f27f0d5814798bef7f5503d))

## [0.7.11](https://github.com/wKich/creevey/compare/v0.7.10...v0.7.11) (2020-12-21)

### Bug Fixes

- 🐛 addon result page scroll height ([cc12cd6](https://github.com/wKich/creevey/commit/cc12cd66c69b4571015ede6492cd4b5f978f9c34))
- 🐛 exclude docgen plugin for webpack bundle ([f11210a](https://github.com/wKich/creevey/commit/f11210aec9352c695eccc72202daff640a4617cb))
- 🐛 webpack mdx regexp, again ([0cadad1](https://github.com/wKich/creevey/commit/0cadad15f4217312fdb3db6a3bf7ee4f2cad5bed))
- 🐛 webpack mdx rule ([4e1b002](https://github.com/wKich/creevey/commit/4e1b002c378d5de7134e392495953c53537cfa5e))

### Features

- 🎸 store tests view in browser history ([868a6b0](https://github.com/wKich/creevey/commit/868a6b0e1fcd906e6441fe54d6ffeccf4ed75019))

## [0.7.10](https://github.com/wKich/creevey/compare/v0.7.9...v0.7.10) (2020-12-15)

### Bug Fixes

- 🐛 switch stories error ([c39ef7e](https://github.com/wKich/creevey/commit/c39ef7edf565f8c983641d89d30b5c552d0b08c7))

## [0.7.9](https://github.com/wKich/creevey/compare/v0.7.8...v0.7.9) (2020-12-14)

### Features

- 🎸 add support docker auth config for private registry ([e157c39](https://github.com/wKich/creevey/commit/e157c39de3f13ae4026a26579590ab181665fcb7))

## [0.7.8](https://github.com/wKich/creevey/compare/v0.7.7...v0.7.8) (2020-12-14)

### Bug Fixes

- 🐛 resolve url with docker ([ee5b2f7](https://github.com/wKich/creevey/commit/ee5b2f73c6c7bdbbad7574e927306b432295f241))

## [0.7.7](https://github.com/wKich/creevey/compare/v0.7.6...v0.7.7) (2020-12-14)

### Bug Fixes

- 🐛 handle getaddrinfo error ([b3567fe](https://github.com/wKich/creevey/commit/b3567fe71aca2b9342fe51561cdf60a2936bed0d))

## [0.7.6](https://github.com/wKich/creevey/compare/v0.7.5...v0.7.6) (2020-12-14)

### Bug Fixes

- 🐛 don't check `isInDocker` for docker internal host ([5a81138](https://github.com/wKich/creevey/commit/5a8113891940fb0b7d700e0aaa8ebdcca76d886c))

## [0.7.5](https://github.com/wKich/creevey/compare/v0.7.4...v0.7.5) (2020-12-14)

### Bug Fixes

- 🐛 creevey-loader support private class members ([223e3e3](https://github.com/wKich/creevey/commit/223e3e37d2aae7a96a28846abf840d5321b0f96d))
- 🐛 download selenoid binary ([5e72957](https://github.com/wKich/creevey/commit/5e729571391e7082a0a0fe02dcae6d12e41622f2))
- 🐛 webpack and update options ([712c911](https://github.com/wKich/creevey/commit/712c91184da6c82989d923b1d90e9d70b13d347c))

### Features

- 🎸 add mvp to allow run selenoid without docker ([c161e0a](https://github.com/wKich/creevey/commit/c161e0a807c26e7643bd7c4969bae8b954bcffd8))
- 🎸 link to current story ([8a3c043](https://github.com/wKich/creevey/commit/8a3c043be5f05e77044b1ff1ce5707c43fc43a36))

## [0.7.4](https://github.com/wKich/creevey/compare/v0.7.3...v0.7.4) (2020-12-11)

### Bug Fixes

- 🐛 change cache dir, some issues on windows ([c2e4f34](https://github.com/wKich/creevey/commit/c2e4f34e3ea70c85c60d1e37b20b6f6ff324dda7))
- 🐛 merge skip options properly ([24427af](https://github.com/wKich/creevey/commit/24427af40e812478b9832ae82d2dd64e3e146805))
- 🐛 resolve grid url without docker ([97e06fe](https://github.com/wKich/creevey/commit/97e06fe8c92496a99e659e8f221428bb4bb4062d))

## [0.7.3](https://github.com/wKich/creevey/compare/v0.7.2...v0.7.3) (2020-12-02)

### Features

- 🎸 apply disable animation styles in storybook decorator ([6dac967](https://github.com/wKich/creevey/commit/6dac96768f6b7953c56e22239a2adcf686f9aabb))
- 🎸 remove skbkontur ip address resolver ([91e17f4](https://github.com/wKich/creevey/commit/91e17f4f0e87b553bad367eda10ed30a1246be9e))

## [0.7.2](https://github.com/wKich/creevey/compare/v0.7.1...v0.7.2) (2020-11-28)

### Bug Fixes

- 🐛 invalid websocket frame ([6796625](https://github.com/wKich/creevey/commit/679662569e985b600eb4eb6779551a4bf929f54f))

### Features

- 🎸 improve scale handling for image views ([454ee85](https://github.com/wKich/creevey/commit/454ee85ad4b6a608bb999b815fb4192c2a661329))

## [0.7.1](https://github.com/wKich/creevey/compare/v0.7.0...v0.7.1) (2020-11-24)

### Bug Fixes

- 🐛 don't cutoff named exports ([cd09dd4](https://github.com/wKich/creevey/commit/cd09dd47070e4584429905f78baee82c65a82a47))

### Features

- 🎸 improve side-by-side view for wide images ([3d6a147](https://github.com/wKich/creevey/commit/3d6a1477804bb900d806cbac26d884d26bb28e55))
- 🎸 side-by-side view supports layout resizing ([123e7c7](https://github.com/wKich/creevey/commit/123e7c78708bf2e85b1649c85d2a264a9e4594d8))

# [0.7.0](https://github.com/wKich/creevey/compare/v0.7.0-beta.21...v0.7.0) (2020-11-09)

### Bug Fixes

- 🐛 get channel before it created ([b3e89ae](https://github.com/wKich/creevey/commit/b3e89aef18baca926d1684e6734265a03cbf00ab))
- 🐛 toggle theme sticky z-index ([dcdbb77](https://github.com/wKich/creevey/commit/dcdbb77e63b1f67025c897610c2df74b8d98abbd))

### Features

- 🎸 Dark theme in client ([c36aa4b](https://github.com/wKich/creevey/commit/c36aa4b59ce1661fa7cfbef72a7db1354e8ee0eb))

# [0.7.0-beta.21](https://github.com/wKich/creevey/compare/v0.7.0-beta.20...v0.7.0-beta.21) (2020-11-02)

### Bug Fixes

- 🐛 wait for fonts loaded ([78c2a74](https://github.com/wKich/creevey/commit/78c2a74782ac9bdb10d7c9c2039a332218a217cd))

# [0.7.0-beta.20](https://github.com/wKich/creevey/compare/v0.7.0-beta.19...v0.7.0-beta.20) (2020-10-30)

### Bug Fixes

- 🐛 don't cutoff `name` prop from stories params ([ca1a19f](https://github.com/wKich/creevey/commit/ca1a19f75f5a31974a7fb930d871c53ce0d77567))

# [0.7.0-beta.19](https://github.com/wKich/creevey/compare/v0.7.0-beta.18...v0.7.0-beta.19) (2020-10-30)

### Bug Fixes

- 🐛 macos docker netwrok internal host address ([90bf76d](https://github.com/wKich/creevey/commit/90bf76d8986d07626890e03b2097c0ef3ebd3f27))

# [0.7.0-beta.18](https://github.com/wKich/creevey/compare/v0.7.0-beta.17...v0.7.0-beta.18) (2020-10-29)

### Bug Fixes

- 🐛 cutoff parameters in new declarative preview config ([a86c51a](https://github.com/wKich/creevey/commit/a86c51ae80caa1f3e7534a044e1427dcb43e9792))
- 🐛 improve creevey loader cutoff stories meta data ([7b651d5](https://github.com/wKich/creevey/commit/7b651d5fe2945cffa10929ce038d01885c1db6ab))
- 🐛 reset body margin for client ui ([54fee7f](https://github.com/wKich/creevey/commit/54fee7f061a7b5eef7179faec09e79fd1652e305))
- 🐛 storybook framework detection ([25e1651](https://github.com/wKich/creevey/commit/25e1651608765698629e8f2ac1b9e43f98234288))

### Features

- 🎸 change default capture element to `#root` ([8d2c7b8](https://github.com/wKich/creevey/commit/8d2c7b8a5ddf9e3f64102c19aba1f1a7f933d8ad))

# [0.7.0-beta.17](https://github.com/wKich/creevey/compare/v0.7.0-beta.16...v0.7.0-beta.17) (2020-10-16)

### Bug Fixes

- 🐛 filter tests without statuses ([4c1d25d](https://github.com/wKich/creevey/commit/4c1d25de232816b4d99853fbaa2661a46996effc))

# [0.7.0-beta.16](https://github.com/wKich/creevey/compare/v0.7.0-beta.15...v0.7.0-beta.16) (2020-10-16)

### Bug Fixes

- 🐛 make sidebar a little narrower ([65c9bf7](https://github.com/wKich/creevey/commit/65c9bf7947cad71c07df5e7d5668a1b73ecfe395))
- 🐛 small ui issues in SideBar ([6df7a0a](https://github.com/wKich/creevey/commit/6df7a0a13dcea12614bc4fc4e34389c52f9b03a8))
- 🐛 watch stories in windows ([e8458dd](https://github.com/wKich/creevey/commit/e8458ddde503011aaa6a7479694edd2aa42b1941))

### Features

- 🎸 sideBar on storybook components ([2866c8e](https://github.com/wKich/creevey/commit/2866c8ebf7e57d460bf5254a93573c048351e1fe))

# [0.7.0-beta.15](https://github.com/wKich/creevey/compare/v0.7.0-beta.14...v0.7.0-beta.15) (2020-10-13)

### Bug Fixes

- 🐛 don't output message about unnecessary image ([83c1463](https://github.com/wKich/creevey/commit/83c14635e667d39181cbc1ddc494bac026641a2d))
- 🐛 improve `getImageUrl` for circle ci at least ([7537ce9](https://github.com/wKich/creevey/commit/7537ce9efa7a0ac3bcf2597a79126d8cd5312d59))

# [0.7.0-beta.14](https://github.com/wKich/creevey/compare/v0.7.0-beta.13...v0.7.0-beta.14) (2020-10-13)

### Bug Fixes

- 🐛 fallback report if api don't available ([618682f](https://github.com/wKich/creevey/commit/618682f289cb316dbd3b8b78d9d96ddd9e2c8681))

### Features

- 🎸 output unnecessary images on full run ([b6dbb02](https://github.com/wKich/creevey/commit/b6dbb02d5f6ef5766f1f11c0d50d7f5b4ad17b79))
- 🎸 remove `useDocker`. Creevey run docker by default ([ccbbb43](https://github.com/wKich/creevey/commit/ccbbb43f6fadd88bfcb21b266f08c45d39389c79))

# [0.7.0-beta.13](https://github.com/wKich/creevey/compare/v0.7.0-beta.12...v0.7.0-beta.13) (2020-10-09)

### Bug Fixes

- 🐛 add stories in addon ([50d7279](https://github.com/wKich/creevey/commit/50d7279f3daa706da204682edfa69e4bc5dad43b))
- 🐛 don't crash on storybook reload error ([b393926](https://github.com/wKich/creevey/commit/b393926eda582094973e18b037f95af4530f5b21))
- 🐛 don't fail on mdx stories, just ignore it for now ([527f962](https://github.com/wKich/creevey/commit/527f96222a73eac0711882b7541d5d318a9aa4fa))
- 🐛 re-disable animation ([ecbf380](https://github.com/wKich/creevey/commit/ecbf380316ce3479a70d7ce269a93088930a9880))

# [0.7.0-beta.12](https://github.com/wKich/creevey/compare/v0.7.0-beta.11...v0.7.0-beta.12) (2020-10-05)

### Bug Fixes

- 🐛 hmr tests on windows ([7496a72](https://github.com/wKich/creevey/commit/7496a7244648531c79dff5b9b54f01bb375607fe))
- 🐛 report static bundle, add polyfiils ([dfb5f51](https://github.com/wKich/creevey/commit/dfb5f515344ae9b91f5070f002a914cbed835fd6))

# [0.7.0-beta.11](https://github.com/wKich/creevey/compare/v0.7.0-beta.10...v0.7.0-beta.11) (2020-10-05)

### Bug Fixes

- 🐛 build addon to support ie11 ([4327d6d](https://github.com/wKich/creevey/commit/4327d6dfe9471adecaf6cba7ae6b36312d9fcf5e))
- 🐛 output readable error message on switch story ([aa369cb](https://github.com/wKich/creevey/commit/aa369cba3f6acb472d11f403f1081ea6c400f367))
- 🐛 run tests on circle ci ([a8afef5](https://github.com/wKich/creevey/commit/a8afef582235c37722a60f9596f0e1cbb61a1da0))

# [0.7.0-beta.10](https://github.com/wKich/creevey/compare/v0.7.0-beta.9...v0.7.0-beta.10) (2020-10-02)

### Bug Fixes

- 🐛 some generated modules are excluded as external ([9d8d04b](https://github.com/wKich/creevey/commit/9d8d04ba6b49a6fc216f661790931bb010284fef))

# [0.7.0-beta.9](https://github.com/wKich/creevey/compare/v0.7.0-beta.8...v0.7.0-beta.9) (2020-10-02)

### Bug Fixes

- 🐛 some ui markup, change placeholder message ([b3a6bd6](https://github.com/wKich/creevey/commit/b3a6bd61c1a1d1d52a92a3513545a00962aa0159))

# [0.7.0-beta.8](https://github.com/wKich/creevey/compare/v0.7.0-beta.7...v0.7.0-beta.8) (2020-10-02)

### Bug Fixes

- 🐛 storybook override creevey story parameters ([bd17edf](https://github.com/wKich/creevey/commit/bd17edfcbc5a7dc879c6bf08dca41fec4f207f15))

# [0.7.0-beta.7](https://github.com/wKich/creevey/compare/v0.7.0-beta.6...v0.7.0-beta.7) (2020-10-01)

### Features

- 🎸 support declarative decorators format ([3e22854](https://github.com/wKich/creevey/commit/3e22854e3bbefc2bef9c4f7fde270620e9919859))

# [0.7.0-beta.6](https://github.com/wKich/creevey/compare/v0.7.0-beta.5...v0.7.0-beta.6) (2020-09-29)

### Bug Fixes

- 🐛 loader handle `export default {} as Meta` ([2dcca94](https://github.com/wKich/creevey/commit/2dcca946d9f94f2e1158974c6e9a22028b49492c))

# [0.7.0-beta.5](https://github.com/wKich/creevey/compare/v0.7.0-beta.4...v0.7.0-beta.5) (2020-09-28)

### Bug Fixes

- 🐛 eslint errors ([ffdc73d](https://github.com/wKich/creevey/commit/ffdc73d90f29b8452e63f0817300de7e925d0785))
- 🐛 remove old selenoid container on start ([715f04a](https://github.com/wKich/creevey/commit/715f04a228198e5369653199f983c21eca88c194))
- 🐛 small addon ui issues ([f055c1c](https://github.com/wKich/creevey/commit/f055c1c16394250f4aaf6db56d444a1c218ab66b))
- 🐛 small layout fixes in addon ([0f29b12](https://github.com/wKich/creevey/commit/0f29b121bb09e9840d3251eb9fe6d25a986aa46d))

### Features

- 🎸 Add run button in addon ([8b3596c](https://github.com/wKich/creevey/commit/8b3596cc05ff8dcfa987f816db0b02d5097517f6))
- 🎸 show status in sidebar ([c28c2da](https://github.com/wKich/creevey/commit/c28c2daab6726735f05ab3d30d4c4662bfb8245f))
- 🎸 Storybook addon ([7c47c4b](https://github.com/wKich/creevey/commit/7c47c4bc4432ef55364824cee2c1b42430e02a33))

# [0.7.0-beta.4](https://github.com/wKich/creevey/compare/v0.7.0-beta.3...v0.7.0-beta.4) (2020-09-26)

### Bug Fixes

- 🐛 correctly load report from previous run ([e680e24](https://github.com/wKich/creevey/commit/e680e244728fa7347eac194c88145dec2d0b87a0))

# [0.7.0-beta.3](https://github.com/wKich/creevey/compare/v0.7.0-beta.2...v0.7.0-beta.3) (2020-09-25)

### Bug Fixes

- 🐛 resolve storybook url on windows with multiple networks ([eb1dcf3](https://github.com/wKich/creevey/commit/eb1dcf3df3ef1c084165ad51e41cade2190c3935))
- 🐛 use `find-dir-cache` to store cache in right place ([c10a951](https://github.com/wKich/creevey/commit/c10a951e6cb05c29222348922d3639de98c04544))
- 🐛 use selenoid instead of browser images ([b187e62](https://github.com/wKich/creevey/commit/b187e62cb3ef3fe8d4e0128f293ebf693054c5d3))
- docker network for windows/wsl ([da8b491](https://github.com/wKich/creevey/commit/da8b49172f01a6131bea505021c6ea6ff2e77561))

### Features

- 🎸 add support docker ([c5f7976](https://github.com/wKich/creevey/commit/c5f7976f741e3a7cf1d06615c8013475e4677809))

# [0.7.0-beta.2](https://github.com/wKich/creevey/compare/v0.7.0-beta.1...v0.7.0-beta.2) (2020-09-10)

### Bug Fixes

- 🐛 exit master process with after hook ([e90adfb](https://github.com/wKich/creevey/commit/e90adfb603a5b48a0e085843df03b074923201d5))

# [0.7.0-beta.1](https://github.com/wKich/creevey/compare/v0.7.0-beta.0...v0.7.0-beta.1) (2020-09-08)

### Bug Fixes

- 🐛 collect all errors ([66146d7](https://github.com/wKich/creevey/commit/66146d7372f46b71055ad7e64f945463b1a21184))
- 🐛 don't show error if image has been approved ([6b74e1d](https://github.com/wKich/creevey/commit/6b74e1d42d8d2297e5187670f9e05be337e20348))
- 🐛 image preview height ([afe125d](https://github.com/wKich/creevey/commit/afe125d535be85bc899eaa03683924c3c0c5a856))

### Features

- 🎸 add before/after hooks ([32bc397](https://github.com/wKich/creevey/commit/32bc397e2c0e37d947df9d34a62aa356aa88ad41))
- 🎸 show error images in imagePreview ([5d2037a](https://github.com/wKich/creevey/commit/5d2037aa86a8a700a6a82e88f980eed5fba873a9))

# [0.7.0-beta.0](https://github.com/wKich/creevey/compare/v0.6.4...v0.7.0-beta.0) (2020-08-04)

### Bug Fixes

- 🐛 gracefully end worker processes ([e2d2548](https://github.com/wKich/creevey/commit/e2d254882ca8fa993d20725dd3132c6069f185f5))
- 🐛 remove scroll when change image in swap mode ([7ccc42c](https://github.com/wKich/creevey/commit/7ccc42cc36b3d1fef5964fcc60e40899b6d995fc))
- 🐛 tests hot reloading ([b96bfa9](https://github.com/wKich/creevey/commit/b96bfa9e9509d67dd685ee30c26b37b96eb20289))

### Features

- 🎸 support storybook v6.x ([9bb7397](https://github.com/wKich/creevey/commit/9bb7397b3e0dbc88f7f212aab4ee807ae25e8d64))

## [0.6.4](https://github.com/wKich/creevey/compare/v0.6.3...v0.6.4) (2020-07-27)

### Bug Fixes

- 🐛 hot-reloading issue, add readme notes ([5497b71](https://github.com/wKich/creevey/commit/5497b710053285a4f0b4cad075427b2ee7287be2))
- 🐛 react example loadash vulnerability ([e188d1d](https://github.com/wKich/creevey/commit/e188d1d4e43ddd4df0a00de54f37d61f3e2aecc0))
- 🐛 storybook bundle depends on core-js, regenerator-runtime ([ce596b9](https://github.com/wKich/creevey/commit/ce596b91665d74f68b0442d767d8e81a48e034c0))
- 🐛 watch stories on windows ([ce599cc](https://github.com/wKich/creevey/commit/ce599ccc0e9eaa31e01987297e1f5c6a899a56ac))

### Features

- 🎸 add disabled state to start button ([260193a](https://github.com/wKich/creevey/commit/260193a49f67e500db771688aae95e2fc1e4694b))
- 🎸 Save view mode ([ea461cc](https://github.com/wKich/creevey/commit/ea461ccb26c5888a1dff54077cac264f2ae4ab27))

## [0.6.3](https://github.com/wKich/creevey/compare/v0.6.2...v0.6.3) (2020-06-16)

### Bug Fixes

- 🐛 test reloading dont work well ([3049dfd](https://github.com/wKich/creevey/commit/3049dfdcda6bc7ae2c85fb6afbfa89cb0f8a1aeb))

## [0.6.2](https://github.com/wKich/creevey/compare/v0.6.1...v0.6.2) (2020-06-10)

### Bug Fixes

- 🐛 disable hot-reloading without `--ui` option ([3ea0792](https://github.com/wKich/creevey/commit/3ea0792a6612a01cb62a4650414b6aa26c138665))

## [0.6.1](https://github.com/wKich/creevey/compare/v0.6.0...v0.6.1) (2020-06-10)

### Bug Fixes

- 🐛 ERR_IPC_CHANNEL_CLOSED finally ([965e6de](https://github.com/wKich/creevey/commit/965e6de21acd4d77a9971f072d40f7c42d900bab))
- 🐛 mocha 7.2 multiple runs, remove old hacks ([0ca08be](https://github.com/wKich/creevey/commit/0ca08bebe436ebc91c0fbc501850339dea5fe0e2))

# [0.6.0](https://github.com/wKich/creevey/compare/v0.6.0-beta.8...v0.6.0) (2020-06-09)

### Bug Fixes

- 🐛 kind-of@6.0.2 vulnerability ([489783e](https://github.com/wKich/creevey/commit/489783ee489c5d4f9d0ca5de87dedb6be6e78e1e))
- 🐛 loader: remove vars in desctructuring ([8567fd6](https://github.com/wKich/creevey/commit/8567fd60e3ba67572e45f22629f639f6f17647b3))

# [0.6.0-beta.8](https://github.com/wKich/creevey/compare/v0.6.0-beta.7...v0.6.0-beta.8) (2020-06-04)

### Bug Fixes

- 🐛 output warning `Did you call 'load' twice` on reload ([1b2bbeb](https://github.com/wKich/creevey/commit/1b2bbeb8c7f8052514feab767b599b66fec3adf7))

# [0.6.0-beta.7](https://github.com/wKich/creevey/compare/v0.6.0-beta.6...v0.6.0-beta.7) (2020-06-02)

### Bug Fixes

- 🐛 webpack recursion IPC, again ([5083454](https://github.com/wKich/creevey/commit/5083454c1d330ad0abf2ac24ddeb73f1f5367f3a))

# [0.6.0-beta.6](https://github.com/wKich/creevey/compare/v0.6.0-beta.5...v0.6.0-beta.6) (2020-06-02)

### Bug Fixes

- 🐛 IPC messages recursion, again ([4500e92](https://github.com/wKich/creevey/commit/4500e92525307b1966be9fbce39c7bb50b18c25b))

# [0.6.0-beta.5](https://github.com/wKich/creevey/compare/v0.6.0-beta.4...v0.6.0-beta.5) (2020-06-02)

### Bug Fixes

- 🐛 webpack compiler process send messages recursion ([4fd2afe](https://github.com/wKich/creevey/commit/4fd2afeb7e2a2254eb1638f5ca2fc836550c59dd))

# [0.6.0-beta.4](https://github.com/wKich/creevey/compare/v0.6.0-beta.3...v0.6.0-beta.4) (2020-06-02)

### Bug Fixes

- 🐛 another fix to gracefully exit ([e433afd](https://github.com/wKich/creevey/commit/e433afd30b6a001c9cfcbc1d267557dd7d7f3ed3))
- 🐛 check element before capturing screenshot ([53df80b](https://github.com/wKich/creevey/commit/53df80bb2a7c234e5f0109d0f1c8beca88ddb1e9))
- 🐛 some small init/exit issues ([6c4d666](https://github.com/wKich/creevey/commit/6c4d666040eafdf721d17a0f40714af9a85ae109))

### Features

- 🎸 allow use `delay` with custom tests ([7a1ab33](https://github.com/wKich/creevey/commit/7a1ab337e52577f3fc934b5edca12638a1ea8e07))

# [0.6.0-beta.3](https://github.com/wKich/creevey/compare/v0.6.0-beta.2...v0.6.0-beta.3) (2020-05-27)

### Bug Fixes

- 🐛 EPIPE message on exit again ([a5bb06d](https://github.com/wKich/creevey/commit/a5bb06def9bb4598ee5619ab4942936845dea44c))
- 🐛 make loader be more aggressive ([78c3d53](https://github.com/wKich/creevey/commit/78c3d53d8439338e634349e9c7999f017ea1f10f))
- 🐛 soft-freeze mocha version on 7.1 ([5aa3f57](https://github.com/wKich/creevey/commit/5aa3f57ea0fcf3512646a7c346b89ba4f6057767))

# [0.6.0-beta.2](https://github.com/wKich/creevey/compare/v0.6.0-beta.1...v0.6.0-beta.2) (2020-05-18)

### Bug Fixes

- 🐛 correct shutdown workers ([30e7066](https://github.com/wKich/creevey/commit/30e70661b2e1c6b8aab9efbdd3af541c56e719f4))
- 🐛 correctly close browser session on SIGINT ([079b832](https://github.com/wKich/creevey/commit/079b8326f45d8b7a0de539c3ed2f105679a04534))
- 🐛 ignore removing bundle cache directory ([6be2bd7](https://github.com/wKich/creevey/commit/6be2bd789c5b259e3351169a47f1bb932ef5de44))

# [0.6.0-beta.1](https://github.com/wKich/creevey/compare/v0.6.0-beta.0...v0.6.0-beta.1) (2020-05-15)

### Bug Fixes

- 🐛 storybook framework detection on windows ([fb68cf1](https://github.com/wKich/creevey/commit/fb68cf168a1ad5704e2be00b456015dd2780bf0e))

# [0.6.0-beta.0](https://github.com/wKich/creevey/compare/v0.5.6...v0.6.0-beta.0) (2020-05-14)

### Bug Fixes

- 🐛 support latest selenium browser drivers ([0921aed](https://github.com/wKich/creevey/commit/0921aed898c19ddb38bd6949a6e85699dddaffd7))

### Features

- 🎸 add creevey-loader for webpack ([c15b32d](https://github.com/wKich/creevey/commit/c15b32ddcfbdc7fc906a6a03d27539f87e620a85))
- 🎸 rework load stories process ([e47f806](https://github.com/wKich/creevey/commit/e47f8067b6a18d066f60196605666ed8db6fadf1))

## [0.5.6](https://github.com/wKich/creevey/compare/v0.5.5...v0.5.6) (2020-05-04)

### Bug Fixes

- 🐛 handle worker initiating error ([dc8a4f6](https://github.com/wKich/creevey/commit/dc8a4f616a19d70adcd288de7b5bce89e6e46315))

## [0.5.5](https://github.com/wKich/creevey/compare/v0.5.4...v0.5.5) (2020-04-21)

### Features

- 🎸 add `saveReport` cli option, enabled by default ([88aa930](https://github.com/wKich/creevey/commit/88aa930dd61ce7902095a9a86cab36529b355014))
- 🎸 support .creevey config dir ([ba1c560](https://github.com/wKich/creevey/commit/ba1c5600295e5cc655370c004cf33dee4b364615))

## [0.5.4](https://github.com/wKich/creevey/compare/v0.5.3...v0.5.4) (2020-04-04)

### Bug Fixes

- 🐛 remove new code that added by mistake ([f4cbf8c](https://github.com/wKich/creevey/commit/f4cbf8cbc5d327f321da3f3dbf6b11da0e14583e))

## [0.5.3](https://github.com/wKich/creevey/compare/v0.5.2...v0.5.3) (2020-04-04)

### Bug Fixes

- 🐛 precompile decorator file for ie11 target ([f4b8742](https://github.com/wKich/creevey/commit/f4b8742a8848fd2656c6cd639ef8678e0e4f35c0))

## [0.5.2](https://github.com/wKich/creevey/compare/v0.5.1...v0.5.2) (2020-03-30)

### Bug Fixes

- 🐛 use selenium as deps, rename storybook peerDeps package ([3e0faa3](https://github.com/wKich/creevey/commit/3e0faa39976cf30e3cd95a38bd6326c81f1078c5))
- ignore \*.scss modules while loading stories ([075068a](https://github.com/wKich/creevey/commit/075068a9192db6c0ed18c4802144b32930433e60))

## [0.5.1](https://github.com/wKich/creevey/compare/v0.5.0...v0.5.1) (2020-03-26)

### Features

- 🎸 output story render error ([18e7d9d](https://github.com/wKich/creevey/commit/18e7d9dea772cc10e1f75173c4faa47155e9c934))

# [0.5.0](https://github.com/wKich/creevey/compare/v0.4.11...v0.5.0) (2020-03-25)

### Bug Fixes

- 🐛 gracefully close selenium session ([cd8b630](https://github.com/wKich/creevey/commit/cd8b630b10008db21bc57feb4ffac671fc40ad08))
- 🐛 improve blend view css filters ([6ba0687](https://github.com/wKich/creevey/commit/6ba0687f7f6e6839fe30843871daad5c04a58857))
- 🐛 jsdom localStorage warning ([d1099ff](https://github.com/wKich/creevey/commit/d1099ffbce27c8e6851c55970f3875680df6fabb))
- 🐛 take composite images without hiding scrollbar ([4b3d95a](https://github.com/wKich/creevey/commit/4b3d95a82d339070497b97cb4bd50435851b75de))

### Features

- 🎸 rewrite storybook decorator to be framework agnostic ([f2d7904](https://github.com/wKich/creevey/commit/f2d7904a70c981fa64891f40845b1bb2abed7559))
- 🎸 support safari for composite images ([d078448](https://github.com/wKich/creevey/commit/d07844883071607bd6424e82f239b36b401722cb))

## [0.4.11](https://github.com/wKich/creevey/compare/v0.4.10...v0.4.11) (2020-03-13)

### Bug Fixes

- 🐛 hide scroll only for composite screenshots ([d9753d2](https://github.com/wKich/creevey/commit/d9753d2405e0aefb90663070d30465b0c8528f50))

## [0.4.10](https://github.com/wKich/creevey/compare/v0.4.9...v0.4.10) (2020-03-13)

### Bug Fixes

- 🐛 skip by test name with multiple skip options ([3d0ef36](https://github.com/wKich/creevey/commit/3d0ef36c8e2a994c171133f3e0c479f92016a9a2))

## [0.4.9](https://github.com/wKich/creevey/compare/v0.4.8...v0.4.9) (2020-03-13)

### Bug Fixes

- 🐛 exclude `@babel/*` modules from skiping while fastload ([a785fcf](https://github.com/wKich/creevey/commit/a785fcf9cf5e8e591fcf11280eb040658319ace8))

## [0.4.8](https://github.com/wKich/creevey/compare/v0.4.7...v0.4.8) (2020-03-13)

### Bug Fixes

- 🐛 broken skip by test names ([e33c3d9](https://github.com/wKich/creevey/commit/e33c3d90b48df22540fc6cccaae71c47163b6599))

## [0.4.7](https://github.com/wKich/creevey/compare/v0.4.6...v0.4.7) (2020-03-13)

### Bug Fixes

- 🐛 register require.context before all other modules ([5474f87](https://github.com/wKich/creevey/commit/5474f87afe258022ad219db53c300305a143e6bb))

## [0.4.6](https://github.com/wKich/creevey/compare/v0.4.5...v0.4.6) (2020-03-13)

### Features

- 🎸 allow take composite screenshots in custom tests ([5dd1e7d](https://github.com/wKich/creevey/commit/5dd1e7d89b04b2629d9766f254a1b5f69bb5d17f))

## [0.4.5](https://github.com/wKich/creevey/compare/v0.4.4...v0.4.5) (2020-03-12)

### Features

- 🎸 add `delay` creevey story parameter ([49ecf00](https://github.com/wKich/creevey/commit/49ecf00ea90d2485833965794c1300ca7da4d17b))

## [0.4.4](https://github.com/wKich/creevey/compare/v0.4.3...v0.4.4) (2020-03-12)

### Features

- 🎸 add `debug` cli option ([cff35ea](https://github.com/wKich/creevey/commit/cff35eaad4bce400fb18b0f5daa520060cef5870))
- 🎸 improve creevey story params typings, simplify tests ([f78d372](https://github.com/wKich/creevey/commit/f78d372bff2837915ef7b0d0f22089fbe3607a18))

## [0.4.3](https://github.com/wKich/creevey/compare/v0.4.2...v0.4.3) (2020-03-11)

### Features

- 🎸 improve fastloading, to allow use side effects ([15ca5cc](https://github.com/wKich/creevey/commit/15ca5cc4ed73dff38707e8a713a03778663a7482))

## [0.4.2](https://github.com/wKich/creevey/compare/v0.4.1...v0.4.2) (2020-03-11)

### Bug Fixes

- 🐛 patch babel-register hook to support all extensions ([918ae27](https://github.com/wKich/creevey/commit/918ae2709a1f0fd7773cc44575d5ab3e9d2f4b29))

## [0.4.1](https://github.com/wKich/creevey/compare/v0.4.0...v0.4.1) (2020-03-10)

### Bug Fixes

- 🐛 some minor issues ([e309d56](https://github.com/wKich/creevey/commit/e309d56937a50fb544d7cd8b6366991b693ba111))

# [0.4.0](https://github.com/wKich/creevey/compare/v0.3.8...v0.4.0) (2020-03-04)

### Features

- 🎸 add test hot reloading, support new storybook configs ([7e282cb](https://github.com/wKich/creevey/commit/7e282cb2541d1a4f105a45474decd0dcf7e05759))

## [0.3.8](https://github.com/wKich/creevey/compare/v0.3.7...v0.3.8) (2020-03-03)

### Bug Fixes

- 🐛 ie11 don't work due async fn in types.ts file ([c1e8bbc](https://github.com/wKich/creevey/commit/c1e8bbc8747e68e26656f21f2d6247f654324cf2))
- 🐛 register pirates hook before any compiler ([7acde29](https://github.com/wKich/creevey/commit/7acde290f162ea651746f4d230073055a4bed956))

## [0.3.7](https://github.com/wKich/creevey/compare/v0.3.6...v0.3.7) (2020-02-20)

### Bug Fixes

- 🐛 fix bug with sync call onCompare ([e5c9e2c](https://github.com/wKich/creevey/commit/e5c9e2c4b8c19238608d4bba5bc3d2bd9f6871f6))

### Features

- 🎸 add onClick on teststatus for filter ([c28261c](https://github.com/wKich/creevey/commit/c28261c829e683dcfbee480d682f4cda61958dfc))

## [0.3.6](https://github.com/wKich/creevey/compare/v0.3.5...v0.3.6) (2020-02-17)

### Bug Fixes

- 🐛 output error message while init for master process ([2f48e37](https://github.com/wKich/creevey/commit/2f48e37d90422d4574b3c9186c68daf5a7339f50))
- ignore various non-js extensions on story load ([55f0ed0](https://github.com/wKich/creevey/commit/55f0ed01b1c235ba8e03f0c2defab8023087d46e))

## [0.3.5](https://github.com/wKich/creevey/compare/v0.3.4...v0.3.5) (2020-02-11)

### Bug Fixes

- 🐛 don't mutate test scope on image assertion ([939c1fe](https://github.com/wKich/creevey/commit/939c1fed02eee5af441a99e9451d40adaf379ffc))
- 🐛 don't show tests without status by status filter ([9d79781](https://github.com/wKich/creevey/commit/9d797817f306165b42d0e6f79ef95841d4fe24cd))
- 🐛 improve configs load process ([611af95](https://github.com/wKich/creevey/commit/611af959d9b91e1826e0d357620f56ee6b394d93))
- 🐛 remove mkdirp dependency ([e5cabef](https://github.com/wKich/creevey/commit/e5cabef02ae096318b3281cfe099fb6e275106fc))
- 🐛 support renamed stories ([003ff10](https://github.com/wKich/creevey/commit/003ff109a25475d7c849d06ba408e29090709a9b))
- 🐛 support windows paths to load storybook, disable debug ([7250b6a](https://github.com/wKich/creevey/commit/7250b6ad85862985e2e30a874bd508d79bf1b175))
- correct handle process errors for worker ([1d7f035](https://github.com/wKich/creevey/commit/1d7f035b66bb2d5638679d4cb4f50958da629773))

## [0.3.4](https://github.com/wKich/creevey/compare/v0.3.3...v0.3.4) (2020-01-17)

### Bug Fixes

- 🐛 improve fast-loading, throw non-syntax errors on require ([4f288b7](https://github.com/wKich/creevey/commit/4f288b76e932090622f295f00dca12a179403a4f))

### Features

- 🎸 allow pass diff options to pixelmatch ([32d6bb1](https://github.com/wKich/creevey/commit/32d6bb1868f11aa416a0872e927b97768b8eb2aa))
- 🎸 improve stories initialization speed ([1009728](https://github.com/wKich/creevey/commit/10097280d24a24fb4033e4516458b2e62a0dbe63))

### BREAKING CHANGES

- `threshold` config option are replaced to `diffOptions`

## [0.3.3](https://github.com/wKich/creevey/compare/v0.3.2...v0.3.3) (2020-01-16)

### Bug Fixes

- 🐛 add hint for images preview ([ddf3615](https://github.com/wKich/creevey/commit/ddf3615ca36e1f36ff02a348ad2cec0bc819a304))
- 🐛 move mocha typing to devDeps ([50f4a92](https://github.com/wKich/creevey/commit/50f4a9284e081054688114d0fd1054c8bbb3c16b))

## [0.3.2](https://github.com/wKich/creevey/compare/v0.3.1...v0.3.2) (2020-01-15)

### Bug Fixes

- 🐛 initiate browser after all stories has been loaded ([f95d8dc](https://github.com/wKich/creevey/commit/f95d8dcad1dd1feb1bcd5ae548131edd8c0ceec9))

## [0.3.1](https://github.com/wKich/creevey/compare/v0.3.0...v0.3.1) (2020-01-13)

### Bug Fixes

- 🐛 capture screenshot of element with non-integer size ([28fc1cc](https://github.com/wKich/creevey/commit/28fc1cc9162db6bb9085321883bd04abdb4ae880))
- 🐛 require config when path don't have extension ([93fb11b](https://github.com/wKich/creevey/commit/93fb11b0d4740b6da598a9e923dafb9c75394c70))

# [0.3.0](https://github.com/wKich/creevey/compare/v0.2.6...v0.3.0) (2020-01-10)

### Features

- 🎸 remove support explicit test cases ([4b56ddf](https://github.com/wKich/creevey/commit/4b56ddf7617785ce93cd17fe9e82e928c56011bb))

## [0.2.6](https://github.com/wKich/creevey/compare/v0.2.5...v0.2.6) (2020-01-10)

### Features

- 🎸 add `tests` story parameter for public usage ([c4d7dc0](https://github.com/wKich/creevey/commit/c4d7dc0191b1aafba2aa9f6d18d6d99d4093fcb3))
- 🎸 add `toMatchImages` assertion for chai ([1fef184](https://github.com/wKich/creevey/commit/1fef1847248405fc32e76d4d3b4387e200290d8c))

## [0.2.5](https://github.com/wKich/creevey/compare/v0.2.4...v0.2.5) (2020-01-10)

### Bug Fixes

- 🐛 correct work update with new report structure ([5bf17c1](https://github.com/wKich/creevey/commit/5bf17c10799f136d73639d9075866c6f308e30ed))

### Features

- 🎸 add `reportDir/screenDir` cli options ([3b059a6](https://github.com/wKich/creevey/commit/3b059a6e36a33d5963be216368391ed940b17b65))
- 🎸 load stories in nodejs and generate tests in runtime ([3f276a4](https://github.com/wKich/creevey/commit/3f276a4d06e006878cd4733797c2a262abf73ea6))

## [0.2.4](https://github.com/wKich/creevey/compare/v0.2.3...v0.2.4) (2019-12-23)

### Bug Fixes

- 🐛 convert export story names to storybook format ([43b227e](https://github.com/wKich/creevey/commit/43b227ed69c67bbedfac555f31c845fdb2b04840))
- 🐛 don't use webdriver object serialization ([c4545f0](https://github.com/wKich/creevey/commit/c4545f071269426caa24599d6e1b72d933d60152))

## [0.2.3](https://github.com/wKich/creevey/compare/v0.2.2...v0.2.3) (2019-12-19)

### Bug Fixes

- 🐛 allow skip tests by kinds ([ddc8a27](https://github.com/wKich/creevey/commit/ddc8a272e2a24cec2c25479788791a46ef1a8943)), closes [#12](https://github.com/wKich/creevey/issues/12)
- 🐛 wrap long suite/test titles ([c7f7920](https://github.com/wKich/creevey/commit/c7f79203b3ecbb3526312084897513c827bcf598))

## [0.2.2](https://github.com/wKich/creevey/compare/v0.2.1...v0.2.2) (2019-12-11)

### Bug Fixes

- 🐛 correct publish artifacts for TeamCity reporter ([5949bc3](https://github.com/wKich/creevey/commit/5949bc3a21a393ec0b15d0b104f59e4eae0f668a))

## [0.2.1](https://github.com/wKich/creevey/compare/v0.2.0...v0.2.1) (2019-12-11)

### Bug Fixes

- 🐛 allow click on checkbox in sidebar ([a750d46](https://github.com/wKich/creevey/commit/a750d46734290773298a07efef25d4eb2f992842))
- 🐛 correct report teamcity artifacts ([dfc7251](https://github.com/wKich/creevey/commit/dfc72514c1fa2f692a80e6bf1092255cbe7d47a9))
- 🐛 firefox SlideView ([91ef075](https://github.com/wKich/creevey/commit/91ef0750f1579b27a478725152f3fde95abcdb24))

# [0.2.0](https://github.com/wKich/creevey/compare/v0.1.7...v0.2.0) (2019-12-05)

### Bug Fixes

- 🐛 a lot of bugs with views, approve and more ([45c86d3](https://github.com/wKich/creevey/commit/45c86d30468c80508aedb5c52a4e8c9e96a34daf))
- 🐛 ImagesView correctly resize image in most cases ([258506a](https://github.com/wKich/creevey/commit/258506a3877bb32d4b38d6ce20d15372095edadf))
- 🐛 improve SideBar tests view ([a495fc1](https://github.com/wKich/creevey/commit/a495fc1b0321763092105ef641fc48b23548440b))
- 🐛 switch between tests ([ae25d59](https://github.com/wKich/creevey/commit/ae25d59d3d6e8433b522d13994d7e096e0958651))
- tests status move down, when scroll is shown ([9df0523](https://github.com/wKich/creevey/commit/9df0523e9a4b8bc54488e45eb106e8077303f146))

### Features

- 🎸 improve markup for ResultPage by prototypes ([09cd297](https://github.com/wKich/creevey/commit/09cd297010b1677fb8900d4e8db5be9629be10e7))
- 🎸 output penging tests count ([793d60f](https://github.com/wKich/creevey/commit/793d60fd771f267d7711b8853d1381405b4ee01f))
- 🎸 sticky SideBar with sitcky header ([06cc16c](https://github.com/wKich/creevey/commit/06cc16cc79be0756ff117f40447a9eaa28bf5f2a))
- 🎸 update SideBar markup by prototype ([7ba22fd](https://github.com/wKich/creevey/commit/7ba22fd766ca86de92da89b4a2260bc3495e16ab))
- swap images buttons by prototype ([5ce4214](https://github.com/wKich/creevey/commit/5ce4214c9a18f48b654534fbd77e297dce9cb7b7))
- view tests results count in sidebar ([9300f07](https://github.com/wKich/creevey/commit/9300f07abeb7cb4271cf85478493a9090cdc8127))

## [0.1.7](https://github.com/wKich/creevey/compare/v0.1.6...v0.1.7) (2019-11-22)

### Features

- 🎸 allow skip test stories by kinds ([1cb4968](https://github.com/wKich/creevey/commit/1cb49688616ac3060012e800428f1f67d066c2ab))

## [0.1.6](https://github.com/wKich/creevey/compare/v0.1.5...v0.1.6) (2019-11-22)

### Bug Fixes

- 🐛 handle regexp skip options ([d07689e](https://github.com/wKich/creevey/commit/d07689e428420084826391ae3438dc81d2b02922))
- 🐛 output correct reported screenshot path for teamcity ([fb7d230](https://github.com/wKich/creevey/commit/fb7d230258644c18649939dfb9dd92b5421d6ca1))
- 🐛 significantly improve perfomance ([422f023](https://github.com/wKich/creevey/commit/422f023cbb1b290ddd8e1b103856a6d2db293b52))

## [0.1.5](https://github.com/wKich/creevey/compare/v0.1.4...v0.1.5) (2019-11-20)

### Bug Fixes

- 🐛 require stories in nodejs env ([0e00fa6](https://github.com/wKich/creevey/commit/0e00fa629610960e0fab7fcea02596c4aa7ce107))

### Features

- 🎸 support write tests inside stories ([ce9ed7d](https://github.com/wKich/creevey/commit/ce9ed7d09c0312a073e0897ece8e082d17b0cb30))

## [0.1.4](https://github.com/wKich/creevey/compare/v0.1.3...v0.1.4) (2019-11-18)

### Bug Fixes

- **master:** dont output skipped tests ([1e23321](https://github.com/wKich/creevey/commit/1e233218054719f72d2d0bbf040d83b68955dca2))
- **utils:** improve error message when storybook page not available ([4c44763](https://github.com/wKich/creevey/commit/4c4476347e8aa5c90d6a84d680ee6d091d1897be))
- **utils:** try resolve ip only if address is localhost ([4aa6c69](https://github.com/wKich/creevey/commit/4aa6c693f537543ad86cebfc3e071583422a555a))
- **worker:** exit master process if worker couldn't start ([e682a47](https://github.com/wKich/creevey/commit/e682a47a9900c12941e0bb6ab72d9ef7628faa7c))

### Reverts

- Revert "fix(utils): replace ip resolver back" ([4e48706](https://github.com/wKich/creevey/commit/4e48706164abdbc1bc8765e022a99b41f60b29d5))

## [0.1.3](https://github.com/wKich/creevey/compare/v0.1.2...v0.1.3) (2019-11-07)

### Bug Fixes

- **storybook:** correct fill params for old storybook ([35ae070](https://github.com/wKich/creevey/commit/35ae07064f388da6b7fd841f05ad1e40865b79b2))

## [0.1.2](https://github.com/wKich/creevey/compare/v0.1.1...v0.1.2) (2019-11-07)

### Bug Fixes

- **storybook:** read prop of undefined ([b96bb48](https://github.com/wKich/creevey/commit/b96bb48ba1938b74d9c06ebb497c6be481d02f81))

## [0.1.1](https://github.com/wKich/creevey/compare/v0.1.0...v0.1.1) (2019-11-07)

### Bug Fixes

- **utils:** replace ip resolver back ([e87bcdd](https://github.com/wKich/creevey/commit/e87bcddc0dad156c27e4200a61fe30b2bc24ef2b))

# [0.1.0](https://github.com/wKich/creevey/compare/v0.0.30...v0.1.0) (2019-11-07)

### Features

- simplify images directory ([0d15f73](https://github.com/wKich/creevey/commit/0d15f73e411ec6d93681d78573592c907b479e09))

## [0.0.30](https://github.com/wKich/creevey/compare/v0.0.29...v0.0.30) (2019-11-05)

### Features

- **storybook:** disable animations for webdriver ([acfc34c](https://github.com/wKich/creevey/commit/acfc34ce50372699c0ffdb5dfe83b02a002aea44))

## [0.0.29](https://github.com/wKich/creevey/compare/v0.0.28...v0.0.29) (2019-10-11)

### Bug Fixes

- **storybook:** ie11 hot-reload ([e8e45c4](https://github.com/wKich/creevey/commit/e8e45c4859d4b89053a4bc2884cc7cb64c76e130))

## [0.0.28](https://github.com/wKich/creevey/compare/v0.0.27...v0.0.28) (2019-10-09)

### Bug Fixes

- **storybook:** dont consider scroll while capture element ([6fb9ecb](https://github.com/wKich/creevey/commit/6fb9ecb19561a245d132acbf7ac3989e74b513cc))

## [0.0.27](https://github.com/wKich/creevey/compare/v0.0.26...v0.0.27) (2019-10-07)

### Bug Fixes

- **storybook:** chrome serialization stories error ([b994e9e](https://github.com/wKich/creevey/commit/b994e9e835be0e342ffa1b5d6545a326e7eb82c2))

## [0.0.26](https://github.com/wKich/creevey/compare/v0.0.25...v0.0.26) (2019-10-07)

### Bug Fixes

- **storybook:** chrome serialization stories error ([23d51ed](https://github.com/wKich/creevey/commit/23d51ede18ea329a50e05cffd8a4c46751f3647a))

## [0.0.25](https://github.com/wKich/creevey/compare/v0.0.24...v0.0.25) (2019-10-04)

### Bug Fixes

- **runner:** mark removed tests as skiped ([822d92a](https://github.com/wKich/creevey/commit/822d92a607899c23e0cd38396839f1e0674dcb46))
- **runner:** support skip story option ([f094548](https://github.com/wKich/creevey/commit/f094548016fa57ae26ca6b91c61dc8547eac3285))
- **storybook:** hide scroll while screenshot, few issues ([313cfa4](https://github.com/wKich/creevey/commit/313cfa498f19c8fa7407b365ee998795c9488877))
- correct convert kind/story into storyId ([12d3c3a](https://github.com/wKich/creevey/commit/12d3c3af184cca6634246ad70010e32c515ecc8a))
- **storybook:** make parameters optional ([6c674bd](https://github.com/wKich/creevey/commit/6c674bd615a0fbea5a42ff930eb7da54ed63bd45))
- few types issues ([1ee82f8](https://github.com/wKich/creevey/commit/1ee82f8e3e28e1e37e1bc50fc5f5d081a468e0dd))

### Features

- support composite images ([594f6cb](https://github.com/wKich/creevey/commit/594f6cbee1245e92353c223053af151e6d887434))
- **worker:** support creevey skip story option ([2e36464](https://github.com/wKich/creevey/commit/2e36464654c1adccc3d8203a69fec71408925f24))
- make testDir optional ([714f76f](https://github.com/wKich/creevey/commit/714f76f1addc2b1fafcd95f0b96ac34a1100bbea))
- **storybook:** pass creevey story parameters ([df259fe](https://github.com/wKich/creevey/commit/df259feb630f03914e5153e37bfe76d5ce587738))
- generate tests from stories in runtime ([2625f93](https://github.com/wKich/creevey/commit/2625f93c83c52c8f2408a00022462cf2ae950e87))
- output removed tests status ([442f4da](https://github.com/wKich/creevey/commit/442f4daee06f831350eae16fe2c7acc372abda25))

## [0.0.24](https://github.com/wKich/creevey/compare/v0.0.23...v0.0.24) (2019-09-16)

### Features

- more improvments ([39c601d](https://github.com/wKich/creevey/commit/39c601d65c43ef276ee398d30c872702902d433f))
- support storybook kind depth levels ([7d2523d](https://github.com/wKich/creevey/commit/7d2523dae79050bd662b223463bd15cdb1470798))

## [0.0.23](https://github.com/wKich/creevey/compare/v0.0.22...v0.0.23) (2019-09-12)

### Bug Fixes

- export mocha/chai typings ([1340c4d](https://github.com/wKich/creevey/commit/1340c4db4603bd897053c42507398d6b5ab7eb88))

## [0.0.22](https://github.com/wKich/creevey/compare/v0.0.21...v0.0.22) (2019-09-11)

### Bug Fixes

- set-value vulnerability CVE-2019-10747 ([2db0463](https://github.com/wKich/creevey/commit/2db0463538b10f2d09674c8ed7a4e8078fabec37))
- **server:** pass args to parser, skip folders while copy static ([1343c28](https://github.com/wKich/creevey/commit/1343c28b5694a43d99f52086ffffed5c51cace9c))
- **storybook:** improve export and types ([11a8dc2](https://github.com/wKich/creevey/commit/11a8dc2b7ff28a2d5ab46845a5885a9d467419e1))
- **storybook:** support storybook@3.x ([8c952cc](https://github.com/wKich/creevey/commit/8c952cc43abb9d490c2436ad6433d322feb58d62))
- optional hooks, fix default testRegex ([8da03d2](https://github.com/wKich/creevey/commit/8da03d211adb6a8902f48e884dd414f03296e53e))

### Features

- add storybook decorator ([4f97fd6](https://github.com/wKich/creevey/commit/4f97fd6a5e12e1a06836337299aece8ef0890dcd))
- remove mocha-ui ([1abf335](https://github.com/wKich/creevey/commit/1abf3352e15bd1fb777ff7ac35a8d00b87969c4a))
- **cli:** add `update` option for batch approve ([ed2a1f6](https://github.com/wKich/creevey/commit/ed2a1f61430a8befdddb148b426601e39b90540a))

## [0.0.21](https://github.com/wKich/creevey/compare/v0.0.20...v0.0.21) (2019-08-30)

### Bug Fixes

- **ImagesView:** improve view for side-by-side view component ([831a34e](https://github.com/wKich/creevey/commit/831a34ec024c991f96d45c831b082d765a3d6dc0))
- **pool:** improve restart workers process ([82fb1ea](https://github.com/wKich/creevey/commit/82fb1eaf30f2d7a729559595a07e047a87265dba))

## [0.0.20](https://github.com/wKich/creevey/compare/v0.0.19...v0.0.20) (2019-08-27)

### Bug Fixes

- **client:** better output error message ([16eaa06](https://github.com/wKich/creevey/commit/16eaa06fdb1f1deb76d1dfa60fc55cc756eb85a3))
- **pool:** correct retry tests by timeout ([1c11e52](https://github.com/wKich/creevey/commit/1c11e528d379b4f05330cb438e5ff58d5762f917))

### Features

- **client:** fit large images into sidepage ([c4adbca](https://github.com/wKich/creevey/commit/c4adbca0a636b49b239255e91d4fd15799386c90))

## [0.0.19](https://github.com/wKich/creevey/compare/v0.0.18...v0.0.19) (2019-08-21)

### Bug Fixes

- **reporter:** try to fix parallel output on teamcity ([0ff4faf](https://github.com/wKich/creevey/commit/0ff4faf9bd4dc504a190e76ef673ed9203152203))

## [0.0.18](https://github.com/wKich/creevey/compare/v0.0.17...v0.0.18) (2019-08-21)

### Bug Fixes

- **reporter:** try to fix parallel output on teamcity ([8371fce](https://github.com/wKich/creevey/commit/8371fcefe08e56d60bc4ff123731e1819b77b5c3))

## [0.0.17](https://github.com/wKich/creevey/compare/v0.0.16...v0.0.17) (2019-08-21)

### Bug Fixes

- **reporter:** try to fix parallel output on teamcity ([5de07d9](https://github.com/wKich/creevey/commit/5de07d9a72939ef62b4fb99bff624a2d79089c91))

## [0.0.16](https://github.com/wKich/creevey/compare/v0.0.15...v0.0.16) (2019-08-21)

### Bug Fixes

- **reporter:** output full filepath in metadata ([142c3a6](https://github.com/wKich/creevey/commit/142c3a6d359a95ba226d6fce35719bf0f134e19d))

## [0.0.15](https://github.com/wKich/creevey/compare/v0.0.14...v0.0.15) (2019-08-21)

### Bug Fixes

- **reporter:** output correct test name in teamcity ([e753e71](https://github.com/wKich/creevey/commit/e753e71b4484b8d82ed725e8ca1d023bfdd4993d))

### Features

- **reporter:** output image as test metadata ([eb6a03a](https://github.com/wKich/creevey/commit/eb6a03a0f819992f40c37a739561a28a00c30a6d))
- **runner:** allow setup browser resolution ([a6b1b92](https://github.com/wKich/creevey/commit/a6b1b92621ef8db5754e25bbe8cafe3153805134))

## [0.0.14](https://github.com/wKich/creevey/compare/v0.0.13...v0.0.14) (2019-08-21)

## [0.0.13](https://github.com/wKich/creevey/compare/v0.0.12...v0.0.13) (2019-07-01)

### Bug Fixes

- **worker:** correct `retries` prop name ([747ba56](https://github.com/wKich/creevey/commit/747ba56d101783e8767e246ae8d929aacfb1f637))

## [0.0.12](https://github.com/wKich/creevey/compare/v0.0.11...v0.0.12) (2019-07-01)

### Bug Fixes

- **server:** pass TC version to envs worker ([78585ae](https://github.com/wKich/creevey/commit/78585ae4b7788a4c2a00cf63d33c3ead469ab703))

## [0.0.11](https://github.com/wKich/creevey/compare/v0.0.10...v0.0.11) (2019-07-01)

### Bug Fixes

- **reporter:** output retry test as passed for tc ([847db55](https://github.com/wKich/creevey/commit/847db5578bb34312cff2d5a409be5950b8a491f3))

## [0.0.10](https://github.com/wKich/creevey/compare/v0.0.9...v0.0.10) (2019-06-26)

### Bug Fixes

- **runner:** send stop event ([ade8f22](https://github.com/wKich/creevey/commit/ade8f224b0688072c526f2f1b2a2fcfcc68a09c1))

## [0.0.9](https://github.com/wKich/creevey/compare/v0.0.8...v0.0.9) (2019-06-26)

### Features

- **chai-image:** allow pass `threshold` option ([81394c8](https://github.com/wKich/creevey/commit/81394c804bceedc6a1b579d149a902cd36176035))
- **reporter:** add `chalk` to color output ([87e4d9a](https://github.com/wKich/creevey/commit/87e4d9aaac0457c7a17b6b5849ebce817e1ef64f))

## [0.0.8](https://github.com/wKich/creevey/compare/v0.0.7...v0.0.8) (2019-06-25)

### Bug Fixes

- **worker:** send error message on fail, restart on timeout ([8ddb265](https://github.com/wKich/creevey/commit/8ddb2654afe56d41035afaa511f6c04e677015fd))

## [0.0.7](https://github.com/wKich/creevey/compare/v0.0.6...v0.0.7) (2019-06-24)

### Bug Fixes

- **chai-image:** enable anti-aliasing for pixelmatch ([ef50047](https://github.com/wKich/creevey/commit/ef50047ef4550448d5291fba6138526fbd3b5495))
- **parser:** don't include ignored tests ([985c758](https://github.com/wKich/creevey/commit/985c7586909edeb457ab9df35fc896774cba3bfb))
- **server:** set `skip` flag require ([db235d3](https://github.com/wKich/creevey/commit/db235d3fecac99f65f56220b176d4a7284e09c92))
- **worker:** patch mocha to support skip tests for browser ([1de1ea0](https://github.com/wKich/creevey/commit/1de1ea071ada8724e0240430a4cd21299c757abb))

### Features

- **client:** output disabled skiped tests ([8d7f596](https://github.com/wKich/creevey/commit/8d7f596ecadc5235c74bdb36e0ccaa6235914725))

## [0.0.6](https://github.com/wKich/creevey/compare/v0.0.5...v0.0.6) (2019-06-20)

### Bug Fixes

- **client:** don't output skipped tests ([da51ce6](https://github.com/wKich/creevey/commit/da51ce6f0c64a0f72f98b27ed2362135d3330665))
- **worker:** escape test path string ([694cd32](https://github.com/wKich/creevey/commit/694cd32bc737b7445f683e69e5cc044f23b0a666))

### Features

- **client:** improve switcher, move start button ([50259d5](https://github.com/wKich/creevey/commit/50259d5df878edeb3fbff5d511c635276acef207))
- **server:** allow define uniq options for each browser ([4280a32](https://github.com/wKich/creevey/commit/4280a326859ece52701fc5802cab7b3b9a65ec8f))

## [0.0.5](https://github.com/wKich/creevey/compare/v0.0.4...v0.0.5) (2019-06-17)

### Bug Fixes

- **client:** output new images ([cb082a8](https://github.com/wKich/creevey/commit/cb082a81a6b1964c0c641b47aa868f4dbe5c5025))
- **utils:** better handle reset mouse position ([c85854d](https://github.com/wKich/creevey/commit/c85854df805ee974ef53c90d17bdcc9025076408))
- better handle reset mouse position ([f777a7b](https://github.com/wKich/creevey/commit/f777a7bec8951b60a0f4df4b5aa44221aae5f617))

## [0.0.4](https://github.com/wKich/creevey/compare/v0.0.3...v0.0.4) (2019-06-14)

### Bug Fixes

- **client:** encode image url path ([aef999c](https://github.com/wKich/creevey/commit/aef999c9d1d824b2fbc4ace485ff16d307cddc30))
- **utils:** reset mouse position ([1f79e61](https://github.com/wKich/creevey/commit/1f79e6166d65631b7c076171926e6f3e542e0481))

### Features

- **client:** update suites statues ([ace43df](https://github.com/wKich/creevey/commit/ace43dffb9d2f1207679f6c724d9fb434a225d82))

## [0.0.3](https://github.com/wKich/creevey/compare/v0.0.2...v0.0.3) (2019-06-03)

### Bug Fixes

- **runner:** parallel test running ([4931127](https://github.com/wKich/creevey/commit/4931127c3c4086c79a833dafc782eff9d369996b))
- **server:** browser config merge ([3d3dc2a](https://github.com/wKich/creevey/commit/3d3dc2aa7853886fcecdfd8863b4a3d9e2f94f78))
- **server:** restart worker on error ([73abcf7](https://github.com/wKich/creevey/commit/73abcf7d6535555bcf13e1d571c00fafcd91e848))
- **worker:** improve test reporter ([e18878c](https://github.com/wKich/creevey/commit/e18878c68c56c66838d085a2e93788c6c7ab9ac8))

### Features

- **client:** add `BlendView` component ([5da4a8d](https://github.com/wKich/creevey/commit/5da4a8d5e8ea36ce8e1f45cd1eeed2cdfb33935d))
- **client:** add `SlideView` component ([dda0aa9](https://github.com/wKich/creevey/commit/dda0aa9f8253d9a446e4b2f5129334a941638dd3))
- **client:** add different image views ([9f08bcc](https://github.com/wKich/creevey/commit/9f08bcced07ef619f951c8489c5774202868bef6))
- **client:** output test error message ([e277298](https://github.com/wKich/creevey/commit/e27729869a8e383a3ae6b2ef1ff73784e8880d9e))
- **client:** use `emotion` for styles ([35ba95a](https://github.com/wKich/creevey/commit/35ba95a286aa355162fccfd39b4a93a054a58f50))
- render approved images ([af80081](https://github.com/wKich/creevey/commit/af8008112bc98dc3d7d0bfa5baaef91783210abe))
- **server:** better handle ws messages ([64cb126](https://github.com/wKich/creevey/commit/64cb126e5c4b671d99b4df4f308e1ec6f3251447))

## [0.0.2](https://github.com/wKich/creevey/compare/v0.0.1...v0.0.2) (2019-05-29)

### Features

- **worker:** add reporter mvp ([ead4e91](https://github.com/wKich/creevey/commit/ead4e911de04cfd857f83e5e77b921b425b25513))

## [0.0.1](https://github.com/wKich/creevey/compare/8e42cec432747648018c1c06447b3530c971a7e4...v0.0.1) (2019-05-21)

### Bug Fixes

- **client:** handle start/stop messages ([6aac604](https://github.com/wKich/creevey/commit/6aac6048d3130c5f85026ee9051f6090dff6164b))
- **runner:** retries condition ([e8a2e2f](https://github.com/wKich/creevey/commit/e8a2e2f05d4e60ad0cee380d39adc6f791d94d26))
- **server:** served static path ([8893555](https://github.com/wKich/creevey/commit/8893555f8c94c986e4869f12f55be23fbfcaacc3))
- **TestRestultView:** always open last image ([b7f9cd6](https://github.com/wKich/creevey/commit/b7f9cd6a33c0b9f97cec10a5d5b89526eab92689))
- **TestRestultView:** improve images output ([60849d2](https://github.com/wKich/creevey/commit/60849d2199699a5cf46caa21ab7a9b31595cc4d9))
- **utils:** change test scope path. Move browser to the last ([4cd00ed](https://github.com/wKich/creevey/commit/4cd00ed5a3ac9a9371e6aedfc4cbff7d47d3e2bf))
- **worker:** clean images, strong regexp for grep ([c55da42](https://github.com/wKich/creevey/commit/c55da4291e7a813e39b6aca13ea8ca1d2764c17a))
- **worker:** increase mocha timeout ([e841f5c](https://github.com/wKich/creevey/commit/e841f5c72bb55069db3827424a102153c1c3141e))
- export types ([87e502e](https://github.com/wKich/creevey/commit/87e502e93418f7d38a6e6762c50a118bfa94e58d))

### Features

- **chai-image:** save images in multiple runs ([96d1229](https://github.com/wKich/creevey/commit/96d12299238834d9731e65def930ed2c0a65c6e4))
- **client:** add results view component ([a1a0d34](https://github.com/wKich/creevey/commit/a1a0d34f8db5dd89fa69863c62a7d04b795b1958))
- **server:** add `ui` flag, wait workers ready event ([3608974](https://github.com/wKich/creevey/commit/3608974468daa1958beb5d156269da280b38f586))
- **server:** allow to use custom reporter ([f778dee](https://github.com/wKich/creevey/commit/f778dee187f1255169e97d7eb1f490c978d7feae))
- **server:** offline mode mvp, copy static ([fb609e6](https://github.com/wKich/creevey/commit/fb609e6e1bf1a864e412b42f70bf1dbd0cba89e1))
- **server:** save/load test report ([08a5fd9](https://github.com/wKich/creevey/commit/08a5fd9ec4dd8be6833bcd42d8685c9af94514c1))
- **server:** use cluster fork instead preprocessors ([6a1136b](https://github.com/wKich/creevey/commit/6a1136be5b9dcac285af1c500d344c079ba70325))
- allow approve images from ui ([86335f1](https://github.com/wKich/creevey/commit/86335f119c5fef35e783242c0670b4293243cb45))
- **server:** send status with images ([da92d7c](https://github.com/wKich/creevey/commit/da92d7c86e05558dc17cabc59c555a7062677460))
- **server:** serve static images from report dir ([f0817fd](https://github.com/wKich/creevey/commit/f0817fd8cd20822227438545497624df02797a93))
- **TestResultView:** render result images ([991148e](https://github.com/wKich/creevey/commit/991148e0cbf060fbd3bb0ec60fbf02dd7bc3e2a9))
- initial version ([8e42cec](https://github.com/wKich/creevey/commit/8e42cec432747648018c1c06447b3530c971a7e4))
