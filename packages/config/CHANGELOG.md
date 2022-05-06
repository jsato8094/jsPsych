# @jspsych/config

## 1.3.0

### Minor Changes

- [`3463e977`](https://github.com/jspsych/jsPsych/commit/3463e9778f3c2787b9c75c0f9bd7d19cc79798b3) Thanks [@becky-gilbert](https://github.com/becky-gilbert)! - Add the updatePluginVersions gulp task. This task looks at each of the docs/plugins markdown files, finds the page title and "Current version" string, adds the current version number (from the package.json file), and uses the package name as the page title.

## 1.2.0

### Minor Changes

- [#2431](https://github.com/jspsych/jsPsych/pull/2431) [`87f332f9`](https://github.com/jspsych/jsPsych/commit/87f332f92540eef028bbed7284e30c1cf614cc96) Thanks [@bjoluc](https://github.com/bjoluc)! - Implement an `updateUnpkgLinks` Gulp task to update each unpkg link with a precise version number to the corresponding package's current version as defined in the package's `package.json`.

### Patch Changes

- [#2505](https://github.com/jspsych/jsPsych/pull/2505) [`9486bc50`](https://github.com/jspsych/jsPsych/commit/9486bc509f8fe4b4ac4b93510ddd8fd17e5f1b05) Thanks [@bjoluc](https://github.com/bjoluc)! - Fix css path rewriting in `createCoreDistArchive` Gulp task when `link` tags do not end in `/>`

## 1.1.0

### Minor Changes

- [#2357](https://github.com/jspsych/jsPsych/pull/2357) [`c44ac202`](https://github.com/jspsych/jsPsych/commit/c44ac2024ae51cf14efa60ca285bb2e4dc0ebef7) Thanks [@bjoluc](https://github.com/bjoluc)! - Add a VERSION.md file to the release archive created by the `createCoreDistArchive` Gulp task

## 1.0.0

### Major Changes

- [`bc058590`](https://github.com/jspsych/jsPsych/commit/bc058590950285e52116f809e4ccc57bae5a67f5) Thanks [@bjoluc](https://github.com/bjoluc)! - Initial release
