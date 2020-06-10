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
