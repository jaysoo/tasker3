bump 1
# Tasker

Task management app to demo Nx onboarding.

There is an existing `verify.yml` GitHub Action workflow that will run the following:

```
# Prettier check
pnpm format:check

# ESLint
pnpm lint

# Next.js
pnpm --filter "@tasker/web" build

# Vitest
pnpm --filter "@tasker/*" test

# Playwright
pnpm --filter "@tasker/e2e-web" e2e
```

Here is my Warp block for reference: https://app.warp.dev/block/UIndYWOJJDLK268mT2f6Xn

The total time in CI is about 26m. With Nx, Nx Cloud, and distribution, that time is cut down to about 8m 30s. Playwright tests go from 24m to 5m 30s, or a 77% improvement.

- BEFORE NX: https://github.com/taskerinc/tasker/actions/runs/9085742807
- AFTER NX: https://github.com/taskerinc/tasker/actions/runs/9142047116

This is the worst-case scenario where the changeset affects all projects in the monorepo. The average time will be less than 8m 30s (or 5m 30s for Playwright alone).

## Add Nx CLI

Run this command to start:

```
npx nx@latest init
```

For the prompts, answer with the following:

```
npx nx@latest init

 NX   🧐 Checking dependencies


 NX   Recommended Plugins:

Add these Nx plugins to integrate with the tools used in your workspace.

✔ Which plugins would you like to add? Press <Space> to select and <Enter> to submit. · @nx/eslint, @nx/vite, @nx/next, @nx/playwright

✔ Do you want to start using Nx in your package.json scripts? · Yes

 NX   🐳 Nx initialization


 NX   🧑‍🔧 Please answer the following questions about the scripts found in your workspace in order to generate task runner configuration

✔ Which scripts need to be run in order? (e.g. before building a project, dependent projects must be built) · build, lint, test

✔ Which scripts are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not) · build, lint, test

✔ Does the "build" script create any outputs? If not, leave blank, otherwise provide a path relative to a project root (e.g. dist, lib, build, coverage) · .next

✔ Does the "lint" script create any outputs? If not, leave blank, otherwise provide a path relative to a project root (e.g. dist, lib, build, coverage) ·

✔ Does the "test" script create any outputs? If not, leave blank, otherwise provide a path relative to a project root (e.g. dist, lib, build, coverage) ·
```

The answers above will ensure that the correct plugins are installed, and that our existing package scripts are cacheable through Nx.

See my warp run: https://app.warp.dev/block/vMM9pD8Urb0VLk5YfUmK7E

You can skip Nx Cloud for now. Push to CI and see that it runs successfully. The workflow will still be slow since we're not using Nx properly in CI yet.

To enable Nx properly, run `npx nx ci-workflow --ci github`. This will generate a new workflow .yml file. Replace the existing workflow file with the new one:

```
name: CI
on:
  push:
    branches:
      # Change this if your primary branch is not main
      - main
  pull_request:

# Needed for nx-set-shas when run on the main branch
permissions:
  actions: read
  contents: read

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
      # This line enables distribution
      # The "--stop-agents-after" is optional, but allows idle agents to shut down once the "e2e-ci" targets have been requested
      # - run: npx nx-cloud start-ci-run --distribute-on="5 linux-medium-js" --stop-agents-after="e2e-ci"
      - run: npm ci

      - uses: nrwl/nx-set-shas@v4

      - run: |
          pnpm format:check
          pnpm exec nx affected -t lint test build
          pnpm exec nx affected -t e2e-ci --parallel 3
```

This will ensure that only projects that are affected by current changeset are checked. e.g. if the changeset only includes updates to `README.md`, then no projects will be affected, thus lint/test/etc. are skipped. Using affected brings down the average CI time since not everything needs to be verified.

## Nx Cloud & Distribution

Since we skipped Nx Cloud during `nx init`, run `npx nx connect` to complete the setup.

For distribution to work, uncomment this line in the workflow .yml file:

```
# This line enables distribution
# The "--stop-agents-after" is optional, but allows idle agents to shut down once the "e2e-ci" targets have been requested
- run: npx nx-cloud start-ci-run --distribute-on="5 linux-medium-js" --stop-agents-after="e2e-ci"
```
